// Real P&L Calculator - Replaces Mock Data with Actual Calculations

export interface PriceHistory {
  timestamp: Date;
  price: number;
}

/**
 * Calculate day change from historical prices
 */
export function calculateDayChange(
  currentPrice: number,
  priceHistory: PriceHistory[]
): { change: number; changePercent: number } {
  if (priceHistory.length === 0) {
    return { change: 0, changePercent: 0 };
  }

  // Find price 24 hours ago
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const historicalPrice = priceHistory
    .filter(h => h.timestamp <= oneDayAgo)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

  if (!historicalPrice) {
    return { change: 0, changePercent: 0 };
  }

  const change = currentPrice - historicalPrice.price;
  const changePercent = (change / historicalPrice.price) * 100;

  return { change, changePercent };
}

/**
 * Calculate portfolio day change
 */
export function calculatePortfolioDayChange(
  holdings: Array<{
    amount: number;
    price_usd: number;
    purchase_price_usd?: number;
  }>
): { dayChange: number; dayChangePercent: number } {
  let totalCurrentValue = 0;
  let totalPreviousValue = 0;

  for (const holding of holdings) {
    const currentValue = holding.amount * holding.price_usd;
    totalCurrentValue += currentValue;

    // Use purchase price as baseline if no historical data
    const previousPrice = holding.purchase_price_usd || holding.price_usd;
    totalPreviousValue += holding.amount * previousPrice;
  }

  const dayChange = totalCurrentValue - totalPreviousValue;
  const dayChangePercent = totalPreviousValue > 0 
    ? (dayChange / totalPreviousValue) * 100 
    : 0;

  return { dayChange, dayChangePercent };
}

/**
 * Calculate cost basis (total invested)
 */
export function calculateCostBasis(
  holdings: Array<{
    amount: number;
    purchase_price_usd?: number;
    price_usd: number;
  }>
): number {
  return holdings.reduce((sum, h) => {
    const purchasePrice = h.purchase_price_usd || h.price_usd;
    return sum + (h.amount * purchasePrice);
  }, 0);
}

/**
 * Calculate unrealized P&L
 */
export function calculateUnrealizedPnL(
  holdings: Array<{
    amount: number;
    price_usd: number;
    purchase_price_usd?: number;
  }>
): { pnl: number; pnlPercent: number } {
  const costBasis = calculateCostBasis(holdings);
  const currentValue = holdings.reduce((sum, h) => sum + (h.amount * h.price_usd), 0);
  
  const pnl = currentValue - costBasis;
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

  return { pnl, pnlPercent };
}
