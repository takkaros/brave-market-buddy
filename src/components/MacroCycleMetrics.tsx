import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Calendar, PieChart, Layers } from 'lucide-react';
import { calculateLogRegFairValue, calculateRiskMetric, getCycleProgress, getPhaseStatus } from '@/utils/macroCalculations';

interface MacroCycleMetricsProps {
  asset: string;
  btcData?: any;
}

export function MacroCycleMetrics({ asset, btcData }: MacroCycleMetricsProps) {
  const currentPrice = btcData?.price || (asset === 'BTC' ? 95000 : 3500);
  const fairValue = calculateLogRegFairValue(asset);
  const riskScore = calculateRiskMetric(asset, currentPrice);
  const cycleProgress = getCycleProgress();
  const phase = getPhaseStatus(riskScore, cycleProgress.percentComplete);
  const btcDominance = btcData?.dominance || 54.2;
  const above200WMA = true;
  const aboveBullSupport = true;

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-500';
    if (score < 50) return 'text-yellow-500';
    if (score < 70) return 'text-orange-500';
    return 'text-red-500';
  };

  const getPhaseEmoji = (phase: string) => {
    switch (phase) {
      case 'Accumulation': return '🟢';
      case 'Expansion': return '🟡';
      case 'Euphoria': return '🔴';
      case 'Recession': return '🟠';
      default: return '⚪';
    }
  };

  const deviation = ((currentPrice - fairValue) / fairValue * 100).toFixed(1);
  const isOvervalued = currentPrice > fairValue;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Log-Reg Fair Value */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Log-Reg Fair Value</p>
            <h3 className="text-2xl font-bold text-foreground">${fairValue.toLocaleString()}</h3>
          </div>
          {isOvervalued ? <TrendingUp className="h-6 w-6 text-red-500" /> : <TrendingDown className="h-6 w-6 text-green-500" />}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Current: ${currentPrice.toLocaleString()}</p>
          <p className={`text-sm font-medium ${isOvervalued ? 'text-red-500' : 'text-green-500'}`}>
            {isOvervalued ? '+' : ''}{deviation}% {isOvervalued ? 'overvalued' : 'undervalued'}
          </p>
        </div>
      </Card>

      {/* Risk Metric */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Risk Metric</p>
            <h3 className={`text-2xl font-bold ${getRiskColor(riskScore)}`}>{riskScore}/100</h3>
          </div>
          <Activity className={`h-6 w-6 ${getRiskColor(riskScore)}`} />
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full ${riskScore < 30 ? 'bg-green-500' : riskScore < 50 ? 'bg-yellow-500' : riskScore < 70 ? 'bg-orange-500' : 'bg-red-500'}`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {riskScore < 30 ? 'Low Risk - Accumulation Zone' : 
           riskScore < 50 ? 'Moderate Risk - Building Phase' :
           riskScore < 70 ? 'Elevated Risk - Late Expansion' :
           'High Risk - Distribution Zone'}
        </p>
      </Card>

      {/* Cycle Progress */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Cycle Progress</p>
            <h3 className="text-2xl font-bold text-foreground">{cycleProgress.percentComplete}%</h3>
          </div>
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Days: {cycleProgress.daysSinceHalving} / ~1,460</p>
          <p className="text-sm text-muted-foreground">Next halving: ~{cycleProgress.daysUntilNext} days</p>
        </div>
      </Card>

      {/* Trend Alignment */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Trend Alignment</p>
            <h3 className={`text-2xl font-bold ${above200WMA ? 'text-green-500' : 'text-red-500'}`}>
              {above200WMA ? 'Bullish' : 'Bearish'}
            </h3>
          </div>
          <Layers className={`h-6 w-6 ${above200WMA ? 'text-green-500' : 'text-red-500'}`} />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            200-Week MA: {above200WMA ? '✅ Above' : '❌ Below'}
          </p>
          <p className="text-sm text-muted-foreground">
            Bull Support: {aboveBullSupport ? '✅ Above' : '❌ Below'}
          </p>
        </div>
      </Card>

      {/* BTC Dominance */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">BTC Dominance</p>
            <h3 className="text-2xl font-bold text-foreground">{btcDominance}%</h3>
          </div>
          <PieChart className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {btcDominance > 50 ? 'BTC Leading' : 'Alt Season Potential'}
          </p>
          <p className="text-xs text-muted-foreground">
            Share of total crypto market cap
          </p>
        </div>
      </Card>

      {/* Phase Status */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Market Phase</p>
            <h3 className="text-2xl font-bold text-foreground">
              {getPhaseEmoji(phase)} {phase}
            </h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {phase === 'Accumulation' && 'Early cycle - build positions'}
          {phase === 'Expansion' && 'Mid cycle - trending up'}
          {phase === 'Euphoria' && 'Late cycle - manage risk'}
          {phase === 'Recession' && 'Correction - wait for bottom'}
        </p>
      </Card>
    </div>
  );
}
