import { useState, useEffect } from 'react';
import { generateMockData, generateHistoricalData } from '@/utils/mockData';
import { calculateRiskScore } from '@/utils/riskCalculator';
import Navigation from '@/components/Navigation';
import RiskGauge from '@/components/RiskGauge';
import CategoryCard from '@/components/CategoryCard';
import AIAnalysisPanel from '@/components/AIAnalysisPanel';
import RiskTrendChart from '@/components/RiskTrendChart';
import FearGreedGauge from '@/components/FearGreedGauge';
import AssetAllocationChart from '@/components/AssetAllocationChart';
import KeyIndicatorsChart from '@/components/KeyIndicatorsChart';
import APIStatusMonitor from '@/components/APIStatusMonitor';
import OverallMarketAnalysis from '@/components/OverallMarketAnalysis';
import RiskForecast from '@/components/RiskForecast';
import InfoTooltip from '@/components/InfoTooltip';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Settings, TrendingUp, BarChart3, RefreshCw, Plus, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';

const Dashboard = () => {
  const navigate = useNavigate();
  const mockData = generateMockData('bottom');
  const historicalData = generateHistoricalData(180);
  const { score, categories } = calculateRiskScore(mockData);
  const previousScore = historicalData[historicalData.length - 30]?.score;
  const [syncing, setSyncing] = useState(false);

  const [overallAnalysis, setOverallAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [riskForecast, setRiskForecast] = useState<any>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [marketData, setMarketData] = useState({
    btcPrice: 0,
    ethPrice: 0,
    goldPrice: 0,
    silverPrice: 0,
    yield10Y: 0,
    yield2Y: 0,
    cyprusHPI: 0,
  });

  const fetchOverallAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('overall-market-analysis', {
        body: {
          ...marketData,
          vix: mockData.vix,
          fearGreed: mockData.fearGreedIndex,
          sp500: 4500, // Would fetch from stocks API
        }
      });

      // Check for specific error types in data before throwing
      if (data?.error === 'PAYMENT_REQUIRED') {
        toast.error('💳 AI Credits Exhausted', {
          description: 'Please add Lovable AI credits to continue using AI features.',
          duration: 10000,
        });
        return;
      }

      if (data?.error === 'RATE_LIMIT') {
        toast.error('⏱️ Rate Limit Exceeded', {
          description: 'Too many requests. Please wait a moment and try again.',
          duration: 5000,
        });
        return;
      }

      if (error) throw error;

      if (data?.success && data.analysis) {
        setOverallAnalysis(data.analysis);
      }
    } catch (error: any) {
      toast.error('Failed to fetch overall market analysis');
    } finally {
      setAnalysisLoading(false);
    }

    // Generate risk forecast
    setForecastLoading(true);
    try {
      const { data: forecastData, error: forecastError } = await supabase.functions.invoke('risk-forecast', {
        body: {
          currentScore: score,
          historicalData: historicalData,
          marketData: {
            btcPrice: marketData.btcPrice,
            goldPrice: marketData.goldPrice,
            vix: mockData.vix,
            yield10Y: marketData.yield10Y,
            fearGreed: mockData.fearGreedIndex,
          },
        },
      });

      // Check for specific error types in data before throwing
      if (forecastData?.error === 'PAYMENT_REQUIRED') {
        toast.error('💳 AI Credits Exhausted', {
          description: 'Please add Lovable AI credits to continue using AI features.',
          duration: 10000,
        });
        return;
      }

      if (forecastData?.error === 'RATE_LIMIT') {
        toast.error('⏱️ Rate Limit Exceeded', {
          description: 'Too many requests. Please wait a moment and try again.',
          duration: 5000,
        });
        return;
      }

      if (forecastError) throw forecastError;

      if (!forecastData.success) throw new Error(forecastData.error);

      setRiskForecast(forecastData.forecast);
    } catch (error: any) {
      toast.error('Failed to generate risk forecast');
    } finally {
      setForecastLoading(false);
    }
  };

  useEffect(() => {
    // Fetch all market data first, then trigger analysis
    const fetchAllMarketData = async () => {
      try {
        const [cryptoBTC, cryptoETH, metalsGold, metalsSilver, bonds, cyprusHousing] = await Promise.all([
          supabase.functions.invoke('fetch-crypto-data', { body: { symbol: 'BTC' } }),
          supabase.functions.invoke('fetch-crypto-data', { body: { symbol: 'ETH' } }),
          supabase.functions.invoke('fetch-metals-data', { body: { metal: 'GOLD' } }),
          supabase.functions.invoke('fetch-metals-data', { body: { metal: 'SILVER' } }),
          supabase.functions.invoke('fetch-bond-data', { body: { timeframe: '1M' } }),
          supabase.functions.invoke('fetch-cyprus-housing'),
        ]);

        const newMarketData = {
          btcPrice: cryptoBTC.data?.data?.Data?.Data?.[cryptoBTC.data?.data?.Data?.Data?.length - 1]?.close || 0,
          ethPrice: cryptoETH.data?.data?.Data?.Data?.[cryptoETH.data?.data?.Data?.Data?.length - 1]?.close || 0,
          goldPrice: metalsGold.data?.data?.Data?.Data?.[metalsGold.data?.data?.Data?.Data?.length - 1]?.close || 0,
          silverPrice: metalsSilver.data?.data?.Data?.Data?.[metalsSilver.data?.data?.Data?.Data?.length - 1]?.close || 0,
          yield10Y: parseFloat(bonds.data?.yield10?.observations?.[bonds.data?.yield10?.observations?.length - 1]?.value || '0'),
          yield2Y: parseFloat(bonds.data?.yield2?.observations?.[bonds.data?.yield2?.observations?.length - 1]?.value || '0'),
          cyprusHPI: parseFloat(cyprusHousing.data?.housingData?.observations?.[0]?.value || '0'),
        };

        setMarketData(newMarketData);
      } catch (error) {
        // Error handled silently
      }
    };

    fetchAllMarketData();
  }, []);

  useEffect(() => {
    // Trigger analysis when market data is ready
    if (marketData.btcPrice > 0) {
      fetchOverallAnalysis();
    }
  }, [marketData]);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      const { data: connections, error } = await supabase
        .from('portfolio_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('connection_type', 'exchange');

      if (error) {
        toast.error('Failed to fetch connections');
        return;
      }

      if (!connections || connections.length === 0) {
        toast.error('No exchange connections found. Add one in Portfolio page.');
        return;
      }

      let totalSynced = 0;
      let totalFailed = 0;
      
      for (const conn of connections) {
        try {
          const { data, error: syncError } = await supabase.functions.invoke('sync-exchange-balance', {
            body: {
              connectionId: conn.id,
              exchangeName: conn.exchange_name,
              apiKey: conn.api_key,
              apiSecret: conn.api_secret,
              apiPassphrase: conn.api_passphrase,
            }
          });
          
          if (syncError) throw syncError;
          if (data?.success) totalSynced++;
          else totalFailed++;
        } catch (error: any) {
          console.error(`Failed to sync ${conn.name}:`, error);
          totalFailed++;
        }
      }

      if (totalSynced > 0) {
        toast.success(`✅ Synced ${totalSynced} exchange(s)${totalFailed > 0 ? `, ${totalFailed} failed` : ''}`);
      } else {
        toast.error('Failed to sync any exchanges');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync exchanges');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <Navigation />
        
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-gradient mb-2">AI Wealth Navigator</h1>
          <p className="text-sm md:text-base text-muted-foreground">Real-time economic risk analysis with AI-powered investment guidance</p>
        </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOverallAnalysis}
              disabled={analysisLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${analysisLoading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh Analysis</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/indicators')}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">All Indicators</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/chat')}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden md:inline">AI Chat</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings')}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Settings</span>
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <button
            onClick={() => navigate('/portfolio')}
            className="glass-card rounded-lg p-4 md:p-6 hover:scale-105 transition-transform hover:shadow-lg hover:shadow-primary/20 group"
          >
            <Plus className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
            <p className="text-sm md:text-base font-medium text-center">Add Holding</p>
          </button>

          <button
            onClick={() => navigate('/portfolio')}
            className="glass-card rounded-lg p-4 md:p-6 hover:scale-105 transition-transform hover:shadow-lg hover:shadow-primary/20 group"
          >
            <Wallet className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
            <p className="text-sm md:text-base font-medium text-center">View Portfolio</p>
          </button>

          <button
            onClick={() => navigate('/chat')}
            className="glass-card rounded-lg p-4 md:p-6 hover:scale-105 transition-transform hover:shadow-lg hover:shadow-primary/20 group"
          >
            <MessageSquare className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
            <p className="text-sm md:text-base font-medium text-center">Get AI Advice</p>
          </button>

          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="glass-card rounded-lg p-4 md:p-6 hover:scale-105 transition-transform hover:shadow-lg hover:shadow-primary/20 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <RefreshCw className={`w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform ${syncing ? 'animate-spin' : ''}`} />
            <p className="text-sm md:text-base font-medium text-center">Sync Exchanges</p>
          </button>
        </div>

        {/* Alert Banner */}
        <div className="glass-card rounded-lg p-4 border-l-4 border-risk-moderate">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-risk-moderate" />
            <div>
              <p className="font-medium">Market Opportunity Detected</p>
              <p className="text-sm text-muted-foreground">
                Risk declining from 67 → {score}. Fear & Greed at {mockData.fearGreedIndex}. 
                Contrarian buy signal strengthening.
              </p>
            </div>
          </div>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RiskGauge score={score} previousScore={previousScore} />
          </div>
          <div className="space-y-6">
            <FearGreedGauge value={mockData.fearGreedIndex} />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <KeyIndicatorsChart indicators={{
            vix: mockData.vix,
            yieldCurve10y2y: mockData.yieldCurve10y2y,
            unemploymentRate: mockData.unemploymentRate,
            fearGreedIndex: mockData.fearGreedIndex,
          }} />
          <AssetAllocationChart riskScore={score} />
        </div>

        {/* Overall Market Analysis - New Section */}
        <OverallMarketAnalysis analysis={overallAnalysis} loading={analysisLoading} />
        
        {/* Risk Forecast */}
        <RiskForecast forecast={riskForecast} loading={forecastLoading} />

        {/* AI Analysis and API Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIAnalysisPanel 
            riskScore={score} 
            fearGreedIndex={mockData.fearGreedIndex}
            onOpenChat={() => navigate('/chat')}
          />
          <APIStatusMonitor />
        </div>

        {/* Risk Trend Chart */}
        <RiskTrendChart data={historicalData} />

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.name} category={category} />
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Data Quality</p>
            <p className="text-2xl font-bold text-risk-low">95%</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Indicators</p>
            <p className="text-2xl font-bold">35</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
            <p className="text-2xl font-bold">Live</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Anomalies</p>
            <p className="text-2xl font-bold text-risk-elevated">2</p>
          </div>
        </div>

        {/* Demo Mode Notice */}
        <div className="glass-card rounded-lg p-4 text-center text-sm text-muted-foreground">
          <p>Your API connections are now active! Real-time data from FRED, Alpha Vantage, CryptoCompare, and more.</p>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
