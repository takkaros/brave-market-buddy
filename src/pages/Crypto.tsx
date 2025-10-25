import { useState, useEffect } from 'react';
import { generateMockData } from '@/utils/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Navigation from '@/components/Navigation';
import InfoTooltip from '@/components/InfoTooltip';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIAnalysis {
  signal: string;
  signalScore: number;
  marketContext: string;
  btcAllocation: string;
  ethAllocation: string;
  altAllocation: string;
  btcSupport: string[];
  btcResistance: string[];
  ethSupport: string[];
  ethResistance: string[];
  riskFactors: string[];
  bottomLine: string;
}

const Crypto = () => {
  const [timeframe, setTimeframe] = useState('1M');
  const [btcPrice, setBtcPrice] = useState(42000);
  const [ethPrice, setEthPrice] = useState(2250);
  const [btcAth, setBtcAth] = useState(108135); // Will be updated dynamically
  const [ethAth, setEthAth] = useState(4878); // Will be updated dynamically
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [cryptoHoldings, setCryptoHoldings] = useState<any[]>([]);
  const mockData = generateMockData('bottom');
  const { toast } = useToast();
  
  // Crypto-specific metrics
  const btcDominance = 52;
  const fearGreed = mockData.fearGreedIndex;
  const cryptoMarketCap = 1.65; // Trillion

  const fetchAIAnalysis = async (currentBtcPrice: number, currentEthPrice: number, holdings: any[]) => {
    setAnalysisLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('crypto-market-analysis', {
        body: { 
          btcPrice: currentBtcPrice,
          ethPrice: currentEthPrice,
          fearGreed,
          btcDominance,
          marketCap: cryptoMarketCap,
          holdings: holdings.map(h => ({
            symbol: h.asset_symbol,
            name: h.asset_name,
            amount: h.amount,
            value_usd: h.value_usd,
            price_usd: h.price_usd
          }))
        }
      });

      if (error) throw error;

      if (data?.success && data?.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
      toast({
        title: "Failed to fetch AI analysis",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const fetchCryptoData = async () => {
    setLoading(true);
    try {
      // Fetch holdings
      const { data: holdingsData, error: holdingsError } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .in('asset_symbol', ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'DOT'])
        .order('value_usd', { ascending: false });

      if (!holdingsError && holdingsData) {
        setCryptoHoldings(holdingsData);
      }

      const { data: btcData, error: btcError } = await supabase.functions.invoke('fetch-crypto-data', {
        body: { symbol: 'BTC', timeframe }
      });

      if (btcError) throw btcError;

      let newBtcPrice = btcPrice;
      let newEthPrice = ethPrice;

      if (btcData?.success && btcData?.data?.Data?.Data) {
        const latestBTC = btcData.data.Data.Data[btcData.data.Data.Data.length - 1];
        newBtcPrice = latestBTC.close;
        setBtcPrice(newBtcPrice);
        
        // Calculate ATH dynamically from historical data
        const btcHigh = Math.max(...btcData.data.Data.Data.map((d: any) => d.high));
        setBtcAth(Math.max(btcHigh, 108135)); // Use historical high or known ATH
      }

      const { data: ethData, error: ethError } = await supabase.functions.invoke('fetch-crypto-data', {
        body: { symbol: 'ETH', timeframe }
      });

      if (ethError) throw ethError;

      if (ethData?.success && ethData?.data?.Data?.Data) {
        const latestETH = ethData.data.Data.Data[ethData.data.Data.Data.length - 1];
        newEthPrice = latestETH.close;
        setEthPrice(newEthPrice);
        
        // Calculate ATH dynamically from historical data
        const ethHigh = Math.max(...ethData.data.Data.Data.map((d: any) => d.high));
        setEthAth(Math.max(ethHigh, 4878)); // Use historical high or known ATH
      }

      setLastUpdated(new Date().toLocaleString());
      
      // Fetch AI analysis with updated prices and holdings
      await fetchAIAnalysis(newBtcPrice, newEthPrice, holdingsData || []);
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      toast({
        title: "Failed to fetch crypto data",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 5 * 60 * 1000);

    // Setup realtime subscription for holdings
    const channel = supabase
      .channel('crypto-holdings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolio_holdings'
        },
        () => {
          fetchCryptoData();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [timeframe]);
  
  // Generate data based on timeframe
  const getDataPoints = () => {
    switch(timeframe) {
      case '1D': return 24;
      case '1W': return 7;
      case '1M': return 30;
      case '3M': return 90;
      case '6M': return 180;
      case '1Y': return 365;
      default: return 30;
    }
  };
  
  const dataPoints = getDataPoints();
  
  // Mock historical data
  const priceHistory = Array.from({ length: dataPoints }, (_, i) => ({
    day: i + 1,
    btc: btcPrice + (Math.random() - 0.5) * 5000 - i * 2,
    eth: ethPrice + (Math.random() - 0.5) * 300 - i * 0.3,
  }));

  const volumeData = Array.from({ length: dataPoints }, (_, i) => ({
    day: i + 1,
    volume: 45 + (Math.random() - 0.5) * 15,
  }));

  // Calculate signal from AI or fallback
  const signal = aiAnalysis?.signal || 'HOLD';
  const signalScore = aiAnalysis?.signalScore || 5.0;
  const signalColor = signal.includes('BUY') ? 'hsl(142, 76%, 36%)' : 
                      signal === 'HOLD' ? 'hsl(45, 93%, 47%)' : 
                      'hsl(0, 84%, 60%)';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Cryptocurrency Analysis</h1>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Bitcoin, Ethereum, and crypto market indicators with AI recommendations
            </p>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
        </div>

        <Navigation />

        {/* Timeframe Selector */}
        <div className="flex justify-end">
          <Tabs value={timeframe} onValueChange={setTimeframe}>
            <TabsList className="glass-card">
              <TabsTrigger value="1D">1D</TabsTrigger>
              <TabsTrigger value="1W">1W</TabsTrigger>
              <TabsTrigger value="1M">1M</TabsTrigger>
              <TabsTrigger value="3M">3M</TabsTrigger>
              <TabsTrigger value="6M">6M</TabsTrigger>
              <TabsTrigger value="1Y">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Signal Card */}
        <Card className="glass-card border-l-4" style={{ borderLeftColor: signalColor }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: signalColor }}>
                  {signal}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Current Market Conditions: Fear & Greed at {fearGreed}, BTC at ${btcPrice.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                <p className="text-4xl font-bold" style={{ color: signalColor }}>
                  {signalScore}/10
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Crypto Holdings */}
        {cryptoHoldings.length > 0 && (
          <Card className="glass-card border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💼 Your Crypto Holdings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cryptoHoldings.map((holding) => {
                  const totalValue = cryptoHoldings.reduce((sum, h) => sum + (h.value_usd || 0), 0);
                  const allocation = totalValue > 0 ? ((holding.value_usd / totalValue) * 100).toFixed(1) : '0';
                  
                  return (
                    <div key={holding.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-semibold">{holding.asset_name || holding.asset_symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {holding.amount} {holding.asset_symbol}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${(holding.value_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @ ${(holding.price_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                        </p>
                      </div>
                      <Badge variant="outline">{allocation}%</Badge>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Crypto Value:</span>
                  <span className="text-xl font-bold">
                    ${cryptoHoldings.reduce((sum, h) => sum + (h.value_usd || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Bitcoin Price
                <InfoTooltip content="Current BTC/USD price. Below $40k historically marks strong accumulation zones. Above $65k typically signals distribution." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${btcPrice.toLocaleString()}</p>
              <p className="text-sm text-risk-elevated mt-1">
                {((btcPrice - btcAth) / btcAth * 100).toFixed(1)}% from ATH (${btcAth.toLocaleString()})
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Ethereum Price
                <InfoTooltip content="Current ETH/USD price. ETH tends to be more volatile than BTC with 2x+ moves in bull markets." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${ethPrice.toLocaleString()}</p>
              <p className="text-sm text-risk-elevated mt-1">
                {((ethPrice - ethAth) / ethAth * 100).toFixed(1)}% from ATH (${ethAth.toLocaleString()})
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                BTC Dominance
                <InfoTooltip content="Bitcoin's market cap as % of total crypto. Rising = money flowing to BTC (safety). Falling = alt season beginning." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{btcDominance}%</p>
              <p className="text-sm text-risk-low mt-1">↑ 2% (consolidating)</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Market Cap
                <InfoTooltip content="Total crypto market capitalization. Peak was $3T (Nov 2021). Below $2T = bear market. Above $2.5T = bull market." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${cryptoMarketCap}T</p>
              <p className="text-sm text-muted-foreground mt-1">-45% from peak</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                Price History ({timeframe})
                <InfoTooltip content="BTC and ETH price trends. Look for higher lows (bullish) or lower highs (bearish)." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="btc" stroke="hsl(var(--chart-1))" strokeWidth={2} name="BTC" />
                  <Line type="monotone" dataKey="eth" stroke="hsl(var(--chart-2))" strokeWidth={2} name="ETH" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                Trading Volume ({timeframe})
                <InfoTooltip content="Daily trading volume in billions. High volume + price increase = strong move. Low volume = weak trend." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>AI Crypto Market Analysis</CardTitle>
              <Button size="sm" variant="outline" className="gap-2" onClick={fetchCryptoData} disabled={loading || analysisLoading}>
                <RefreshCw className={`w-4 h-4 ${(loading || analysisLoading) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysisLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="ml-3 text-muted-foreground">Generating AI analysis...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="prose prose-invert max-w-none">
                <h3 className="text-xl font-bold mb-3">Current Assessment: {aiAnalysis.signal}</h3>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                      {aiAnalysis.signal.includes('BUY') ? <TrendingUp className="w-5 h-5 text-risk-low" /> : <TrendingDown className="w-5 h-5 text-risk-elevated" />}
                      Market Context
                    </h4>
                    <p className="text-muted-foreground">
                      {aiAnalysis.marketContext}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-base mb-2">💡 Specific Actions</h4>
                    <ul className="space-y-2 ml-4">
                      <li>
                        <strong>Bitcoin ({aiAnalysis.btcAllocation} allocation):</strong> Primary crypto holding
                      </li>
                      <li>
                        <strong>Ethereum ({aiAnalysis.ethAllocation} allocation):</strong> Secondary position
                      </li>
                      <li>
                        <strong>Alt Coins ({aiAnalysis.altAllocation} allocation):</strong> Speculative positions
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-risk-moderate" />
                      Risk Factors
                    </h4>
                    <ul className="space-y-1 ml-4 text-muted-foreground">
                      {aiAnalysis.riskFactors.map((factor, idx) => (
                        <li key={idx}>• {factor}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-base mb-2">📊 Key Levels to Watch</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">Support Levels:</p>
                        <p className="text-muted-foreground">BTC: {aiAnalysis.btcSupport.join(', ')}</p>
                        <p className="text-muted-foreground">ETH: {aiAnalysis.ethSupport.join(', ')}</p>
                      </div>
                      <div>
                        <p className="font-medium">Resistance Levels:</p>
                        <p className="text-muted-foreground">BTC: {aiAnalysis.btcResistance.join(', ')}</p>
                        <p className="text-muted-foreground">ETH: {aiAnalysis.ethResistance.join(', ')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
                    <p className="font-semibold mb-2">Bottom Line for Crypto:</p>
                    <p className="text-muted-foreground">
                      {aiAnalysis.bottomLine}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Click refresh to generate AI analysis
              </div>
            )}
          </CardContent>
        </Card>

        {/* On-Chain Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Exchange Reserves
                <InfoTooltip content="Bitcoin held on exchanges. Decreasing = accumulation (bullish). Increasing = potential selling pressure." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">2.3M BTC</p>
              <p className="text-sm text-risk-low mt-1">↓ 8% (bullish)</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Active Addresses
                <InfoTooltip content="Number of unique Bitcoin addresses transacting daily. Higher = more network activity and adoption." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">845k</p>
              <p className="text-sm text-risk-moderate mt-1">→ Stable</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Hash Rate
                <InfoTooltip content="Bitcoin network security. Higher = more miners securing network = healthier ecosystem. ATH = very bullish." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">450 EH/s</p>
              <p className="text-sm text-risk-low mt-1">Near ATH (bullish)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Crypto;
