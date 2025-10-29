// Utility functions for macro cycle calculations

/**
 * Calculate logarithmic regression fair value
 * Based on Bitcoin's historical log-linear growth
 */
export function calculateLogRegFairValue(asset: string): number {
  // Simplified log-reg calculation
  // In production, use actual regression coefficients from historical data
  const now = new Date();
  const genesis = new Date('2009-01-03'); // Bitcoin genesis block
  const daysSinceGenesis = Math.floor((now.getTime() - genesis.getTime()) / (1000 * 60 * 60 * 24));
  
  if (asset === 'BTC') {
    // Simplified log regression formula: price = a * ln(days) + b
    // These coefficients are approximations
    const a = 15000;
    const b = -100000;
    return Math.max(1000, a * Math.log(daysSinceGenesis) + b);
  } else if (asset === 'ETH') {
    // ETH fair value (simplified)
    return 2800;
  }
  
  return 50000; // Default for other assets
}

/**
 * Calculate risk metric (0-100)
 * Combines price deviation, cycle progress, and momentum
 */
export function calculateRiskMetric(asset: string, currentPrice: number): number {
  const fairValue = calculateLogRegFairValue(asset);
  const deviation = (currentPrice - fairValue) / fairValue;
  
  // Get cycle progress
  const cycleProgress = getCycleProgress();
  
  // Calculate components
  const deviationScore = Math.min(100, Math.max(0, (deviation + 1) * 50)); // -100% to +100% maps to 0-100
  const cycleScore = cycleProgress.percentComplete; // 0-100%
  
  // Weighted combination
  const riskScore = (deviationScore * 0.6) + (cycleScore * 0.4);
  
  return Math.round(Math.min(100, Math.max(0, riskScore)));
}

/**
 * Get current cycle progress based on halving dates
 */
export function getCycleProgress() {
  const halvingDates = [
    new Date('2012-11-28'),
    new Date('2016-07-09'),
    new Date('2020-05-11'),
    new Date('2024-04-20'),
    new Date('2028-04-15'), // Estimated next halving
  ];
  
  const now = new Date();
  let currentCycle = 0;
  let lastHalving = halvingDates[0];
  let nextHalving = halvingDates[1];
  
  // Find current cycle
  for (let i = 0; i < halvingDates.length - 1; i++) {
    if (now >= halvingDates[i] && now < halvingDates[i + 1]) {
      currentCycle = i;
      lastHalving = halvingDates[i];
      nextHalving = halvingDates[i + 1];
      break;
    }
  }
  
  const cycleDuration = nextHalving.getTime() - lastHalving.getTime();
  const elapsed = now.getTime() - lastHalving.getTime();
  const percentComplete = Math.round((elapsed / cycleDuration) * 100);
  
  const daysSinceHalving = Math.floor(elapsed / (1000 * 60 * 60 * 24));
  const daysUntilNext = Math.floor((nextHalving.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    currentCycle,
    percentComplete: Math.min(100, percentComplete),
    daysSinceHalving,
    daysUntilNext,
    lastHalving,
    nextHalving,
  };
}

/**
 * Determine market phase based on risk and cycle progress
 */
export function getPhaseStatus(riskScore: number, cycleProgress: number): string {
  if (riskScore < 30 && cycleProgress < 40) {
    return 'Accumulation';
  } else if (riskScore < 60 && cycleProgress < 70) {
    return 'Expansion';
  } else if (riskScore >= 60) {
    return 'Euphoria';
  } else {
    return 'Recession';
  }
}

/**
 * Calculate moving average
 */
export function calculateMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Calculate exponential moving average
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  let ema = data[0];
  
  result.push(ema);
  
  for (let i = 1; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
    result.push(ema);
  }
  
  return result;
}

/**
 * Generate logarithmic regression bands
 */
export function generateLogRegBands(asset: string) {
  const fairValue = calculateLogRegFairValue(asset);
  
  // Standard deviation multipliers
  const bands = {
    upper3: fairValue * 10, // +3σ (extreme overvaluation)
    upper2: fairValue * 5,  // +2σ (high overvaluation)
    upper1: fairValue * 2.5, // +1σ (moderate overvaluation)
    fair: fairValue,
    lower1: fairValue * 0.5, // -1σ (moderate undervaluation)
    lower2: fairValue * 0.25, // -2σ (high undervaluation)
    lower3: fairValue * 0.1, // -3σ (extreme undervaluation)
  };
  
  return bands;
}
