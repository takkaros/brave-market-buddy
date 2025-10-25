import { generateMockData } from '@/utils/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navigation from '@/components/Navigation';
import InfoTooltip from '@/components/InfoTooltip';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Activity } from 'lucide-react';

const Stocks = () => {
  const mockData = generateMockData('bottom');
  
  // Stock market metrics
  const sp500 = 4200;
  const sp500PE = mockData.sp500PE;
  const vix = mockData.vix;
  const earnings = 225; // S&P 500 trailing earnings
  
  const historicalReturns = Array.from({ length: 12 }, (_, i) => ({
    month: `M${i + 1}`,
    sp500: sp500 + (Math.random() - 0.5) * 400,
    nasdaq: 13000 + (Math.random() - 0.5) * 1000,
  }));

  const sectorData = [
    { sector: 'Tech', performance: 15.2 },
    { sector: 'Healthcare', performance: 8.5 },
    { sector: 'Financials', performance: 6.3 },
    { sector: 'Consumer', performance: 4.1 },
    { sector: 'Energy', performance: -2.5 },
    { sector: 'Utilities', performance: -4.8 },
  ];

  const getSignal = () => {
    if (sp500PE < 18 && vix < 25) return 'BUY';
    if (sp500PE > 25 || vix > 35) return 'SELL';
    return 'HOLD';
  };

  const signal = getSignal();
  const signalColor = signal === 'BUY' ? 'hsl(142, 76%, 36%)' : 
                      signal === 'HOLD' ? 'hsl(45, 93%, 47%)' : 
                      'hsl(0, 84%, 60%)';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Stock Market Analysis</h1>
          <p className="text-muted-foreground">
            S&P 500, valuations, volatility, and sector performance analysis
          </p>
        </div>

        <Navigation />

        {/* Signal Card */}
        <Card className="glass-card border-l-4" style={{ borderLeftColor: signalColor }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: signalColor }}>
                  {signal}
                </h3>
                <p className="text-sm text-muted-foreground">
                  S&P 500: {sp500} | P/E: {sp500PE}x | VIX: {vix}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Market Score</p>
                <p className="text-4xl font-bold" style={{ color: signalColor }}>
                  {signal === 'BUY' ? '8.0' : signal === 'HOLD' ? '5.5' : '2.5'}/10
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                S&P 500 Index
                <InfoTooltip content="Represents 500 largest U.S. companies. Historical average: 10% annual return. Down 18% from peak = correction territory." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{sp500.toLocaleString()}</p>
              <p className="text-sm text-risk-elevated mt-1">-18% from ATH</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                P/E Ratio
                <InfoTooltip content="Price-to-Earnings ratio. Below 15 = cheap. 15-20 = fair value. Above 25 = expensive. Current level suggests reasonable valuations." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{sp500PE}x</p>
              <p className="text-sm text-risk-low mt-1">Below 20x = attractive</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                VIX (Fear Index)
                <InfoTooltip content="Market volatility index. Below 15 = complacent. 15-25 = normal. Above 30 = fear. Spikes above 40 = panic (best buying opportunities)." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{vix}</p>
              <p className="text-sm text-risk-moderate mt-1">Elevated fear</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Earnings Yield
                <InfoTooltip content="Inverse of P/E ratio. Shows stock market 'yield'. Compare to 10Y Treasury (4.5%). Higher = stocks more attractive than bonds." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{(100 / sp500PE).toFixed(1)}%</p>
              <p className="text-sm text-risk-low mt-1">vs 4.5% bonds</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                Market Performance (12 Months)
                <InfoTooltip content="S&P 500 and NASDAQ trends. Tech-heavy NASDAQ typically more volatile with higher upside in bull markets." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalReturns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
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
                  <Line type="monotone" dataKey="sp500" stroke="hsl(var(--chart-1))" strokeWidth={2} name="S&P 500" />
                  <Line type="monotone" dataKey="nasdaq" stroke="hsl(var(--chart-2))" strokeWidth={2} name="NASDAQ" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                Sector Performance (YTD)
                <InfoTooltip content="Year-to-date returns by sector. Tech leads in bull markets, Utilities/Healthcare defensive in bears." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="sector"
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
                  <Bar dataKey="performance" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>AI Stock Market Analysis</CardTitle>
              <Button size="sm" variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <h3 className="text-xl font-bold mb-3">Market Outlook: {signal}</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Valuation Analysis
                  </h4>
                  <p className="text-muted-foreground">
                    S&P 500 trading at {sp500PE}x trailing earnings - below historical average of 19x. 
                    This suggests stocks are reasonably valued, not bubble territory. Earnings yield of {(100 / sp500PE).toFixed(1)}% 
                    exceeds 10Y Treasury at 4.5%, making stocks relatively attractive vs bonds.
                    Market is down 18% from peak, entering value territory.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2">📊 What the Data Says</h4>
                  <ul className="space-y-2 ml-4 text-muted-foreground">
                    <li><strong>Bullish Signals:</strong> P/E ratio compressed, earnings stable, VIX elevated (contrarian buy)</li>
                    <li><strong>Bearish Signals:</strong> Recession still possible, Fed hasn't pivoted yet, earnings could deteriorate</li>
                    <li><strong>Key Levels:</strong> Support at 4,000, Resistance at 4,500. Break above 4,500 = new bull market</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2">💡 Investment Strategy</h4>
                  <div className="space-y-3">
                    <div className="bg-primary/10 p-4 rounded">
                      <p className="font-semibold mb-2">For Index Investors (Beginners):</p>
                      <p className="text-muted-foreground">
                        Buy low-cost S&P 500 index fund (VOO, SPY, IVV). Dollar-cost average over 3-6 months. 
                        Target allocation: 60-70% stocks. Expected 12-month return: +15-25%.
                      </p>
                    </div>

                    <div className="bg-primary/10 p-4 rounded">
                      <p className="font-semibold mb-2">For Stock Pickers (Advanced):</p>
                      <p className="text-muted-foreground">
                        Focus on: (1) Quality growth at reasonable prices (MSFT, GOOGL, META), 
                        (2) Value stocks with strong balance sheets (BRK.B, JPM), 
                        (3) Dividend aristocrats (JNJ, PG, KO). Avoid speculative growth and unprofitable companies.
                      </p>
                    </div>

                    <div className="bg-primary/10 p-4 rounded">
                      <p className="font-semibold mb-2">Sector Allocation:</p>
                      <ul className="text-muted-foreground space-y-1">
                        <li>• Tech: 25% (MSFT, GOOGL, NVDA)</li>
                        <li>• Healthcare: 15% (UNH, JNJ, LLY)</li>
                        <li>• Financials: 15% (JPM, BRK.B, V)</li>
                        <li>• Consumer: 20% (AMZN, WMT, COST)</li>
                        <li>• Industrials: 10% (HON, UNP)</li>
                        <li>• Energy: 5% (XOM, CVX)</li>
                        <li>• Other: 10%</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-risk-moderate" />
                    What Could Go Wrong?
                  </h4>
                  <ul className="space-y-1 ml-4 text-muted-foreground">
                    <li>• Fed keeps rates high longer than expected (earnings pressure)</li>
                    <li>• Recession materializes (corporate profits drop 15-20%)</li>
                    <li>• Geopolitical crisis (war, pandemic, banking crisis)</li>
                    <li>• Tech bubble bursts (valuations still elevated in some names)</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    <strong>Mitigation:</strong> Keep 15-20% cash reserves, diversify across sectors, 
                    don't use leverage, rebalance quarterly.
                  </p>
                </div>

                <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
                  <p className="font-semibold mb-2">Bottom Line for Stocks:</p>
                  <p className="text-muted-foreground">
                    {signal === 'BUY' ? 
                      "This is a GOOD entry point for long-term investors. Valuations reasonable, fear elevated, downside limited. Start with 60-70% allocation, dollar-cost average over 3-6 months. Expected 12-18 month return: +20-30%. Be patient and ignore short-term volatility." :
                      signal === 'HOLD' ?
                      "Market is fairly valued. Not cheap, not expensive. Stay invested but don't add aggressively. Maintain current allocation. Watch for P/E compression or VIX spike to add more." :
                      "Stocks are EXPENSIVE and/or risky. Valuations stretched, sentiment too bullish. Reduce exposure to 40-50%, raise cash to 30%. Wait for 10-15% pullback or P/E compression below 18x before adding."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Dividend Yield
                <InfoTooltip content="S&P 500 average dividend yield. Historical range: 1.5-2.5%. Higher yields often mark bottoms." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">1.8%</p>
              <p className="text-sm text-muted-foreground mt-1">Moderate</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Put/Call Ratio
                <InfoTooltip content="Options positioning. Above 1.0 = defensive/bearish. Below 0.7 = greedy/bullish. Contrarian indicator." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{mockData.putCallRatio}</p>
              <p className="text-sm text-risk-low mt-1">Defensive (bullish contrarian)</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Forward P/E
                <InfoTooltip content="Price relative to next 12 months earnings estimates. Typically 1-2 points lower than trailing P/E." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">16.5x</p>
              <p className="text-sm text-risk-low mt-1">Attractive vs historical</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Stocks;
