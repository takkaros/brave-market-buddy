import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  TrendingUp, 
  Download, 
  Trash2, 
  Plus,
  RefreshCw,
  PieChart as PieChartIcon,
  List
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import AddHoldingDialog from '@/components/AddHoldingDialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1'];

interface Holding {
  id: string;
  asset_symbol: string;
  asset_name: string;
  amount: number;
  price_usd: number;
  value_usd: number;
  last_updated_at: string;
}

export default function Portfolio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchHoldings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('user_id', user.id)
        .order('value_usd', { ascending: false });

      if (error) throw error;
      setHoldings(data || []);
    } catch (error: any) {
      console.error('Failed to fetch holdings:', error);
      toast({
        title: 'Failed to Load Portfolio',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const syncPrices = async () => {
    if (holdings.length === 0) return;
    
    setSyncing(true);
    try {
      const updates = await Promise.all(
        holdings.map(async (holding) => {
          try {
            const response = await fetch(
              `https://min-api.cryptocompare.com/data/price?fsym=${holding.asset_symbol}&tsyms=USD`
            );
            const data = await response.json();
            
            if (data.USD) {
              const newPrice = data.USD;
              const newValue = holding.amount * newPrice;
              
              await supabase
                .from('portfolio_holdings')
                .update({
                  price_usd: newPrice,
                  value_usd: newValue,
                  last_updated_at: new Date().toISOString(),
                })
                .eq('id', holding.id);
              
              return { ...holding, price_usd: newPrice, value_usd: newValue };
            }
            return holding;
          } catch (error) {
            console.error(`Failed to update ${holding.asset_symbol}:`, error);
            return holding;
          }
        })
      );

      setHoldings(updates);
      toast({
        title: 'Prices Updated',
        description: 'All holdings have been synced with latest prices',
      });
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const deleteHolding = async (id: string) => {
    try {
      const { error } = await supabase
        .from('portfolio_holdings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Holding Deleted',
        description: 'Successfully removed from portfolio',
      });
      
      fetchHoldings();
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    if (holdings.length === 0) {
      toast({
        title: 'No Data',
        description: 'Add some holdings before exporting',
        variant: 'destructive',
      });
      return;
    }

    // Create CSV content
    const headers = ['Asset Symbol', 'Asset Name', 'Amount', 'Price (USD)', 'Value (USD)', 'Last Updated'];
    const rows = holdings.map(h => [
      h.asset_symbol,
      h.asset_name || h.asset_symbol,
      h.amount,
      h.price_usd,
      h.value_usd,
      new Date(h.last_updated_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total Value,,,,$${totalValue.toFixed(2)}`,
      `Export Date,,,,${new Date().toLocaleDateString()}`,
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'CSV Exported',
      description: 'Portfolio exported successfully for tax purposes',
    });
  };

  useEffect(() => {
    fetchHoldings();

    // Set up realtime subscription
    const channel = supabase
      .channel('portfolio-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolio_holdings',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchHoldings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const totalValue = holdings.reduce((sum, h) => sum + (Number(h.value_usd) || 0), 0);

  // Prepare chart data
  const chartData = holdings.map(h => ({
    name: h.asset_symbol,
    value: Number(h.value_usd) || 0,
  }));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Navigation />

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Portfolio</h1>
            <p className="text-muted-foreground">Track and manage your crypto holdings</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={syncPrices} variant="outline" size="sm" disabled={syncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync Prices
            </Button>
            <AddHoldingDialog onAdded={fetchHoldings} />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{holdings.length}</p>
              <p className="text-xs text-muted-foreground">Assets tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Last Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {holdings.length > 0 
                  ? new Date(Math.max(...holdings.map(h => new Date(h.last_updated_at).getTime()))).toLocaleString()
                  : 'No data'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <List className="w-4 h-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="chart" className="gap-2">
              <PieChartIcon className="w-4 h-4" />
              Chart View
            </TabsTrigger>
          </TabsList>

          {/* List View */}
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Your Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : holdings.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold mb-2">No Holdings Yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add your first holding to start tracking your portfolio
                    </p>
                    <AddHoldingDialog onAdded={fetchHoldings} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {holdings.map((holding) => (
                      <div
                        key={holding.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-semibold text-lg">{holding.asset_symbol}</p>
                              <p className="text-sm text-muted-foreground">{holding.asset_name || holding.asset_symbol}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right mr-4">
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="font-semibold">
                            {Number(holding.amount).toFixed(8)} {holding.asset_symbol}
                          </p>
                        </div>

                        <div className="text-right mr-4">
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-semibold">
                            ${(Number(holding.price_usd) || 0).toLocaleString(undefined, { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2 
                            })}
                          </p>
                        </div>

                        <div className="text-right mr-4">
                          <p className="text-sm text-muted-foreground">Value</p>
                          <p className="font-bold text-lg">
                            ${(Number(holding.value_usd) || 0).toLocaleString(undefined, { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2 
                            })}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteHolding(holding.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chart View */}
          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                {holdings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No data to display
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`$${value.toFixed(2)}`, 'Value']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
