import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, DollarSign, Target, RefreshCw, Plus } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { supabase } from '@/integrations/supabase/client';
import AddConnectionDialog from '@/components/AddConnectionDialog';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const UnifiedDashboard = () => {
  const { holdings, totalValue, loading: portfolioLoading, fetchPortfolio } = usePortfolio();
  const [marketData, setMarketData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');

  // Fetch market data
  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const [btcRes, ethRes] = await Promise.all([
        supabase.functions.invoke('fetch-crypto-data', { body: { symbol: 'BTC' } }),
        supabase.functions.invoke('fetch-crypto-data', { body: { symbol: 'ETH' } }),
      ]);

      const btcPrice = btcRes.data?.data?.Data?.Data?.[btcRes.data?.data?.Data?.Data?.length - 1]?.close || 0;
      const ethPrice = ethRes.data?.data?.Data?.Data?.[ethRes.data?.data?.Data?.Data?.length - 1]?.close || 0;

      setMarketData({
        btc: btcPrice,
        eth: ethPrice,
        btcChange: 2.5,
        ethChange: -1.2,
      });
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Calculate portfolio breakdown
  const portfolioBreakdown = holdings.reduce((acc, holding) => {
    const existing = acc.find((item: any) => item.name === holding.asset_symbol);
    if (existing) {
      existing.value += Number(holding.value_usd) || 0;
    } else {
      acc.push({
        name: holding.asset_symbol,
        value: Number(holding.value_usd) || 0,
      });
    }
    return acc;
  }, [] as any[]);

  const portfolioGrowth = [
    { date: 'Jan', value: totalValue * 0.7 },
    { date: 'Feb', value: totalValue * 0.75 },
    { date: 'Mar', value: totalValue * 0.85 },
    { date: 'Apr', value: totalValue * 0.92 },
    { date: 'May', value: totalValue },
  ];

  return (
    <div className="min-h-screen dashboard-gradient p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Navigation />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold gradient-text">Market & Portfolio Hub</h1>
            <p className="text-muted-foreground">Real-time market data + your holdings in one place</p>
          </div>
          <div className="flex gap-2">
            <AddConnectionDialog onConnectionAdded={fetchPortfolio} />
            <Button onClick={() => { fetchMarketData(); fetchPortfolio(); }} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">{holdings.length} assets</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">BTC Price</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${marketData.btc?.toLocaleString()}</p>
              <Badge variant={marketData.btcChange > 0 ? 'default' : 'destructive'} className="text-xs mt-1">
                {marketData.btcChange > 0 ? '+' : ''}{marketData.btcChange}%
              </Badge>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">ETH Price</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${marketData.eth?.toLocaleString()}</p>
              <Badge variant={marketData.ethChange > 0 ? 'default' : 'destructive'} className="text-xs mt-1">
                {marketData.ethChange > 0 ? '+' : ''}{marketData.ethChange}%
              </Badge>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                Today's P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">+$0.00</p>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Portfolio Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={portfolioGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                        formatter={(value: any) => [`$${value.toFixed(2)}`, 'Value']}
                      />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolioBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={portfolioBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {portfolioBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                          formatter={(value: any) => [`$${value.toFixed(2)}`, 'Value']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      No holdings to display
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Holdings Tab */}
          <TabsContent value="holdings" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Your Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                {holdings.length > 0 ? (
                  <div className="space-y-3">
                    {holdings.map((holding) => (
                      <div key={holding.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-semibold">{holding.asset_name || holding.asset_symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {Number(holding.amount).toFixed(8)} {holding.asset_symbol}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${(Number(holding.value_usd) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @ ${(Number(holding.price_usd) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold mb-2">No Holdings Yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add your first holding to start tracking your portfolio
                    </p>
                    <AddConnectionDialog onConnectionAdded={fetchPortfolio} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Markets Tab */}
          <TabsContent value="markets" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Crypto Markets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-semibold">Bitcoin</p>
                      <p className="text-sm text-muted-foreground">BTC</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${marketData.btc?.toLocaleString()}</p>
                      <Badge variant={marketData.btcChange > 0 ? 'default' : 'destructive'} className="text-xs">
                        {marketData.btcChange > 0 ? '+' : ''}{marketData.btcChange}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-semibold">Ethereum</p>
                      <p className="text-sm text-muted-foreground">ETH</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${marketData.eth?.toLocaleString()}</p>
                      <Badge variant={marketData.ethChange > 0 ? 'default' : 'destructive'} className="text-xs">
                        {marketData.ethChange > 0 ? '+' : ''}{marketData.ethChange}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Holding
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Prices
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Target className="w-4 h-4 mr-2" />
                    Set Alerts
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UnifiedDashboard;
