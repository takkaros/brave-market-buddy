import { useState, useEffect } from 'react';
import { generateMockData } from '@/utils/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navigation from '@/components/Navigation';
import InfoTooltip from '@/components/InfoTooltip';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Home, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Housing = () => {
  const [timeframe, setTimeframe] = useState('1Y');
  const mockData = generateMockData('bottom');
  
  // Cyprus housing-specific metrics
  const [houseIndex, setHouseIndex] = useState(185);
  const [priceYoY, setPriceYoY] = useState(-2.3);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState<Array<{ month: number; price: number }>>([]);
  
  const mortgageRate = mockData.mortgageRate;
  const affordability = 102; // Cyprus specific
  const inventory = 5.2; // months
  
  const fetchCyprusHousingData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-cyprus-housing');

      if (error) throw error;

      if (data?.success && data.housingData) {
        const observations = data.housingData.observations || [];
        
        if (observations.length > 0) {
          // Get latest value
          const latest = observations[0];
          const previousYear = observations.find((o: any, i: number) => i >= 4); // ~1 year ago (quarterly data)
          
          const currentIndex = parseFloat(latest.value);
          setHouseIndex(currentIndex);
          
          if (previousYear) {
            const yoyChange = ((currentIndex - parseFloat(previousYear.value)) / parseFloat(previousYear.value)) * 100;
            setPriceYoY(yoyChange);
          }
          
          // Build price history
          const history = observations.reverse().map((obs: any, i: number) => ({
            month: i + 1,
            price: parseFloat(obs.value),
          }));
          
          setPriceHistory(history);
        }
        
        setLastUpdated(new Date().toLocaleString());
        
        if (data.fallback) {
          toast.warning('Using fallback data - FRED API limit may have been reached');
        }
      }
    } catch (error) {
      console.error('Error fetching Cyprus housing data:', error);
      toast.error('Failed to fetch Cyprus housing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCyprusHousingData();
    const interval = setInterval(fetchCyprusHousingData, 30 * 60 * 1000); // Refresh every 30 minutes
    return () => clearInterval(interval);
  }, []);

  const regionalData = [
    { region: 'West', price: 650000, change: -12 },
    { region: 'Northeast', price: 480000, change: -6 },
    { region: 'South', price: 350000, change: -4 },
    { region: 'Midwest', price: 280000, change: -2 },
  ];

  const getSignal = () => {
    if (mortgageRate > 7 && affordability < 95) return 'WAIT';
    if (mortgageRate < 5 && affordability > 110) return 'BUY';
    return 'MONITOR';
  };

  const signal = getSignal();
  const signalColor = signal === 'BUY' ? 'hsl(142, 76%, 36%)' : 
                      signal === 'MONITOR' ? 'hsl(45, 93%, 47%)' : 
                      'hsl(0, 84%, 60%)';

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">Cyprus Housing Market Analysis</h1>
            <p className="text-muted-foreground">
              Cyprus real estate prices, market trends, and investment opportunities
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">Last updated: {lastUpdated}</p>
            )}
          </div>
          <Button onClick={fetchCyprusHousingData} disabled={loading} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Navigation />

        {/* Timeframe Selector */}
        <div className="flex justify-end">
          <Tabs value={timeframe} onValueChange={setTimeframe}>
            <TabsList className="glass-card">
              <TabsTrigger value="3M">3M</TabsTrigger>
              <TabsTrigger value="6M">6M</TabsTrigger>
              <TabsTrigger value="1Y">1Y</TabsTrigger>
              <TabsTrigger value="2Y">2Y</TabsTrigger>
              <TabsTrigger value="5Y">5Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Signal Card */}
        <Card className="glass-card border-l-4" style={{ borderLeftColor: signalColor }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: signalColor }}>
                  {signal === 'BUY' ? '🏡 BUY SIGNAL' : signal === 'MONITOR' ? '⏸️ WAIT & WATCH' : '⛔ NOT YET'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Mortgage rates: {mortgageRate}% | Affordability: {affordability} | HPI: {houseIndex.toFixed(1)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Buy Score</p>
                <p className="text-4xl font-bold" style={{ color: signalColor }}>
                  {signal === 'BUY' ? '7.5' : signal === 'MONITOR' ? '5.0' : '3.0'}/10
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
                House Price Index
                <InfoTooltip content="Cyprus House Price Index from Bank for International Settlements. Base 100 = reference period. Rising index = appreciating prices." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{houseIndex.toFixed(1)}</p>
              <p className={`text-sm mt-1 ${priceYoY > 0 ? 'text-risk-low' : 'text-risk-elevated'}`}>
                {priceYoY > 0 ? '+' : ''}{priceYoY.toFixed(1)}% YoY
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                30-Year Mortgage Rate
                <InfoTooltip content="Average 30-year fixed mortgage rate. Below 4% = very strong. 6-7% = moderate. Above 7% = expensive." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{mortgageRate}%</p>
              <p className="text-sm text-risk-elevated mt-1">+3.5% from 2021 lows</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Affordability Index
                <InfoTooltip content="100 = typical family can afford median home. Below 100 = unaffordable. Above 120 = very affordable. Currently at crisis levels." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{affordability}</p>
              <p className="text-sm text-risk-elevated mt-1">Worst since 2006</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Months of Inventory
                <InfoTooltip content="How long it would take to sell all homes at current pace. <4 = seller's market. 6 = balanced. >6 = buyer's market." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{inventory}</p>
              <p className="text-sm text-risk-low mt-1">↑ from 0.9 (improving)</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                Cyprus House Price Trend (Quarterly)
                <InfoTooltip content="Cyprus House Price Index over time. Quarterly data from BIS. Shows the long-term trend of property values." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceHistory.length > 0 ? priceHistory : []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 'Quarters', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 'Index', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="price" stroke="hsl(var(--chart-1))" strokeWidth={2} name="HPI" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                Regional Price Changes (YoY)
                <InfoTooltip content="Year-over-year price changes by region. West coast typically leads both up and down cycles." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="region" 
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
                  <Bar dataKey="change" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>AI Housing Market Analysis</CardTitle>
              <Button size="sm" variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-invert max-w-none">
              <h3 className="text-xl font-bold mb-3">Assessment: {signal}</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Current Market Conditions
                  </h4>
                  <p className="text-muted-foreground">
                    Housing affordability is at crisis levels (index: {affordability}) due to combination of:
                    (1) Still-elevated prices from 2020-2022 bubble, (2) Mortgage rates at {mortgageRate}% 
                    (vs 3% in 2021), and (3) Stagnant wage growth. Monthly payment on median home is now 
                    $2,800 vs $1,400 in 2020 - essentially doubling the cost of homeownership.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2">📉 Why Prices Are Sticky</h4>
                  <ul className="space-y-2 ml-4 text-muted-foreground">
                    <li>• Most homeowners locked in 3-4% mortgages - no incentive to sell</li>
                    <li>• Low inventory ({inventory} months) prevents major price drops</li>
                    <li>• Sellers would rather wait than take a loss</li>
                    <li>• No mass foreclosures like 2008 (lending standards much stricter)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-risk-moderate" />
                    The Math on Buying Now
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                    <div className="bg-risk-elevated/10 p-4 rounded">
                      <p className="font-semibold text-foreground mb-2">If You Buy Today:</p>
                      <p>• Median home: $420k</p>
                      <p>• 20% down: $84k</p>
                      <p>• Monthly payment: $2,800</p>
                      <p>• Stuck with {mortgageRate}% rate</p>
                    </div>
                    <div className="bg-risk-low/10 p-4 rounded">
                      <p className="font-semibold text-foreground mb-2">If You Wait 6-12 Months:</p>
                      <p>• Potential 5-10% price drop</p>
                      <p>• Rates may fall to 6%</p>
                      <p>• Payment could be $2,300</p>
                      <p>• Save $500/month = $6k/year</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2">✅ When Housing Becomes a Buy</h4>
                  <p className="text-muted-foreground mb-2">You'll know it's time when you see:</p>
                  <ul className="space-y-1 ml-4 text-muted-foreground">
                    <li>1. Mortgage rates fall below 6% (Fed rate cuts)</li>
                    <li>2. Prices drop another 5-10% from current levels</li>
                    <li>3. Inventory rises above 4 months (more choices)</li>
                    <li>4. Affordability index improves to 105+</li>
                    <li>5. Sellers start getting desperate (price cuts, concessions)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-risk-elevated" />
                    Exception: When to Buy Anyway
                  </h4>
                  <p className="text-muted-foreground mb-2">Consider buying now despite bad timing if:</p>
                  <ul className="space-y-1 ml-4 text-muted-foreground">
                    <li>• You're relocating for work (no choice)</li>
                    <li>• Renting costs more than buying in your market</li>
                    <li>• You plan to stay 7-10+ years (can ride out downturn)</li>
                    <li>• You found an underpriced gem or distressed sale</li>
                    <li>• Life circumstances demand stability (kids, schools)</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    In these cases: Negotiate hard, get seller concessions, and you can always refinance if rates drop.
                  </p>
                </div>

                <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
                  <p className="font-semibold mb-2">Bottom Line for Housing:</p>
                  <p className="text-muted-foreground">
                    {signal === 'BUY' ? 
                      "Market conditions are favorable. Rates are reasonable, affordability is improving, and inventory is balanced. Good time for buyers with long-term horizon." :
                      signal === 'MONITOR' ?
                      "Market is in transition. Prices softening but not compelling yet. Continue saving for larger down payment. Expected 6-12 months before optimal entry." :
                      "Housing is EXPENSIVE. Unless you must buy (life circumstances), wait. Prices need 10-15% correction and/or rates need to fall to 6% before risk/reward improves. Rent and save aggressively for 12-18 months."}
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
                New Home Sales
                <InfoTooltip content="Monthly pace of new home sales. Falling = builders struggling. Rising = market recovering." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">680k</p>
              <p className="text-sm text-risk-elevated mt-1">-15% YoY</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Price Reductions
                <InfoTooltip content="% of listings with price cuts. Above 30% = sellers getting desperate (bullish for buyers)." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">32%</p>
              <p className="text-sm text-risk-low mt-1">Increasing (good for buyers)</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Days on Market
                <InfoTooltip content="Average days a home sits before selling. <30 = hot market. >60 = cooling. >90 = cold." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">42 days</p>
              <p className="text-sm text-muted-foreground mt-1">Up from 18 (2022)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Housing;
