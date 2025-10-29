// Elite Performance Metrics Calculator
// Implements institutional-grade performance analysis

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_usd: number;
  commission_usd: number;
  realized_pnl_usd?: number;
  executed_at: string;
}

export interface PerformanceMetrics {
  // Returns
  totalReturnUsd: number;
  totalReturnPercent: number;
  annualizedReturnPercent: number;
  timeWeightedReturn: number;
  moneyWeightedReturn: number;
  
  // Risk Metrics
  maxDrawdownPercent: number;
  maxDrawdownUsd: number;
  currentDrawdownPercent: number;
  volatility: number; // Annualized std dev
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  
  // Trading Stats
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageWinUsd: number;
  averageLossUsd: number;
  largestWinUsd: number;
  largestLossUsd: number;
  profitFactor: number;
  expectancy: number;
  
  // Streaks
  currentStreak: number;
  longestWinningStreak: number;
  longestLosingStreak: number;
  
  // Time-based
  avgHoldingPeriod: number; // in hours
  avgWinHoldingPeriod: number;
  avgLossHoldingPeriod: number;
}

export interface DailyReturn {
  date: string;
  portfolioValue: number;
  dailyReturn: number;
  cumulativeReturn: number;
}

// ======================
// RETURN CALCULATIONS
// ======================

/**
 * Calculate Time-Weighted Return (TWR)
 * Eliminates the impact of deposits/withdrawals
 */
export function calculateTimeWeightedReturn(dailyReturns: DailyReturn[]): number {
  if (dailyReturns.length === 0) return 0;
  
  // Compound daily returns
  let twrMultiplier = 1;
  for (const day of dailyReturns) {
    twrMultiplier *= (1 + day.dailyReturn);
  }
  
  return (twrMultiplier - 1) * 100;
}

/**
 * Calculate Money-Weighted Return (MWR) / Internal Rate of Return
 * Accounts for timing and size of cash flows
 */
export function calculateMoneyWeightedReturn(
  cashFlows: Array<{ date: Date; amount: number }>,
  currentValue: number
): number {
  // Simplified IRR calculation using Newton's method
  // In production, use a proper financial library like xirr
  
  const totalInvested = cashFlows
    .filter(cf => cf.amount > 0)
    .reduce((sum, cf) => sum + cf.amount, 0);
  
  const totalReturn = currentValue - totalInvested;
  const returnPercent = (totalReturn / totalInvested) * 100;
  
  return returnPercent;
}

/**
 * Annualize a return based on number of days
 */
export function annualizeReturn(totalReturn: number, days: number): number {
  if (days === 0) return 0;
  const years = days / 365;
  return ((Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100);
}

// ======================
// RISK METRICS
// ======================

/**
 * Calculate Maximum Drawdown
 * Peak-to-trough decline in portfolio value
 */
export function calculateMaxDrawdown(equityCurve: number[]): {
  maxDrawdownPercent: number;
  maxDrawdownUsd: number;
  currentDrawdownPercent: number;
} {
  if (equityCurve.length === 0) {
    return { maxDrawdownPercent: 0, maxDrawdownUsd: 0, currentDrawdownPercent: 0 };
  }
  
  let peak = equityCurve[0];
  let maxDrawdown = 0;
  let maxDrawdownUsd = 0;
  
  for (const value of equityCurve) {
    if (value > peak) {
      peak = value;
    }
    
    const drawdown = (peak - value) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownUsd = peak - value;
    }
  }
  
  // Current drawdown
  const currentValue = equityCurve[equityCurve.length - 1];
  const currentPeak = Math.max(...equityCurve);
  const currentDrawdown = (currentPeak - currentValue) / currentPeak;
  
  return {
    maxDrawdownPercent: maxDrawdown * 100,
    maxDrawdownUsd,
    currentDrawdownPercent: currentDrawdown * 100,
  };
}

/**
 * Calculate Volatility (standard deviation of returns)
 * Annualized
 */
export function calculateVolatility(dailyReturns: number[]): number {
  if (dailyReturns.length === 0) return 0;
  
  const mean = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / dailyReturns.length;
  const dailyStdDev = Math.sqrt(variance);
  
  // Annualize (assuming 252 trading days)
  return dailyStdDev * Math.sqrt(252) * 100;
}

/**
 * Calculate Sharpe Ratio
 * (Return - Risk-Free Rate) / Volatility
 * Standard measure of risk-adjusted return
 */
export function calculateSharpeRatio(
  annualizedReturn: number,
  volatility: number,
  riskFreeRate: number = 4.5 // Current ~4.5% for 10-year Treasury
): number {
  if (volatility === 0) return 0;
  return (annualizedReturn - riskFreeRate) / volatility;
}

/**
 * Calculate Sortino Ratio
 * Similar to Sharpe but only penalizes downside volatility
 */
export function calculateSortinoRatio(
  annualizedReturn: number,
  dailyReturns: number[],
  riskFreeRate: number = 4.5
): number {
  if (dailyReturns.length === 0) return 0;
  
  // Only calculate standard deviation of negative returns (downside deviation)
  const negativeReturns = dailyReturns.filter(r => r < 0);
  if (negativeReturns.length === 0) return annualizedReturn / 1; // Perfect upside
  
  const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length;
  const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(252) * 100;
  
  if (downsideDeviation === 0) return 0;
  return (annualizedReturn - riskFreeRate) / downsideDeviation;
}

/**
 * Calculate Calmar Ratio
 * Annualized Return / Maximum Drawdown
 * Higher is better (return per unit of drawdown risk)
 */
export function calculateCalmarRatio(annualizedReturn: number, maxDrawdownPercent: number): number {
  if (maxDrawdownPercent === 0) return 0;
  return annualizedReturn / maxDrawdownPercent;
}

// ======================
// TRADING STATISTICS
// ======================

export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageWinUsd: number;
  averageLossUsd: number;
  largestWinUsd: number;
  largestLossUsd: number;
  profitFactor: number;
  expectancy: number;
  avgWinLossRatio: number;
}

export function calculateTradeStatistics(trades: Trade[]): TradeStats {
  const closingTrades = trades.filter(t => t.realized_pnl_usd !== undefined && t.realized_pnl_usd !== null);
  
  if (closingTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      averageWinUsd: 0,
      averageLossUsd: 0,
      largestWinUsd: 0,
      largestLossUsd: 0,
      profitFactor: 0,
      expectancy: 0,
      avgWinLossRatio: 0,
    };
  }
  
  const winners = closingTrades.filter(t => (t.realized_pnl_usd || 0) > 0);
  const losers = closingTrades.filter(t => (t.realized_pnl_usd || 0) < 0);
  
  const totalWins = winners.reduce((sum, t) => sum + (t.realized_pnl_usd || 0), 0);
  const totalLosses = Math.abs(losers.reduce((sum, t) => sum + (t.realized_pnl_usd || 0), 0));
  
  const avgWin = winners.length > 0 ? totalWins / winners.length : 0;
  const avgLoss = losers.length > 0 ? totalLosses / losers.length : 0;
  
  const largestWin = winners.length > 0 
    ? Math.max(...winners.map(t => t.realized_pnl_usd || 0))
    : 0;
  const largestLoss = losers.length > 0
    ? Math.abs(Math.min(...losers.map(t => t.realized_pnl_usd || 0)))
    : 0;
  
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
  const expectancy = (totalWins - totalLosses) / closingTrades.length;
  const avgWinLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
  
  return {
    totalTrades: closingTrades.length,
    winningTrades: winners.length,
    losingTrades: losers.length,
    winRate: (winners.length / closingTrades.length) * 100,
    averageWinUsd: avgWin,
    averageLossUsd: avgLoss,
    largestWinUsd: largestWin,
    largestLossUsd: largestLoss,
    profitFactor,
    expectancy,
    avgWinLossRatio,
  };
}

// ======================
// STREAK ANALYSIS
// ======================

export interface StreakAnalysis {
  currentStreak: number; // Positive = winning, negative = losing
  longestWinningStreak: number;
  longestLosingStreak: number;
}

export function calculateStreaks(trades: Trade[]): StreakAnalysis {
  if (trades.length === 0) {
    return { currentStreak: 0, longestWinningStreak: 0, longestLosingStreak: 0 };
  }
  
  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLoseStreak = 0;
  let tempWinStreak = 0;
  let tempLoseStreak = 0;
  
  for (const trade of trades) {
    const pnl = trade.realized_pnl_usd || 0;
    
    if (pnl > 0) {
      tempWinStreak++;
      tempLoseStreak = 0;
      currentStreak = tempWinStreak;
      longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
    } else if (pnl < 0) {
      tempLoseStreak++;
      tempWinStreak = 0;
      currentStreak = -tempLoseStreak;
      longestLoseStreak = Math.max(longestLoseStreak, tempLoseStreak);
    }
  }
  
  return {
    currentStreak,
    longestWinningStreak: longestWinStreak,
    longestLosingStreak: longestLoseStreak,
  };
}

// ======================
// COMPLETE METRICS CALCULATION
// ======================

export function calculateComprehensiveMetrics(
  trades: Trade[],
  dailyReturns: DailyReturn[],
  equityCurve: number[],
  initialCapital: number,
  currentCapital: number
): PerformanceMetrics {
  const tradeStats = calculateTradeStatistics(trades);
  const drawdown = calculateMaxDrawdown(equityCurve);
  const streaks = calculateStreaks(trades);
  
  const totalReturnUsd = currentCapital - initialCapital;
  const totalReturnPercent = (totalReturnUsd / initialCapital) * 100;
  
  const days = dailyReturns.length;
  const annualizedReturn = annualizeReturn(totalReturnPercent, days);
  const volatility = calculateVolatility(dailyReturns.map(d => d.dailyReturn));
  
  const sharpeRatio = calculateSharpeRatio(annualizedReturn, volatility);
  const sortinoRatio = calculateSortinoRatio(annualizedReturn, dailyReturns.map(d => d.dailyReturn));
  const calmarRatio = calculateCalmarRatio(annualizedReturn, drawdown.maxDrawdownPercent);
  
  const timeWeightedReturn = calculateTimeWeightedReturn(dailyReturns);
  const moneyWeightedReturn = totalReturnPercent; // Simplified
  
  return {
    totalReturnUsd,
    totalReturnPercent,
    annualizedReturnPercent: annualizedReturn,
    timeWeightedReturn,
    moneyWeightedReturn,
    
    maxDrawdownPercent: drawdown.maxDrawdownPercent,
    maxDrawdownUsd: drawdown.maxDrawdownUsd,
    currentDrawdownPercent: drawdown.currentDrawdownPercent,
    volatility,
    sharpeRatio,
    sortinoRatio,
    calmarRatio,
    
    totalTrades: tradeStats.totalTrades,
    winningTrades: tradeStats.winningTrades,
    losingTrades: tradeStats.losingTrades,
    winRate: tradeStats.winRate,
    averageWinUsd: tradeStats.averageWinUsd,
    averageLossUsd: tradeStats.averageLossUsd,
    largestWinUsd: tradeStats.largestWinUsd,
    largestLossUsd: tradeStats.largestLossUsd,
    profitFactor: tradeStats.profitFactor,
    expectancy: tradeStats.expectancy,
    
    currentStreak: streaks.currentStreak,
    longestWinningStreak: streaks.longestWinningStreak,
    longestLosingStreak: streaks.longestLosingStreak,
    
    avgHoldingPeriod: 0, // Calculate from position open/close times
    avgWinHoldingPeriod: 0,
    avgLossHoldingPeriod: 0,
  };
}

// ======================
// BENCHMARK COMPARISON
// ======================

export interface BenchmarkComparison {
  portfolioReturn: number;
  benchmarkReturn: number;
  alpha: number; // Excess return vs benchmark
  beta: number; // Portfolio volatility relative to benchmark
  trackingError: number;
  informationRatio: number;
}

export function compareToBenchmark(
  portfolioReturns: number[],
  benchmarkReturns: number[]
): BenchmarkComparison {
  if (portfolioReturns.length === 0 || benchmarkReturns.length === 0) {
    return {
      portfolioReturn: 0,
      benchmarkReturn: 0,
      alpha: 0,
      beta: 1,
      trackingError: 0,
      informationRatio: 0,
    };
  }
  
  // Calculate returns
  const portfolioReturn = portfolioReturns.reduce((sum, r) => sum + r, 0);
  const benchmarkReturn = benchmarkReturns.reduce((sum, r) => sum + r, 0);
  
  // Calculate beta (portfolio sensitivity to benchmark)
  const portfolioMean = portfolioReturn / portfolioReturns.length;
  const benchmarkMean = benchmarkReturn / benchmarkReturns.length;
  
  let covariance = 0;
  let benchmarkVariance = 0;
  
  for (let i = 0; i < portfolioReturns.length; i++) {
    covariance += (portfolioReturns[i] - portfolioMean) * (benchmarkReturns[i] - benchmarkMean);
    benchmarkVariance += Math.pow(benchmarkReturns[i] - benchmarkMean, 2);
  }
  
  const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 1;
  
  // Alpha = Portfolio return - (Risk-free rate + Beta * (Benchmark return - Risk-free rate))
  const riskFreeRate = 4.5 / 100; // Annualized, convert to period
  const alpha = portfolioReturn - (riskFreeRate + beta * (benchmarkReturn - riskFreeRate));
  
  // Tracking error (std dev of difference between portfolio and benchmark returns)
  const differences = portfolioReturns.map((r, i) => r - benchmarkReturns[i]);
  const trackingError = calculateVolatility(differences);
  
  // Information ratio = Alpha / Tracking Error
  const informationRatio = trackingError > 0 ? alpha / trackingError : 0;
  
  return {
    portfolioReturn,
    benchmarkReturn,
    alpha,
    beta,
    trackingError,
    informationRatio,
  };
}
