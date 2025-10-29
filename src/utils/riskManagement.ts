// Elite Risk Management System
// Implements Kelly Criterion, Fixed Fractional, Position Sizing, and Risk Validation

export interface RiskLimits {
  max_portfolio_risk_percent: number;
  max_position_size_percent: number;
  max_daily_loss_usd?: number;
  max_daily_loss_percent?: number;
  max_drawdown_percent: number;
  max_leverage: number;
  max_open_positions: number;
  max_correlated_positions: number;
  max_order_size_usd?: number;
  max_slippage_percent: number;
  require_stop_loss: boolean;
  circuit_breaker_enabled: boolean;
  circuit_breaker_loss_percent: number;
  circuit_breaker_cool_down_minutes: number;
  last_circuit_breaker_at?: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  average_entry_price: number;
  current_price_usd?: number;
  unrealized_pnl_usd?: number;
}

export interface PositionSizingParams {
  accountSize: number;
  riskPercentPerTrade: number;
  entryPrice: number;
  stopLossPrice: number;
  method: 'fixed_fractional' | 'kelly' | 'equal_weight' | 'risk_parity';
  winRate?: number; // For Kelly
  avgWinLoss?: number; // For Kelly
  volatility?: number; // For risk parity
}

export interface RiskCheckResult {
  allowed: boolean;
  reason?: string;
  warnings: string[];
  calculatedRisk: {
    dollarRisk: number;
    percentRisk: number;
    positionSize: number;
    positionValue: number;
  };
}

// ======================
// POSITION SIZING ALGORITHMS
// ======================

/**
 * Kelly Criterion: Optimal position sizing based on win rate and payoff ratio
 * Formula: f = (bp - q) / b
 * where: f = fraction of capital to bet
 *        b = odds received on the bet (avg win / avg loss)
 *        p = probability of winning
 *        q = probability of losing (1-p)
 */
export function calculateKellyPositionSize(
  accountSize: number,
  winRate: number,
  avgWinLossRatio: number,
  fractionalKelly: number = 0.25 // Use fractional Kelly to reduce volatility
): number {
  const p = winRate;
  const q = 1 - p;
  const b = avgWinLossRatio;
  
  const kellyFraction = (b * p - q) / b;
  
  // Apply fractional Kelly (typically 25-50% of full Kelly)
  const adjustedKelly = Math.max(0, Math.min(kellyFraction * fractionalKelly, 0.25));
  
  return accountSize * adjustedKelly;
}

/**
 * Fixed Fractional: Risk fixed % of account per trade
 */
export function calculateFixedFractionalSize(
  accountSize: number,
  riskPercent: number,
  entryPrice: number,
  stopLossPrice: number
): number {
  const riskAmount = accountSize * (riskPercent / 100);
  const priceRisk = Math.abs(entryPrice - stopLossPrice);
  
  if (priceRisk === 0) return 0;
  
  const quantity = riskAmount / priceRisk;
  return quantity;
}

/**
 * Equal Weight: Simple equal allocation
 */
export function calculateEqualWeightSize(
  accountSize: number,
  currentPositions: number,
  maxPositions: number,
  currentPrice: number
): number {
  const allocationPerPosition = accountSize / maxPositions;
  const quantity = allocationPerPosition / currentPrice;
  return quantity;
}

/**
 * Risk Parity: Size positions inversely to volatility
 */
export function calculateRiskParitySize(
  accountSize: number,
  assetVolatility: number,
  portfolioVolatilities: number[],
  currentPrice: number
): number {
  const totalInverseVol = portfolioVolatilities.reduce((sum, vol) => sum + (1 / vol), 0);
  const weight = (1 / assetVolatility) / totalInverseVol;
  
  const allocationAmount = accountSize * weight;
  const quantity = allocationAmount / currentPrice;
  return quantity;
}

/**
 * Master position sizing function
 */
export function calculatePositionSize(params: PositionSizingParams): number {
  const { accountSize, riskPercentPerTrade, entryPrice, stopLossPrice, method } = params;
  
  switch (method) {
    case 'kelly':
      if (!params.winRate || !params.avgWinLoss) {
        throw new Error('Kelly method requires winRate and avgWinLoss parameters');
      }
      return calculateKellyPositionSize(accountSize, params.winRate, params.avgWinLoss);
      
    case 'fixed_fractional':
      return calculateFixedFractionalSize(accountSize, riskPercentPerTrade, entryPrice, stopLossPrice);
      
    case 'equal_weight':
      return calculateEqualWeightSize(accountSize, 0, 10, entryPrice);
      
    case 'risk_parity':
      if (!params.volatility) {
        throw new Error('Risk parity method requires volatility parameter');
      }
      return calculateRiskParitySize(accountSize, params.volatility, [params.volatility], entryPrice);
      
    default:
      return calculateFixedFractionalSize(accountSize, riskPercentPerTrade, entryPrice, stopLossPrice);
  }
}

// ======================
// RISK VALIDATION
// ======================

export interface TradeRiskParams {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  stopLossPrice?: number;
  accountSize: number;
  currentPositions: Position[];
  riskLimits: RiskLimits;
  todayPnL: number;
}

/**
 * Comprehensive pre-trade risk check
 */
export function validateTradeRisk(params: TradeRiskParams): RiskCheckResult {
  const warnings: string[] = [];
  const {
    symbol,
    quantity,
    entryPrice,
    stopLossPrice,
    accountSize,
    currentPositions,
    riskLimits,
    todayPnL,
  } = params;

  // Calculate position value and risk
  const positionValue = quantity * entryPrice;
  const positionSizePercent = (positionValue / accountSize) * 100;
  
  const dollarRisk = stopLossPrice 
    ? Math.abs(quantity * (entryPrice - stopLossPrice))
    : positionValue * 0.02; // Default 2% if no stop
  const percentRisk = (dollarRisk / accountSize) * 100;

  // CHECK 1: Stop loss required?
  if (riskLimits.require_stop_loss && !stopLossPrice) {
    return {
      allowed: false,
      reason: 'Stop loss is required for all trades',
      warnings,
      calculatedRisk: { dollarRisk, percentRisk, positionSize: quantity, positionValue },
    };
  }

  // CHECK 2: Position size limit
  if (positionSizePercent > riskLimits.max_position_size_percent) {
    return {
      allowed: false,
      reason: `Position size ${positionSizePercent.toFixed(1)}% exceeds limit of ${riskLimits.max_position_size_percent}%`,
      warnings,
      calculatedRisk: { dollarRisk, percentRisk, positionSize: quantity, positionValue },
    };
  }

  // CHECK 3: Portfolio risk limit
  if (percentRisk > riskLimits.max_portfolio_risk_percent) {
    return {
      allowed: false,
      reason: `Risk ${percentRisk.toFixed(2)}% exceeds portfolio limit of ${riskLimits.max_portfolio_risk_percent}%`,
      warnings,
      calculatedRisk: { dollarRisk, percentRisk, positionSize: quantity, positionValue },
    };
  }

  // CHECK 4: Max open positions
  if (currentPositions.length >= riskLimits.max_open_positions) {
    return {
      allowed: false,
      reason: `Already at max open positions (${riskLimits.max_open_positions})`,
      warnings,
      calculatedRisk: { dollarRisk, percentRisk, positionSize: quantity, positionValue },
    };
  }

  // CHECK 5: Daily loss limit
  if (riskLimits.max_daily_loss_usd && todayPnL < -riskLimits.max_daily_loss_usd) {
    return {
      allowed: false,
      reason: `Daily loss limit exceeded: -$${Math.abs(todayPnL).toFixed(2)}`,
      warnings,
      calculatedRisk: { dollarRisk, percentRisk, positionSize: quantity, positionValue },
    };
  }

  if (riskLimits.max_daily_loss_percent) {
    const dailyLossPercent = Math.abs((todayPnL / accountSize) * 100);
    if (dailyLossPercent > riskLimits.max_daily_loss_percent) {
      return {
        allowed: false,
        reason: `Daily loss ${dailyLossPercent.toFixed(2)}% exceeds limit of ${riskLimits.max_daily_loss_percent}%`,
        warnings,
        calculatedRisk: { dollarRisk, percentRisk, positionSize: quantity, positionValue },
      };
    }
  }

  // CHECK 6: Circuit breaker
  if (riskLimits.circuit_breaker_enabled && riskLimits.last_circuit_breaker_at) {
    const coolDownMs = riskLimits.circuit_breaker_cool_down_minutes * 60 * 1000;
    const timeSinceBreaker = Date.now() - new Date(riskLimits.last_circuit_breaker_at).getTime();
    
    if (timeSinceBreaker < coolDownMs) {
      const minutesLeft = Math.ceil((coolDownMs - timeSinceBreaker) / 60000);
      return {
        allowed: false,
        reason: `Circuit breaker active. ${minutesLeft} minutes remaining in cool-down period.`,
        warnings,
        calculatedRisk: { dollarRisk, percentRisk, positionSize: quantity, positionValue },
      };
    }
  }

  // CHECK 7: Order size limit
  if (riskLimits.max_order_size_usd && positionValue > riskLimits.max_order_size_usd) {
    return {
      allowed: false,
      reason: `Order size $${positionValue.toFixed(2)} exceeds limit of $${riskLimits.max_order_size_usd}`,
      warnings,
      calculatedRisk: { dollarRisk, percentRisk, positionSize: quantity, positionValue },
    };
  }

  // CHECK 8: Concentration risk (already have position in this symbol?)
  const existingPosition = currentPositions.find(p => p.symbol === symbol);
  if (existingPosition) {
    warnings.push(`Adding to existing ${symbol} position. Total exposure will increase.`);
  }

  // WARNINGS: Add soft warnings
  if (positionSizePercent > riskLimits.max_position_size_percent * 0.7) {
    warnings.push(`Position size ${positionSizePercent.toFixed(1)}% is approaching limit`);
  }

  if (percentRisk > riskLimits.max_portfolio_risk_percent * 0.7) {
    warnings.push(`Risk ${percentRisk.toFixed(2)}% is approaching limit`);
  }

  return {
    allowed: true,
    warnings,
    calculatedRisk: { dollarRisk, percentRisk, positionSize: quantity, positionValue },
  };
}

// ======================
// PORTFOLIO RISK METRICS
// ======================

export function calculatePortfolioRisk(positions: Position[], accountSize: number) {
  const totalValue = positions.reduce((sum, p) => 
    sum + (p.quantity * (p.current_price_usd || p.average_entry_price)), 0
  );
  
  const totalUnrealizedPnL = positions.reduce((sum, p) => 
    sum + (p.unrealized_pnl_usd || 0), 0
  );
  
  const portfolioExposure = (totalValue / accountSize) * 100;
  const unrealizedPnLPercent = (totalUnrealizedPnL / accountSize) * 100;
  
  // Calculate concentration (largest position %)
  const positionValues = positions.map(p => 
    p.quantity * (p.current_price_usd || p.average_entry_price)
  );
  const largestPosition = Math.max(...positionValues, 0);
  const concentration = (largestPosition / accountSize) * 100;
  
  return {
    totalValue,
    totalUnrealizedPnL,
    portfolioExposure,
    unrealizedPnLPercent,
    concentration,
    numPositions: positions.length,
  };
}

// ======================
// CORRELATION ANALYSIS
// ======================

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][]; // correlation coefficients
  highlyCorrelated: Array<{
    symbol1: string;
    symbol2: string;
    correlation: number;
  }>;
}

/**
 * Calculate correlation between two price series
 * Returns value between -1 (perfect negative) and 1 (perfect positive)
 */
export function calculateCorrelation(series1: number[], series2: number[]): number {
  if (series1.length !== series2.length || series1.length === 0) {
    return 0;
  }
  
  const n = series1.length;
  const mean1 = series1.reduce((a, b) => a + b, 0) / n;
  const mean2 = series2.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let sum1 = 0;
  let sum2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = series1[i] - mean1;
    const diff2 = series2[i] - mean2;
    numerator += diff1 * diff2;
    sum1 += diff1 * diff1;
    sum2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sum1 * sum2);
  return denominator === 0 ? 0 : numerator / denominator;
}

// ======================
// VALUE AT RISK (VaR)
// ======================

export interface VaRResult {
  var95: number; // 95% confidence VaR
  var99: number; // 99% confidence VaR
  expectedShortfall: number; // Average loss beyond VaR
}

/**
 * Calculate Value at Risk using historical simulation
 */
export function calculateVaR(
  returns: number[], // Historical daily returns
  portfolioValue: number,
  confidenceLevel: number = 0.95
): number {
  if (returns.length === 0) return 0;
  
  // Sort returns ascending (worst to best)
  const sortedReturns = [...returns].sort((a, b) => a - b);
  
  // Find the return at the confidence level
  const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  const varReturn = sortedReturns[index];
  
  // Convert to dollar amount
  return Math.abs(varReturn * portfolioValue);
}

/**
 * Calculate Expected Shortfall (CVaR) - average loss beyond VaR
 */
export function calculateExpectedShortfall(
  returns: number[],
  portfolioValue: number,
  confidenceLevel: number = 0.95
): number {
  if (returns.length === 0) return 0;
  
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const cutoffIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  
  // Average of returns worse than VaR
  const tailReturns = sortedReturns.slice(0, cutoffIndex);
  const avgTailReturn = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
  
  return Math.abs(avgTailReturn * portfolioValue);
}

// ======================
// DEFAULT RISK LIMITS
// ======================

export const DEFAULT_RISK_LIMITS: RiskLimits = {
  max_portfolio_risk_percent: 2,
  max_position_size_percent: 10,
  max_daily_loss_percent: 5,
  max_drawdown_percent: 20,
  max_leverage: 1,
  max_open_positions: 10,
  max_correlated_positions: 5,
  max_slippage_percent: 1,
  require_stop_loss: true,
  circuit_breaker_enabled: true,
  circuit_breaker_loss_percent: 5,
  circuit_breaker_cool_down_minutes: 60,
};
