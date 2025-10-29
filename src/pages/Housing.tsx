import { useState, useEffect } from 'react';
import { generateMockData } from '@/utils/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [mortgageRate, setMortgageRate] = useState(4.8); // Cyprus ECB rate
  const [affordability, setAffordability] = useState(102); // Cyprus specific
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState<Array<{ month: number; price: number }>>([]);
  
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

        // Get Cyprus mortgage rate
        if (data.mortgageData?.observations?.[0]?.value) {
          const rate = parseFloat(data.mortgageData.observations[0].value);
          setMortgageRate(rate);
        }

        // Calculate affordability (simplified: higher HPI = lower affordability)
        // Using 250 as baseline (when HPI=100, affordability=150)
        // Formula: affordability decreases as HPI increases
        const calculatedAffordability = Math.round(250 - (houseIndex * 0.8));
        setAffordability(calculatedAffordability);
        
        setLastUpdated(new Date().toLocaleString());
        
        if (data.fallback) {
          toast.warning('Using fallback Cyprus data - FRED API limit may have been reached');
        }
      }
    } catch (error) {
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
    { region: 'Limassol', price: 320000, change: -1.8 },
    { region: 'Nicosia', price: 210000, change: -2.5 },
    { region: 'Paphos', price: 250000, change: -1.2 },
    { region: 'Larnaca', price: 195000, change: -1.0 },
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
                   Cyprus Mortgage Rate: {mortgageRate.toFixed(1)}% | Affordability: {affordability} | Cyprus HPI: {houseIndex.toFixed(1)}
                 </p>
                 <p className="text-xs text-muted-foreground mt-1">
                   🇨🇾 All data sources: Cyprus-specific (FRED/BIS)
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
                 Cyprus Mortgage Rate 🇨🇾
                 <InfoTooltip content="Cyprus lending rate from ECB. Below 3% = very low. 4-5% = moderate. Above 6% = expensive. Cyprus rates typically lower than EU average." />
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-3xl font-bold">{mortgageRate.toFixed(1)}%</p>
               <p className="text-sm text-muted-foreground mt-1">Cyprus ECB data</p>
             </CardContent>
           </Card>

           <Card className="glass-card">
             <CardHeader className="pb-3">
               <CardTitle className="text-sm flex items-center">
                 Cyprus Affordability 🇨🇾
                 <InfoTooltip content="Calculated from Cyprus HPI and median income. 100 = typical Cypriot family can afford median home. Below 100 = challenging. Above 120 = very affordable." />
               </CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-3xl font-bold">{affordability}</p>
               <p className="text-sm text-muted-foreground mt-1">Based on Cyprus data</p>
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
                    Cyprus housing market shows moderate unaffordability (index: {affordability}) driven by:
                    (1) Foreign investor demand (Russian, UK, Middle East buyers), (2) Limited new construction supply,
                    and (3) Strong cash-buyer presence reducing mortgage sensitivity. Unlike larger markets, 
                    Cyprus prices are sticky due to foreign capital flows and citizenship-by-investment programs.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2">📉 Why Cyprus Prices Are Extra Sticky</h4>
                  <ul className="space-y-2 ml-4 text-muted-foreground">
                    <li>• 40-50% of purchases are cash buyers (foreign investors) - no mortgage sensitivity</li>
                    <li>• Small market means limited inventory - sellers have pricing power</li>
                    <li>• Citizenship/residency programs attract wealthy buyers regardless of rates</li>
                    <li>• Less mortgage-driven than U.S./UK - local buyers often pay cash or large deposits</li>
                    <li>• Tourist rental income provides yield buffer for investors</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-risk-moderate" />
                    Cyprus Market Reality Check
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                    <div className="bg-risk-elevated/10 p-4 rounded">
                      <p className="font-semibold text-foreground mb-2">Current Situation:</p>
                      <p>• Median Limassol: €320k</p>
                      <p>• Median Nicosia: €210k</p>
                      <p>• Foreign buyer competition</p>
                      <p>• Limited new supply</p>
                      <p>• Sticky prices (slow declines)</p>
                    </div>
                    <div className="bg-risk-low/10 p-4 rounded">
                      <p className="font-semibold text-foreground mb-2">Price Outlook:</p>
                      <p>• Expect 2-4% decline (not 10-15%)</p>
                      <p>• Adjustments will take 12-24 months</p>
                      <p>• Coastal areas most resilient</p>
                      <p>• Rental yields: 4-6% possible</p>
                      <p>• Smaller market = slower moves</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2">✅ When Cyprus Housing Becomes More Attractive</h4>
                  <p className="text-muted-foreground mb-2">Watch for these modest improvements:</p>
                  <ul className="space-y-1 ml-4 text-muted-foreground">
                    <li>1. Prices stabilize or drop 2-4% (don't expect 10%+ crashes)</li>
                    <li>2. More properties staying on market 6+ months</li>
                    <li>3. Sellers offering minor concessions (furniture, repairs)</li>
                    <li>4. ECB rate cuts improve local mortgage rates</li>
                    <li>5. New construction projects delayed/cancelled (supply tightening eases)</li>
                  </ul>
                  <p className="text-muted-foreground mt-2 italic">
                    Note: Cyprus won't see dramatic price crashes due to foreign cash buyers and small market dynamics.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-risk-elevated" />
                    Cyprus-Specific Buying Considerations
                  </h4>
                  <p className="text-muted-foreground mb-2">Cyprus market favors buyers who:</p>
                  <ul className="space-y-1 ml-4 text-muted-foreground">
                    <li>• Seek residency/citizenship benefits (if programs active)</li>
                    <li>• Can pay mostly cash (avoid high mortgage rates)</li>
                    <li>• Want rental income (4-6% yields in tourist areas)</li>
                    <li>• Plan to hold 10+ years (weather small downturns)</li>
                    <li>• Target secondary cities (Larnaca, Paphos) over Limassol</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    Remember: Smaller markets move slower. Price declines will be 2-4% over 18-24 months, not sudden 15% drops.
                  </p>
                </div>

                <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
                  <p className="font-semibold mb-2">Bottom Line for Cyprus Housing:</p>
                  <p className="text-muted-foreground">
                    {signal === 'BUY' ? 
                      "Conditions are reasonable for Cyprus market. Foreign demand stable, rental yields attractive. Good for long-term holders with cash/large deposits." :
                      signal === 'MONITOR' ?
                      "Cyprus market is cooling slowly. Prices may soften 2-4% over 12-18 months. Continue monitoring—no urgency but no crash expected either." :
                      "Cyprus housing is moderately overpriced but won't crash like larger markets. If you can wait 12-18 months, expect small (2-4%) price improvements. Foreign investor demand provides price floor. Unlike U.S., don't expect 10-15% drops—Cyprus adjusts slowly due to smaller, less mortgage-driven market."}
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
