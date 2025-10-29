import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, CheckCircle2, Brain, Target, Shield } from 'lucide-react';
import { Holding } from '@/pages/Portfolio';

interface PortfolioInsightsProps {
  holdings: Holding[];
  totalValue: number;
}

export default function PortfolioInsights({ holdings, totalValue }: PortfolioInsightsProps) {
  // Calculate diversification score (0-100)
  const calculateDiversification = () => {
    if (holdings.length === 0) return 0;
    
    const assetTypes = new Set(holdings.map(h => h.asset_type));
    const hhi = holdings.reduce((sum, h) => {
      const share = (h.value_usd || 0) / totalValue;
      return sum + (share * share);
    }, 0);
    
    // Herfindahl index: 0 = perfect diversification, 1 = completely concentrated
    const diversificationScore = ((1 - hhi) * 100) * (assetTypes.size / 5); // Adjust for asset type diversity
    return Math.min(100, Math.round(diversificationScore));
  };

  // Calculate risk score based on concentration and volatility indicators
  const calculateRiskScore = () => {
    if (holdings.length === 0) return 0;
    
    const topHoldingPercent = Math.max(...holdings.map(h => (h.value_usd || 0) / totalValue)) * 100;
    const cryptoPercent = holdings
      .filter(h => h.asset_type === 'crypto')
      .reduce((sum, h) => sum + (h.value_usd || 0), 0) / totalValue * 100;
    
    // Higher concentration and crypto = higher risk
    const concentrationRisk = topHoldingPercent > 50 ? 30 : topHoldingPercent > 25 ? 20 : 10;
    const assetRisk = cryptoPercent > 80 ? 40 : cryptoPercent > 50 ? 25 : 10;
    const diversityRisk = holdings.length < 5 ? 30 : holdings.length < 10 ? 15 : 5;
    
    return Math.min(100, concentrationRisk + assetRisk + diversityRisk);
  };

  // Calculate decision confidence score
  const calculateConfidenceScore = () => {
    const diversification = calculateDiversification();
    const riskScore = calculateRiskScore();
    const hasStopLosses = holdings.some(h => h.purchase_price_usd); // Proxy for having strategy
    
    let confidence = 50; // Base confidence
    
    // Boost for good diversification
    if (diversification > 70) confidence += 20;
    else if (diversification > 40) confidence += 10;
    
    // Penalty for high risk
    if (riskScore > 70) confidence -= 20;
    else if (riskScore > 50) confidence -= 10;
    
    // Boost for having purchase tracking (indicates planning)
    if (hasStopLosses) confidence += 15;
    
    return Math.max(0, Math.min(100, confidence));
  };

  const diversificationScore = calculateDiversification();
  const riskScore = calculateRiskScore();
  const confidenceScore = calculateConfidenceScore();

  const getScoreColor = (score: number, inverted = false) => {
    if (inverted) {
      if (score > 70) return 'text-red-500';
      if (score > 40) return 'text-yellow-500';
      return 'text-green-500';
    }
    if (score > 70) return 'text-green-500';
    if (score > 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number, inverted = false) => {
    if (inverted) {
      if (score > 70) return { label: 'High Risk', variant: 'destructive' as const };
      if (score > 40) return { label: 'Moderate', variant: 'default' as const };
      return { label: 'Low Risk', variant: 'outline' as const };
    }
    if (score > 70) return { label: 'Excellent', variant: 'default' as const };
    if (score > 40) return { label: 'Good', variant: 'secondary' as const };
    return { label: 'Needs Attention', variant: 'destructive' as const };
  };

  const insights = [];

  // Generate actionable insights
  const topHolding = holdings.reduce((max, h) => 
    (h.value_usd || 0) > (max.value_usd || 0) ? h : max, 
    holdings[0]
  );
  const topHoldingPercent = topHolding ? ((topHolding.value_usd || 0) / totalValue * 100) : 0;

  if (topHoldingPercent > 50) {
    insights.push({
      type: 'warning' as const,
      title: 'High Concentration Risk',
      message: `${topHolding.asset_symbol} represents ${topHoldingPercent.toFixed(1)}% of your portfolio. Consider rebalancing to reduce single-asset risk.`,
      action: 'Diversify Holdings'
    });
  }

  if (diversificationScore < 40) {
    insights.push({
      type: 'warning' as const,
      title: 'Limited Diversification',
      message: 'Your portfolio could benefit from more asset variety. Consider adding different asset types to spread risk.',
      action: 'Add Asset Types'
    });
  }

  if (confidenceScore > 70) {
    insights.push({
      type: 'success' as const,
      title: 'Strong Portfolio Structure',
      message: 'Your portfolio shows good diversification and risk management principles.',
      action: 'Maintain Strategy'
    });
  }

  const holdingsWithoutPurchasePrice = holdings.filter(h => !h.purchase_price_usd).length;
  if (holdingsWithoutPurchasePrice > 0) {
    insights.push({
      type: 'info' as const,
      title: 'Incomplete Purchase Data',
      message: `${holdingsWithoutPurchasePrice} holdings missing purchase price. Add this data for accurate P&L tracking.`,
      action: 'Update Holdings'
    });
  }

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Diversification Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-3xl font-bold ${getScoreColor(diversificationScore)}`}>
                {diversificationScore}
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              <Badge {...getScoreBadge(diversificationScore)}>
                {getScoreBadge(diversificationScore).label}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {holdings.length} assets across {new Set(holdings.map(h => h.asset_type)).size} types
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Portfolio Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-3xl font-bold ${getScoreColor(riskScore, true)}`}>
                {riskScore}
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              <Badge {...getScoreBadge(riskScore, true)}>
                {getScoreBadge(riskScore, true).label}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Based on concentration and asset allocation
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Decision Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-3xl font-bold ${getScoreColor(confidenceScore)}`}>
                {confidenceScore}
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              <Badge {...getScoreBadge(confidenceScore)}>
                {getScoreBadge(confidenceScore).label}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Strategy clarity and risk management quality
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actionable Insights */}
      {insights.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  insight.type === 'success'
                    ? 'bg-green-500/5 border-green-500/20'
                    : insight.type === 'warning'
                    ? 'bg-yellow-500/5 border-yellow-500/20'
                    : 'bg-blue-500/5 border-blue-500/20'
                }`}
              >
                <div className="mt-0.5">
                  {insight.type === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {insight.type === 'warning' && (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  {insight.type === 'info' && (
                    <Brain className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-sm">{insight.title}</p>
                  <p className="text-sm text-muted-foreground">{insight.message}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {insight.action}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
