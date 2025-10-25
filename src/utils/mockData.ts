export interface EconomicIndicators {
  timestamp: Date;
  
  // Credit Risk (25%)
  bbbAaaSpread: number;
  consumerDelinquency: number;
  corpDebtToGDP: number;
  creditCardDelinquency: number;
  autoLoanDelinquency: number;
  
  // Liquidity Risk (20%)
  tedSpread: number;
  fedBalanceSheet: number;
  commercialPaper: number;
  bankLiquidity: number;
  libor: number;
  
  // Market Risk (20%)
  vix: number;
  sp500PE: number;
  marginDebt: number;
  putCallRatio: number;
  advanceDecline: number;
  
  // Monetary Risk (15%)
  yieldCurve10y2y: number;
  realYield: number;
  fedFundsRate: number;
  inflationRate: number;
  m2MoneySupply: number;
  
  // Systemic Risk (10%)
  unemploymentRate: number;
  initialClaims: number;
  financialStressIndex: number;
  bankFailures: number;
  
  // Real Estate Risk (10%)
  caseShiller: number;
  mortgageRate: number;
  housingAffordability: number;
  mortgageDelinquency: number;
  homeInventory: number;
  
  // Sentiment
  fearGreedIndex: number;
  
  // Stocks - Professional Metrics
  earningsGrowth: number;
  revenueGrowth: number;
  profitMargin: number;
  sharesOutstanding: number;
  buffettIndicator: number; // Market cap to GDP
  shillerPE: number;
  
  // Crypto - On-Chain Metrics
  btcHashRate: number;
  btcActiveAddresses: number;
  btcExchangeInflow: number;
  btcMVRV: number; // Market Value to Realized Value
  stablecoinSupply: number;
  cryptoFundingRate: number;
  
  // Housing - Pro Indicators
  housingStarts: number;
  buildingPermits: number;
  existingHomeSales: number;
  pendingHomeSales: number;
  daysOnMarket: number;
  priceToRent: number;
  
  // Metals - Professional Focus
  goldMiningProduction: number;
  centralBankPurchases: number;
  industrialDemand: number;
  goldSilverRatio: number;
  realYieldCorrelation: number;
  
  // Bonds - Fixed Income Pro Metrics
  duration: number;
  convexity: number;
  oisSpread: number;
  tipsSpread: number;
  municipalBondYield: number;
}

export const generateMockData = (scenario: 'bottom' | 'peak' | 'crisis' = 'bottom'): EconomicIndicators => {
  const scenarios = {
    bottom: {
      bbbAaaSpread: 2.1,
      consumerDelinquency: 3.2,
      corpDebtToGDP: 47,
      creditCardDelinquency: 2.8,
      autoLoanDelinquency: 3.5,
      tedSpread: 0.25,
      fedBalanceSheet: 7800,
      commercialPaper: 1200,
      bankLiquidity: 85,
      libor: 5.3,
      vix: 22,
      sp500PE: 18.5,
      marginDebt: 750,
      putCallRatio: 1.3,
      advanceDecline: -500,
      yieldCurve10y2y: 0.3,
      realYield: 1.8,
      fedFundsRate: 5.25,
      inflationRate: 3.2,
      m2MoneySupply: 21000,
      unemploymentRate: 3.8,
      initialClaims: 225000,
      financialStressIndex: 0.2,
      bankFailures: 0,
      caseShiller: 315,
      mortgageRate: 6.8,
      housingAffordability: 98,
      mortgageDelinquency: 2.1,
      homeInventory: 1.2,
      fearGreedIndex: 28,
      // Stocks
      earningsGrowth: 8.5,
      revenueGrowth: 6.2,
      profitMargin: 11.8,
      sharesOutstanding: -2.1,
      buffettIndicator: 152,
      shillerPE: 28.5,
      // Crypto
      btcHashRate: 450,
      btcActiveAddresses: 850000,
      btcExchangeInflow: -12000,
      btcMVRV: 1.8,
      stablecoinSupply: 145,
      cryptoFundingRate: 0.01,
      // Housing
      housingStarts: 1450,
      buildingPermits: 1520,
      existingHomeSales: 4.2,
      pendingHomeSales: 98,
      daysOnMarket: 32,
      priceToRent: 22,
      // Metals
      goldMiningProduction: 3200,
      centralBankPurchases: 450,
      industrialDemand: 2800,
      goldSilverRatio: 82,
      realYieldCorrelation: -0.75,
      // Bonds
      duration: 6.5,
      convexity: 0.8,
      oisSpread: 0.12,
      tipsSpread: 2.2,
      municipalBondYield: 3.8,
    },
    peak: {
      bbbAaaSpread: 1.2,
      consumerDelinquency: 1.8,
      corpDebtToGDP: 52,
      creditCardDelinquency: 1.5,
      autoLoanDelinquency: 1.9,
      tedSpread: 0.15,
      fedBalanceSheet: 8500,
      commercialPaper: 1450,
      bankLiquidity: 95,
      libor: 4.2,
      vix: 12,
      sp500PE: 25.8,
      marginDebt: 950,
      putCallRatio: 0.7,
      advanceDecline: 800,
      yieldCurve10y2y: -0.5,
      realYield: 0.2,
      fedFundsRate: 5.5,
      inflationRate: 4.8,
      m2MoneySupply: 22500,
      unemploymentRate: 3.4,
      initialClaims: 195000,
      financialStressIndex: -0.3,
      bankFailures: 0,
      caseShiller: 340,
      mortgageRate: 7.2,
      housingAffordability: 82,
      mortgageDelinquency: 1.2,
      homeInventory: 0.8,
      fearGreedIndex: 82,
      // Stocks
      earningsGrowth: 15.2,
      revenueGrowth: 12.8,
      profitMargin: 13.5,
      sharesOutstanding: -3.5,
      buffettIndicator: 195,
      shillerPE: 35.2,
      // Crypto
      btcHashRate: 550,
      btcActiveAddresses: 1200000,
      btcExchangeInflow: 25000,
      btcMVRV: 3.2,
      stablecoinSupply: 165,
      cryptoFundingRate: 0.05,
      // Housing
      housingStarts: 1750,
      buildingPermits: 1820,
      existingHomeSales: 5.8,
      pendingHomeSales: 112,
      daysOnMarket: 18,
      priceToRent: 28,
      // Metals
      goldMiningProduction: 3150,
      centralBankPurchases: 280,
      industrialDemand: 3200,
      goldSilverRatio: 75,
      realYieldCorrelation: -0.82,
      // Bonds
      duration: 5.2,
      convexity: 0.6,
      oisSpread: 0.08,
      tipsSpread: 1.5,
      municipalBondYield: 2.8,
    },
    crisis: {
      bbbAaaSpread: 4.8,
      consumerDelinquency: 5.8,
      corpDebtToGDP: 55,
      creditCardDelinquency: 6.2,
      autoLoanDelinquency: 6.8,
      tedSpread: 1.2,
      fedBalanceSheet: 9200,
      commercialPaper: 850,
      bankLiquidity: 65,
      libor: 6.8,
      vix: 45,
      sp500PE: 14.2,
      marginDebt: 450,
      putCallRatio: 1.8,
      advanceDecline: -1500,
      yieldCurve10y2y: -1.2,
      realYield: 3.2,
      fedFundsRate: 5.5,
      inflationRate: 2.8,
      m2MoneySupply: 23000,
      unemploymentRate: 5.8,
      initialClaims: 380000,
      financialStressIndex: 1.8,
      bankFailures: 3,
      caseShiller: 285,
      mortgageRate: 7.5,
      housingAffordability: 75,
      mortgageDelinquency: 4.8,
      homeInventory: 1.8,
      fearGreedIndex: 15,
      // Stocks
      earningsGrowth: -8.5,
      revenueGrowth: -2.1,
      profitMargin: 8.2,
      sharesOutstanding: 1.2,
      buffettIndicator: 118,
      shillerPE: 18.5,
      // Crypto
      btcHashRate: 380,
      btcActiveAddresses: 520000,
      btcExchangeInflow: 45000,
      btcMVRV: 0.8,
      stablecoinSupply: 155,
      cryptoFundingRate: -0.02,
      // Housing
      housingStarts: 980,
      buildingPermits: 1050,
      existingHomeSales: 3.2,
      pendingHomeSales: 78,
      daysOnMarket: 58,
      priceToRent: 18,
      // Metals
      goldMiningProduction: 3300,
      centralBankPurchases: 720,
      industrialDemand: 2200,
      goldSilverRatio: 95,
      realYieldCorrelation: -0.88,
      // Bonds
      duration: 7.8,
      convexity: 1.2,
      oisSpread: 0.35,
      tipsSpread: 3.2,
      municipalBondYield: 5.2,
    },
  };

  return {
    timestamp: new Date(),
    ...scenarios[scenario],
  };
};

export const generateHistoricalData = (days: number = 180): Array<{ date: Date; score: number }> => {
  const data = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simulate declining risk over time
    const baseScore = 67 - (days - i) * 0.15;
    const noise = Math.random() * 8 - 4;
    const score = Math.max(30, Math.min(85, baseScore + noise));
    
    data.push({ date, score: Math.round(score) });
  }
  
  return data;
};
