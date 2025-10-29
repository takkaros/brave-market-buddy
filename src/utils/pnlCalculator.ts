// Professional P&L Calculator
// Implements FIFO, LIFO, and Specific ID cost basis methods

export type CostBasisMethod = 'FIFO' | 'LIFO' | 'SPECIFIC_ID' | 'AVERAGE_COST';

export interface TaxLot {
  id: string;
  symbol: string;
  quantity: number;
  costBasisPerUnit: number;
  totalCostBasis: number;
  acquiredDate: Date;
  remainingQuantity: number;
}

export interface RealizedGain {
  symbol: string;
  quantity: number;
  proceeds: number;
  costBasis: number;
  realizedPnL: number;
  holdingPeriod: number; // days
  isShortTerm: boolean; // < 1 year
  taxLots: TaxLot[];
  saleDate: Date;
}

export interface UnrealizedPosition {
  symbol: string;
  totalQuantity: number;
  totalCostBasis: number;
  averageCostBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  taxLots: TaxLot[];
}

// ======================
// TAX LOT MANAGEMENT
// ======================

export class TaxLotManager {
  private lots: Map<string, TaxLot[]> = new Map();
  
  /**
   * Add a purchase (create tax lot)
   */
  addPurchase(
    symbol: string,
    quantity: number,
    pricePerUnit: number,
    date: Date
  ): TaxLot {
    const lot: TaxLot = {
      id: `${symbol}_${date.getTime()}_${Math.random()}`,
      symbol,
      quantity,
      costBasisPerUnit: pricePerUnit,
      totalCostBasis: quantity * pricePerUnit,
      acquiredDate: date,
      remainingQuantity: quantity,
    };
    
    if (!this.lots.has(symbol)) {
      this.lots.set(symbol, []);
    }
    
    this.lots.get(symbol)!.push(lot);
    return lot;
  }
  
  /**
   * Process a sale using specified cost basis method
   */
  processSale(
    symbol: string,
    quantity: number,
    salePrice: number,
    saleDate: Date,
    method: CostBasisMethod = 'FIFO'
  ): RealizedGain {
    const lots = this.lots.get(symbol) || [];
    
    if (lots.length === 0) {
      throw new Error(`No tax lots found for ${symbol}`);
    }
    
    const availableQuantity = lots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
    if (availableQuantity < quantity) {
      throw new Error(`Insufficient quantity. Have ${availableQuantity}, need ${quantity}`);
    }
    
    // Sort lots based on method
    let sortedLots = [...lots.filter(lot => lot.remainingQuantity > 0)];
    
    switch (method) {
      case 'FIFO':
        sortedLots.sort((a, b) => a.acquiredDate.getTime() - b.acquiredDate.getTime());
        break;
      case 'LIFO':
        sortedLots.sort((a, b) => b.acquiredDate.getTime() - a.acquiredDate.getTime());
        break;
      case 'AVERAGE_COST':
        // Calculate average cost basis
        const totalCost = sortedLots.reduce((sum, lot) => 
          sum + (lot.remainingQuantity * lot.costBasisPerUnit), 0
        );
        const totalQty = sortedLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
        const avgCost = totalCost / totalQty;
        
        // Create a virtual lot with average cost
        sortedLots = [{
          id: 'avg',
          symbol,
          quantity: totalQty,
          costBasisPerUnit: avgCost,
          totalCostBasis: totalCost,
          acquiredDate: sortedLots[0].acquiredDate,
          remainingQuantity: totalQty,
        }];
        break;
      case 'SPECIFIC_ID':
        // For specific ID, caller should specify which lots to use
        // For now, default to FIFO
        sortedLots.sort((a, b) => a.acquiredDate.getTime() - b.acquiredDate.getTime());
        break;
    }
    
    // Consume lots to fulfill sale
    const usedLots: TaxLot[] = [];
    let remainingToSell = quantity;
    let totalCostBasis = 0;
    
    for (const lot of sortedLots) {
      if (remainingToSell <= 0) break;
      
      const qtyFromLot = Math.min(remainingToSell, lot.remainingQuantity);
      const costFromLot = qtyFromLot * lot.costBasisPerUnit;
      
      usedLots.push({
        ...lot,
        quantity: qtyFromLot,
        totalCostBasis: costFromLot,
      });
      
      totalCostBasis += costFromLot;
      remainingToSell -= qtyFromLot;
      
      // Update remaining quantity in original lot
      lot.remainingQuantity -= qtyFromLot;
    }
    
    const proceeds = quantity * salePrice;
    const realizedPnL = proceeds - totalCostBasis;
    
    // Calculate holding period (use oldest lot)
    const oldestLot = usedLots.sort((a, b) => 
      a.acquiredDate.getTime() - b.acquiredDate.getTime()
    )[0];
    const holdingPeriod = Math.floor(
      (saleDate.getTime() - oldestLot.acquiredDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      symbol,
      quantity,
      proceeds,
      costBasis: totalCostBasis,
      realizedPnL,
      holdingPeriod,
      isShortTerm: holdingPeriod < 365,
      taxLots: usedLots,
      saleDate,
    };
  }
  
  /**
   * Get unrealized position for symbol
   */
  getUnrealizedPosition(symbol: string, currentPrice: number): UnrealizedPosition {
    const lots = this.lots.get(symbol) || [];
    const activeLots = lots.filter(lot => lot.remainingQuantity > 0);
    
    const totalQuantity = activeLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
    const totalCostBasis = activeLots.reduce((sum, lot) => 
      sum + (lot.remainingQuantity * lot.costBasisPerUnit), 0
    );
    
    const averageCostBasis = totalQuantity > 0 ? totalCostBasis / totalQuantity : 0;
    const currentValue = totalQuantity * currentPrice;
    const unrealizedPnL = currentValue - totalCostBasis;
    const unrealizedPnLPercent = totalCostBasis > 0 ? (unrealizedPnL / totalCostBasis) * 100 : 0;
    
    return {
      symbol,
      totalQuantity,
      totalCostBasis,
      averageCostBasis,
      currentPrice,
      currentValue,
      unrealizedPnL,
      unrealizedPnLPercent,
      taxLots: activeLots,
    };
  }
  
  /**
   * Get all positions
   */
  getAllPositions(currentPrices: Map<string, number>): UnrealizedPosition[] {
    const positions: UnrealizedPosition[] = [];
    
    for (const [symbol, _lots] of this.lots) {
      const price = currentPrices.get(symbol) || 0;
      const position = this.getUnrealizedPosition(symbol, price);
      
      if (position.totalQuantity > 0) {
        positions.push(position);
      }
    }
    
    return positions;
  }
}

// ======================
// PORTFOLIO P&L AGGREGATION
// ======================

export interface PortfolioPnL {
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalPnL: number;
  
  shortTermGains: number;
  longTermGains: number;
  
  todayPnL: number;
  weekPnL: number;
  monthPnL: number;
  yearPnL: number;
  
  bestPerformer: { symbol: string; pnl: number; pnlPercent: number } | null;
  worstPerformer: { symbol: string; pnl: number; pnlPercent: number } | null;
}

export function aggregatePortfolioPnL(
  realizedGains: RealizedGain[],
  unrealizedPositions: UnrealizedPosition[],
  historicalPnL: Array<{ date: Date; pnl: number }>
): PortfolioPnL {
  // Realized P&L
  const totalRealizedPnL = realizedGains.reduce((sum, g) => sum + g.realizedPnL, 0);
  const shortTermGains = realizedGains
    .filter(g => g.isShortTerm)
    .reduce((sum, g) => sum + g.realizedPnL, 0);
  const longTermGains = realizedGains
    .filter(g => !g.isShortTerm)
    .reduce((sum, g) => sum + g.realizedPnL, 0);
  
  // Unrealized P&L
  const totalUnrealizedPnL = unrealizedPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
  
  // Total P&L
  const totalPnL = totalRealizedPnL + totalUnrealizedPnL;
  
  // Time-based P&L
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  
  const todayPnL = historicalPnL
    .filter(h => h.date >= oneDayAgo)
    .reduce((sum, h) => sum + h.pnl, 0);
  
  const weekPnL = historicalPnL
    .filter(h => h.date >= oneWeekAgo)
    .reduce((sum, h) => sum + h.pnl, 0);
  
  const monthPnL = historicalPnL
    .filter(h => h.date >= oneMonthAgo)
    .reduce((sum, h) => sum + h.pnl, 0);
  
  const yearPnL = historicalPnL
    .filter(h => h.date >= oneYearAgo)
    .reduce((sum, h) => sum + h.pnl, 0);
  
  // Best/Worst performers
  const performanceList = unrealizedPositions
    .map(p => ({
      symbol: p.symbol,
      pnl: p.unrealizedPnL,
      pnlPercent: p.unrealizedPnLPercent,
    }))
    .sort((a, b) => b.pnl - a.pnl);
  
  const bestPerformer = performanceList.length > 0 ? performanceList[0] : null;
  const worstPerformer = performanceList.length > 0 
    ? performanceList[performanceList.length - 1] 
    : null;
  
  return {
    totalRealizedPnL,
    totalUnrealizedPnL,
    totalPnL,
    shortTermGains,
    longTermGains,
    todayPnL,
    weekPnL,
    monthPnL,
    yearPnL,
    bestPerformer,
    worstPerformer,
  };
}

// ======================
// REAL-TIME P&L UPDATES
// ======================

export class RealTimePnLTracker {
  private positions: Map<string, UnrealizedPosition> = new Map();
  private subscribers: Array<(pnl: PortfolioPnL) => void> = [];
  
  updatePrice(symbol: string, newPrice: number, taxLotManager: TaxLotManager) {
    const position = taxLotManager.getUnrealizedPosition(symbol, newPrice);
    this.positions.set(symbol, position);
    this.notifySubscribers();
  }
  
  subscribe(callback: (pnl: PortfolioPnL) => void) {
    this.subscribers.push(callback);
  }
  
  private notifySubscribers() {
    const unrealizedPositions = Array.from(this.positions.values());
    const pnl = aggregatePortfolioPnL([], unrealizedPositions, []);
    
    this.subscribers.forEach(callback => callback(pnl));
  }
  
  getCurrentPnL(): number {
    return Array.from(this.positions.values())
      .reduce((sum, p) => sum + p.unrealizedPnL, 0);
  }
}

// ======================
// WASH SALE DETECTION
// ======================

export interface WashSale {
  saleTrade: RealizedGain;
  replacementTrade: TaxLot;
  disallowedLoss: number;
  washSalePeriodStart: Date;
  washSalePeriodEnd: Date;
}

/**
 * Detect wash sales (selling at a loss and repurchasing within 30 days)
 * IRS wash sale rule: Can't deduct losses if you repurchase "substantially identical" 
 * securities within 30 days before or after the sale
 */
export function detectWashSales(
  realizedGains: RealizedGain[],
  purchases: TaxLot[]
): WashSale[] {
  const washSales: WashSale[] = [];
  
  for (const sale of realizedGains) {
    // Only check losses
    if (sale.realizedPnL >= 0) continue;
    
    const saleDate = sale.saleDate;
    const washPeriodStart = new Date(saleDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const washPeriodEnd = new Date(saleDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Check for repurchases within wash period
    const repurchases = purchases.filter(p => 
      p.symbol === sale.symbol &&
      p.acquiredDate >= washPeriodStart &&
      p.acquiredDate <= washPeriodEnd &&
      p.acquiredDate.getTime() !== saleDate.getTime() // Exclude same-day
    );
    
    if (repurchases.length > 0) {
      washSales.push({
        saleTrade: sale,
        replacementTrade: repurchases[0],
        disallowedLoss: Math.abs(sale.realizedPnL),
        washSalePeriodStart: washPeriodStart,
        washSalePeriodEnd: washPeriodEnd,
      });
    }
  }
  
  return washSales;
}

// ======================
// TAX REPORTING
// ======================

export interface TaxReport {
  taxYear: number;
  shortTermGains: number;
  longTermGains: number;
  totalGains: number;
  washSaleAdjustments: number;
  netTaxableGains: number;
  
  estimatedTax: {
    shortTerm: number; // At ordinary income rate
    longTerm: number; // At capital gains rate
    total: number;
  };
  
  transactions: RealizedGain[];
  washSales: WashSale[];
}

export function generateTaxReport(
  year: number,
  realizedGains: RealizedGain[],
  washSales: WashSale[],
  shortTermTaxRate: number = 0.37, // Top federal bracket
  longTermTaxRate: number = 0.20 // Long-term capital gains rate
): TaxReport {
  const yearTransactions = realizedGains.filter(g => 
    g.saleDate.getFullYear() === year
  );
  
  const shortTermGains = yearTransactions
    .filter(g => g.isShortTerm)
    .reduce((sum, g) => sum + g.realizedPnL, 0);
  
  const longTermGains = yearTransactions
    .filter(g => !g.isShortTerm)
    .reduce((sum, g) => sum + g.realizedPnL, 0);
  
  const totalGains = shortTermGains + longTermGains;
  
  const washSaleAdjustments = washSales
    .filter(w => w.saleTrade.saleDate.getFullYear() === year)
    .reduce((sum, w) => sum + w.disallowedLoss, 0);
  
  const netTaxableGains = totalGains - washSaleAdjustments;
  
  const estimatedTax = {
    shortTerm: Math.max(0, shortTermGains * shortTermTaxRate),
    longTerm: Math.max(0, longTermGains * longTermTaxRate),
    total: Math.max(0, shortTermGains * shortTermTaxRate + longTermGains * longTermTaxRate),
  };
  
  return {
    taxYear: year,
    shortTermGains,
    longTermGains,
    totalGains,
    washSaleAdjustments,
    netTaxableGains,
    estimatedTax,
    transactions: yearTransactions,
    washSales,
  };
}
