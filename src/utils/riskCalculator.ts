import { EconomicIndicators } from './mockData';

export interface CategoryScore {
  name: string;
  score: number;
  weight: number;
  indicators: Array<{
    name: string;
    value: number;
    risk: number;
    unit: string;
  }>;
}

const normalizeIndicator = (value: number, thresholds: { low: number; high: number }, inverted: boolean = false): number => {
  const { low, high } = thresholds;
  let normalized = ((value - low) / (high - low)) * 100;
  normalized = Math.max(0, Math.min(100, normalized));
  return inverted ? 100 - normalized : normalized;
};

export const calculateRiskScore = (indicators: EconomicIndicators): { score: number; categories: CategoryScore[] } => {
  // Credit Risk (25%)
  const creditRisk = {
    name: 'Credit Risk',
    weight: 0.25,
    score: 0,
    indicators: [
      {
        name: 'BBB-AAA Spread',
        value: indicators.bbbAaaSpread,
        risk: normalizeIndicator(indicators.bbbAaaSpread, { low: 1.0, high: 5.0 }, false),
        unit: 'bps',
      },
      {
        name: 'Consumer Delinquency',
        value: indicators.consumerDelinquency,
        risk: normalizeIndicator(indicators.consumerDelinquency, { low: 1.5, high: 6.0 }, false),
        unit: '%',
      },
      {
        name: 'Corp Debt/GDP',
        value: indicators.corpDebtToGDP,
        risk: normalizeIndicator(indicators.corpDebtToGDP, { low: 40, high: 60 }, false),
        unit: '%',
      },
    ],
  };
  creditRisk.score = creditRisk.indicators.reduce((sum, ind) => sum + ind.risk, 0) / creditRisk.indicators.length;

  // Liquidity Risk (20%)
  const liquidityRisk = {
    name: 'Liquidity Risk',
    weight: 0.20,
    score: 0,
    indicators: [
      {
        name: 'TED Spread',
        value: indicators.tedSpread,
        risk: normalizeIndicator(indicators.tedSpread, { low: 0.1, high: 2.0 }, false),
        unit: 'bps',
      },
      {
        name: 'Bank Liquidity',
        value: indicators.bankLiquidity,
        risk: normalizeIndicator(indicators.bankLiquidity, { low: 60, high: 100 }, true),
        unit: '%',
      },
      {
        name: 'Commercial Paper',
        value: indicators.commercialPaper,
        risk: normalizeIndicator(indicators.commercialPaper, { low: 800, high: 1500 }, true),
        unit: '$B',
      },
    ],
  };
  liquidityRisk.score = liquidityRisk.indicators.reduce((sum, ind) => sum + ind.risk, 0) / liquidityRisk.indicators.length;

  // Market Risk (20%)
  const marketRisk = {
    name: 'Market Risk',
    weight: 0.20,
    score: 0,
    indicators: [
      {
        name: 'VIX',
        value: indicators.vix,
        risk: normalizeIndicator(indicators.vix, { low: 10, high: 50 }, false),
        unit: '',
      },
      {
        name: 'S&P 500 P/E',
        value: indicators.sp500PE,
        risk: normalizeIndicator(indicators.sp500PE, { low: 15, high: 30 }, false),
        unit: 'x',
      },
      {
        name: 'Put/Call Ratio',
        value: indicators.putCallRatio,
        risk: normalizeIndicator(indicators.putCallRatio, { low: 0.5, high: 2.0 }, false),
        unit: '',
      },
    ],
  };
  marketRisk.score = marketRisk.indicators.reduce((sum, ind) => sum + ind.risk, 0) / marketRisk.indicators.length;

  // Monetary Risk (15%)
  const monetaryRisk = {
    name: 'Monetary Risk',
    weight: 0.15,
    score: 0,
    indicators: [
      {
        name: 'Yield Curve (10Y-2Y)',
        value: indicators.yieldCurve10y2y,
        risk: indicators.yieldCurve10y2y < 0 ? 80 : normalizeIndicator(Math.abs(indicators.yieldCurve10y2y), { low: 0, high: 2.0 }, true),
        unit: '%',
      },
      {
        name: 'Real Yield',
        value: indicators.realYield,
        risk: normalizeIndicator(indicators.realYield, { low: -1, high: 4 }, false),
        unit: '%',
      },
      {
        name: 'Inflation Rate',
        value: indicators.inflationRate,
        risk: normalizeIndicator(indicators.inflationRate, { low: 2, high: 6 }, false),
        unit: '%',
      },
    ],
  };
  monetaryRisk.score = monetaryRisk.indicators.reduce((sum, ind) => sum + ind.risk, 0) / monetaryRisk.indicators.length;

  // Systemic Risk (10%)
  const systemicRisk = {
    name: 'Systemic Risk',
    weight: 0.10,
    score: 0,
    indicators: [
      {
        name: 'Unemployment Rate',
        value: indicators.unemploymentRate,
        risk: normalizeIndicator(indicators.unemploymentRate, { low: 3, high: 7 }, false),
        unit: '%',
      },
      {
        name: 'Financial Stress Index',
        value: indicators.financialStressIndex,
        risk: normalizeIndicator(indicators.financialStressIndex, { low: -0.5, high: 2.0 }, false),
        unit: '',
      },
      {
        name: 'Bank Failures',
        value: indicators.bankFailures,
        risk: normalizeIndicator(indicators.bankFailures, { low: 0, high: 5 }, false),
        unit: '',
      },
    ],
  };
  systemicRisk.score = systemicRisk.indicators.reduce((sum, ind) => sum + ind.risk, 0) / systemicRisk.indicators.length;

  // Real Estate Risk (10%)
  const realEstateRisk = {
    name: 'Real Estate Risk',
    weight: 0.10,
    score: 0,
    indicators: [
      {
        name: 'Mortgage Rate',
        value: indicators.mortgageRate,
        risk: normalizeIndicator(indicators.mortgageRate, { low: 3, high: 8 }, false),
        unit: '%',
      },
      {
        name: 'Housing Affordability',
        value: indicators.housingAffordability,
        risk: normalizeIndicator(indicators.housingAffordability, { low: 70, high: 110 }, true),
        unit: '',
      },
      {
        name: 'Mortgage Delinquency',
        value: indicators.mortgageDelinquency,
        risk: normalizeIndicator(indicators.mortgageDelinquency, { low: 1, high: 5 }, false),
        unit: '%',
      },
    ],
  };
  realEstateRisk.score = realEstateRisk.indicators.reduce((sum, ind) => sum + ind.risk, 0) / realEstateRisk.indicators.length;

  const categories = [creditRisk, liquidityRisk, marketRisk, monetaryRisk, systemicRisk, realEstateRisk];

  const totalScore = categories.reduce((sum, cat) => sum + cat.score * cat.weight, 0);

  return {
    score: Math.round(totalScore),
    categories,
  };
};

export const getRiskLevel = (score: number): string => {
  if (score < 30) return 'LOW';
  if (score < 50) return 'MODERATE';
  if (score < 70) return 'ELEVATED';
  return 'HIGH';
};

export const getRiskColor = (score: number): string => {
  if (score < 30) return 'risk-safe';
  if (score < 50) return 'risk-moderate';
  if (score < 70) return 'risk-elevated';
  return 'risk-critical';
};
