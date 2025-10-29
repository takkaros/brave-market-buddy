// Real-time Performance Dashboard with Institutional Metrics
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Target, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateComprehensiveMetrics, type Trade, type DailyReturn } from '@/utils/performanceMetrics';

export default function PerformanceDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, [user]);

  const loadPerformanceData = async () => {
    if (!user) return;

    try {
      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('executed_at', { ascending: true });

      const { data: holdings } = await supabase
        .from('portfolio_holdings')
        .select('value_usd')
        .eq('user_id', user.id);

      const totalValue = holdings?.reduce((sum, h) => sum + (h.value_usd || 0), 0) || 10000;
      const initialCapital = 10000;

      // Calculate daily returns (simplified)
      const dailyReturns: DailyReturn[] = [];
      const equityCurve = [initialCapital];

      const calculated = calculateComprehensiveMetrics(
        trades as Trade[] || [],
        dailyReturns,
        equityCurve,
        initialCapital,
        totalValue
      );

      setMetrics(calculated);
    } catch (error) {
      console.error('Error loading performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return <Card><CardContent className="p-6">Loading performance metrics...</CardContent></Card>;
  }

  const getColorClass = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Return */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Total Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getColorClass(metrics.totalReturnUsd)}`}>
            ${metrics.totalReturnUsd.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.totalReturnPercent.toFixed(2)}% • {metrics.annualizedReturnPercent.toFixed(2)}% annualized
          </p>
        </CardContent>
      </Card>

      {/* Win Rate */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4" />
            Win Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.winRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.winningTrades}W / {metrics.losingTrades}L • {metrics.totalTrades} trades
          </p>
        </CardContent>
      </Card>

      {/* Sharpe Ratio */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Sharpe Ratio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.sharpeRatio.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Risk-adjusted returns
          </p>
        </CardContent>
      </Card>

      {/* Max Drawdown */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Max Drawdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {metrics.maxDrawdownPercent.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ${metrics.maxDrawdownUsd.toFixed(2)} peak to trough
          </p>
        </CardContent>
      </Card>

      {/* Profit Factor */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.profitFactor.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Avg Win: ${metrics.averageWinUsd.toFixed(2)} • Avg Loss: ${metrics.averageLossUsd.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {/* Expectancy */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Expectancy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getColorClass(metrics.expectancy)}`}>
            ${metrics.expectancy.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Average profit per trade
          </p>
        </CardContent>
      </Card>

      {/* Streaks */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.currentStreak > 0 ? (
              <span className="text-green-500">+{metrics.currentStreak}</span>
            ) : (
              <span className="text-red-500">{metrics.currentStreak}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Best: {metrics.longestWinningStreak}W • Worst: {metrics.longestLosingStreak}L
          </p>
        </CardContent>
      </Card>

      {/* Advanced Ratios */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Advanced Ratios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sortino:</span>
            <span className="font-semibold">{metrics.sortinoRatio.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Calmar:</span>
            <span className="font-semibold">{metrics.calmarRatio.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Volatility:</span>
            <span className="font-semibold">{metrics.volatility.toFixed(2)}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
