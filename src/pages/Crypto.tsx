import { generateMockData } from '@/utils/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Navigation from '@/components/Navigation';
import InfoTooltip from '@/components/InfoTooltip';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

const Crypto = () => {
  const mockData = generateMockData('bottom');
  
  // Crypto-specific metrics
  const btcPrice = 42000;
  const ethPrice = 2250;
  const btcDominance = 52;
  const fearGreed = mockData.fearGreedIndex;
  const cryptoMarketCap = 1.65; // Trillion
  
  // Mock historical data
  const priceHistory = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    btc: btcPrice + (Math.random() - 0.5) * 5000,
    eth: ethPrice + (Math.random() - 0.5) * 300,
  }));

  const volumeData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    volume: 45 + (Math.random() - 0.5) * 15,
  }));

  // Calculate signal
  const getBuySignal = () => {
    if (fearGreed < 30 && btcPrice < 45000) return 'STRONG BUY';
    if (fearGreed < 40 && btcPrice < 50000) return 'BUY';
    if (fearGreed > 70 || btcPrice > 65000) return 'SELL';
    return 'HOLD';
  };

  const signal = getBuySignal();
  const signalColor = signal.includes('BUY') ? 'hsl(142, 76%, 36%)' : 
                      signal === 'HOLD' ? 'hsl(45, 93%, 47%)' : 
                      'hsl(0, 84%, 60%)';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Cryptocurrency Analysis</h1>
          <p className="text-muted-foreground">
            Bitcoin, Ethereum, and crypto market indicators with AI recommendations
          </p>
        </div>

        <Navigation />

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
                  {signal.includes('BUY') ? '8.5' : signal === 'HOLD' ? '5.0' : '2.5'}/10
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <p className="text-sm text-risk-elevated mt-1">-39% from ATH ($69k)</p>
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
              <p className="text-sm text-risk-elevated mt-1">-54% from ATH ($4.8k)</p>
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
                Price History (30 Days)
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
                Trading Volume (30 Days)
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
              <Button size="sm" variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-invert max-w-none">
              <h3 className="text-xl font-bold mb-3">Current Assessment: {signal}</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                    {signal.includes('BUY') ? <TrendingUp className="w-5 h-5 text-risk-low" /> : <TrendingDown className="w-5 h-5 text-risk-elevated" />}
                    Market Context
                  </h4>
                  <p className="text-muted-foreground">
                    Bitcoin at ${btcPrice.toLocaleString()} is down 39% from its $69k all-time high. 
                    Historical data shows BTC typically bottoms between $30k-$45k during bear markets, 
                    making current levels attractive for long-term accumulation. Fear & Greed Index at {fearGreed} 
                    indicates extreme fear - often the best time to buy according to contrarian indicators.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2">💡 Specific Actions</h4>
                  <ul className="space-y-2 ml-4">
                    <li>
                      <strong>Bitcoin (60% allocation):</strong> Dollar-cost average into BTC over 2-3 months. 
                      Target allocation: {signal.includes('BUY') ? '5-10%' : '2-5%'} of portfolio.
                    </li>
                    <li>
                      <strong>Ethereum (30% allocation):</strong> ETH at ${ethPrice.toLocaleString()} offers higher risk/reward. 
                      Good for tech-savvy investors who understand DeFi and NFTs.
                    </li>
                    <li>
                      <strong>Alt Coins (10% allocation):</strong> Only for aggressive investors. 
                      Wait for BTC to establish uptrend before rotating into alts.
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-risk-moderate" />
                    Risk Factors
                  </h4>
                  <ul className="space-y-1 ml-4 text-muted-foreground">
                    <li>• Regulatory uncertainty (SEC lawsuits, potential bans)</li>
                    <li>• Macroeconomic headwinds (Fed rate hikes, recession fears)</li>
                    <li>• Exchange risk (FTX collapse still fresh in memory)</li>
                    <li>• Leverage liquidations can cause sudden 20%+ drops</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2">📊 Key Levels to Watch</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">Support Levels:</p>
                      <p className="text-muted-foreground">BTC: $38k, $32k, $28k</p>
                      <p className="text-muted-foreground">ETH: $2k, $1.8k, $1.5k</p>
                    </div>
                    <div>
                      <p className="font-medium">Resistance Levels:</p>
                      <p className="text-muted-foreground">BTC: $48k, $52k, $58k</p>
                      <p className="text-muted-foreground">ETH: $2.5k, $3k, $3.5k</p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
                  <p className="font-semibold mb-2">Bottom Line for Crypto:</p>
                  <p className="text-muted-foreground">
                    {signal.includes('BUY') ? 
                      "This is a strong accumulation zone. History suggests buying when fear is high. Expected 12-24 month return: +100-300% if crypto follows previous cycles. Start with 3-5% portfolio allocation, increase to 10% if conviction grows." :
                      signal === 'HOLD' ?
                      "Market is neutral. Wait for clearer direction. Use this time to research and prepare. Set alerts for key support/resistance levels." :
                      "Risk/reward not favorable. Take profits on existing positions. Wait for Fear & Greed below 30 and BTC below $45k before re-entering."}
                  </p>
                </div>
              </div>
            </div>
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
