import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Download, 
  Trash2, 
  Plus,
  RefreshCw,
  PieChart as PieChartIcon,
  List,
  Bitcoin,
  LineChart as LineChartIcon,
  Building,
  Coins,
  Home,
  Calculator,
  BarChart3,
  Link as LinkIcon
} from 'lucide-react';
import { HoldingRow } from '@/components/HoldingRow';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import AddHoldingDialog from '@/components/AddHoldingDialog';
import TaxCalculator from '@/components/TaxCalculator';
import { SyncLogViewer } from '@/components/SyncLogViewer';
import TradingPanel from '@/components/TradingPanel';
import PerformanceDashboard from '@/components/PerformanceDashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ErrorBoundary from '@/components/ErrorBoundary';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1'];

export interface Holding {
  id: string;
  asset_symbol: string;
  asset_name: string;
  amount: number;
  price_usd: number;
  value_usd: number;
  last_updated_at: string;
  asset_type: string;
  purchase_price_usd?: number;
  purchase_date?: string;
  notes?: string;
  connection_id?: string | null;
}

interface WalletConnection {
  id: string;
  name: string;
  blockchain: string;
  wallet_address: string;
  last_synced_at: string | null;
  is_active: boolean;
}

interface ExchangeConnection {
  id: string;
  name: string;
  exchange_name: string;
  api_key: string;
  api_secret: string;
  last_synced_at: string | null;
  is_active: boolean;
}

export default function Portfolio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [walletConnections, setWalletConnections] = useState<WalletConnection[]>([]);
  const [exchangeConnections, setExchangeConnections] = useState<ExchangeConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingWallet, setSyncingWallet] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<Array<{ timestamp: string; message: string; type: 'success' | 'error' | 'info' }>>([]);
  const [hideSmallBalances, setHideSmallBalances] = useState(false);

  // Helper function to get connection label for a holding
  const getConnectionLabel = (connectionId: string | null | undefined): string => {
    if (!connectionId) return 'Manual';
    
    const wallet = walletConnections.find(w => w.id === connectionId);
    if (wallet) return wallet.name;
    
    const exchange = exchangeConnections.find(e => e.id === connectionId);
    if (exchange) return exchange.name;
    
    return 'Unknown';
  };

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
      toast({
        title: 'Failed to Load Portfolio',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletConnections = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('portfolio_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('connection_type', 'wallet')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWalletConnections(data || []);
    } catch (error: any) {
      // Error handled silently
    }
  };

  const fetchExchangeConnections = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('portfolio_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('connection_type', 'exchange')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExchangeConnections(data || []);
    } catch (error: any) {
      // Error handled silently
    }
  };

  const syncWallet = async (connectionId: string) => {
    setSyncingWallet(connectionId);
    const timestamp = new Date().toISOString();
    
    setSyncLogs(prev => [...prev, { 
      timestamp, 
      message: `🔄 Syncing wallet...`, 
      type: 'info' 
    }]);

    try {
      const { data, error } = await supabase.functions.invoke('sync-wallet-balance', {
        body: { connectionId }
      });

      if (error) {
        setSyncLogs(prev => [...prev, {
          timestamp: new Date().toISOString(), 
          message: `❌ Wallet sync failed: ${error.message}`, 
          type: 'error' 
        }]);
        toast({
          title: 'Sync Failed',
          description: error.message || 'Failed to sync wallet balance',
          variant: 'destructive',
        });
      } else {
        // Add logs from the response
        if (data?.logs) {
          setSyncLogs(prev => [...prev, ...data.logs.map((msg: string) => ({
            timestamp: new Date().toISOString(),
            message: msg,
            type: 'success' as const
          }))]);
        }
        
        toast({
          title: 'Wallet Synced',
          description: 'Wallet synced successfully',
        });
        fetchHoldings();
        fetchWalletConnections();
      }
    } catch (error: any) {
      setSyncLogs(prev => [...prev, {
        timestamp: new Date().toISOString(), 
        message: `❌ Error: ${error.message}`, 
        type: 'error' 
      }]);
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSyncingWallet(null);
    }
  };

  const syncExchange = async (connectionId: string) => {
    setSyncingWallet(connectionId);
    const timestamp = new Date().toISOString();
    
    setSyncLogs(prev => [...prev, { 
      timestamp, 
      message: `🔄 Syncing exchange...`, 
      type: 'info' 
    }]);

    try {
      const { data, error } = await supabase.functions.invoke('sync-exchange-balance', {
        body: { connectionId }
      });

      if (error) {
        setSyncLogs(prev => [...prev, {
          timestamp: new Date().toISOString(), 
          message: `❌ Exchange sync failed: ${error.message}`, 
          type: 'error' 
        }]);
        toast({
          title: 'Sync Failed',
          description: error.message || 'Failed to sync exchange balance',
          variant: 'destructive',
        });
      } else {
        // Add logs from the response
        if (data?.logs) {
          setSyncLogs(prev => [...prev, ...data.logs.map((msg: string) => ({
            timestamp: new Date().toISOString(),
            message: msg,
            type: 'success' as const
          }))]);
        }
        
        toast({
          title: 'Exchange Synced',
          description: 'Exchange synced successfully',
        });
        fetchHoldings();
        fetchExchangeConnections();
      }
    } catch (error: any) {
      setSyncLogs(prev => [...prev, {
        timestamp: new Date().toISOString(), 
        message: `❌ Error: ${error.message}`, 
        type: 'error' 
      }]);
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSyncingWallet(null);
    }
  };

  const deleteConnection = async (connectionId: string, isExchange = false) => {
    try {
      // Delete all holdings associated with this connection
      await supabase
        .from('portfolio_holdings')
        .delete()
        .eq('connection_id', connectionId);

      // Delete the connection
      const { error } = await supabase
        .from('portfolio_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: 'Connection Deleted',
        description: 'Connection and associated holdings removed',
      });
      
      fetchHoldings();
      if (isExchange) {
        fetchExchangeConnections();
      } else {
        fetchWalletConnections();
      }
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
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
    fetchWalletConnections();
    fetchExchangeConnections();

    // Set up realtime subscriptions
    const holdingsChannel = supabase
      .channel('portfolio-holdings-changes')
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

    const connectionsChannel = supabase
      .channel('portfolio-connections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolio_connections',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchWalletConnections();
          fetchExchangeConnections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(holdingsChannel);
      supabase.removeChannel(connectionsChannel);
    };
  }, [user]);

  // Calculate real P&L based on purchase prices
  const totalValue = holdings.reduce((sum, h) => sum + (Number(h.value_usd) || 0), 0);
  const totalCost = holdings.reduce((sum, h) => {
    const cost = (h.purchase_price_usd || h.price_usd) * h.amount;
    return sum + cost;
  }, 0);
  const dayChange = totalValue - totalCost;
  const dayChangePercent = totalCost > 0 ? (dayChange / totalCost) * 100 : 0;

  // Filter holdings based on hideSmallBalances toggle
  const filteredHoldings = hideSmallBalances 
    ? holdings.filter(h => (h.value_usd || 0) > 1)
    : holdings;

  // Calculate asset allocation
  const assetAllocation = holdings.reduce((acc, h) => {
    const type = h.asset_type || 'other';
    acc[type] = (acc[type] || 0) + (h.value_usd || 0);
    return acc;
  }, {} as Record<string, number>);

  const topAssets = [...holdings]
    .sort((a, b) => (b.value_usd || 0) - (a.value_usd || 0))
    .slice(0, 5);

  // Prepare chart data
  const chartData = holdings.map(h => ({
    name: h.asset_symbol,
    value: Number(h.value_usd) || 0,
  }));

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
        <Navigation />

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">Portfolio Powerhouse</h1>
            <p className="text-sm md:text-base text-muted-foreground">Track all your assets: Crypto, Stocks, Bonds, ETFs, Real Estate & more</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button 
              onClick={() => setHideSmallBalances(!hideSmallBalances)} 
              variant={hideSmallBalances ? "default" : "outline"} 
              size="sm" 
              className="flex-1 md:flex-none"
            >
              {hideSmallBalances ? "Show All" : "Hide <$1"}
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm" className="flex-1 md:flex-none">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button onClick={syncPrices} variant="outline" size="sm" disabled={syncing} className="flex-1 md:flex-none">
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Prices</span>
              <span className="sm:hidden">Sync</span>
            </Button>
            <AddHoldingDialog onAdded={() => { fetchHoldings(); fetchWalletConnections(); }} />
          </div>
        </div>

        {/* Sync Log Viewer */}
        {syncLogs.length > 0 && (
          <div className="mb-6">
            <SyncLogViewer logs={syncLogs} />
          </div>
        )}

        {/* Hero Summary Card */}
        {holdings.length > 0 && (
          <Card className="glass-card p-6 md:p-8 border-2 border-primary/20 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Portfolio Value</p>
                <p className="text-3xl md:text-4xl font-bold text-gradient">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className={`flex items-center gap-1 mt-2 ${dayChange >= 0 ? 'text-risk-low' : 'text-risk-high'}`}>
                  {dayChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-sm font-medium">
                    ${Math.abs(dayChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                    ({dayChangePercent.toFixed(2)}%)
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">24h</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Holdings Count</p>
                <p className="text-3xl font-bold">{holdings.length}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Across {Object.keys(assetAllocation).length} asset types
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Top Asset</p>
                {topAssets[0] && (
                  <>
                    <p className="text-xl font-bold">{topAssets[0].asset_symbol}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ${(topAssets[0].value_usd || 0).toLocaleString()} 
                      ({((topAssets[0].value_usd || 0) / totalValue * 100).toFixed(1)}%)
                    </p>
                  </>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Asset Allocation</p>
                <div className="space-y-2">
                  {Object.entries(assetAllocation).slice(0, 3).map(([type, value]) => (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{type}</span>
                      <span className="font-medium">{((value / totalValue) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <List className="w-4 h-4" />
              All Assets
            </TabsTrigger>
            <TabsTrigger value="crypto" className="gap-2">
              <Bitcoin className="w-4 h-4" />
              Crypto
            </TabsTrigger>
            <TabsTrigger value="stocks" className="gap-2">
              <LineChartIcon className="w-4 h-4" />
              Stocks
            </TabsTrigger>
            <TabsTrigger value="bonds" className="gap-2">
              <Building className="w-4 h-4" />
              Bonds
            </TabsTrigger>
            <TabsTrigger value="other" className="gap-2">
              <Coins className="w-4 h-4" />
              Other
            </TabsTrigger>
            <TabsTrigger value="chart" className="gap-2">
              <PieChartIcon className="w-4 h-4" />
              Chart
            </TabsTrigger>
            <TabsTrigger value="tax" className="gap-2">
              <Calculator className="w-4 h-4" />
              Tax Helper
            </TabsTrigger>
            <TabsTrigger value="trading" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Trading
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="connections" className="gap-2">
              <LinkIcon className="w-4 h-4" />
              Connections
            </TabsTrigger>
          </TabsList>

          {/* All Assets */}
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : holdings.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-lg p-8">
                    <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-2xl font-bold mb-2">No Holdings Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Get started by adding your first holding or connecting an exchange to automatically sync your crypto portfolio
                    </p>
                    <AddHoldingDialog onAdded={fetchHoldings} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredHoldings.map((holding) => (
                      <HoldingRow 
                        key={holding.id} 
                        holding={holding} 
                        onDelete={deleteHolding}
                        onUpdate={fetchHoldings}
                        connectionLabel={getConnectionLabel(holding.connection_id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Crypto Tab - Aggregated View */}
          <TabsContent value="crypto">
            <AggregatedAssetTypeContent 
              holdings={filteredHoldings.filter(h => h.asset_type === 'crypto')} 
              type="Crypto"
              loading={loading}
              onDelete={deleteHolding}
              onAdded={fetchHoldings}
              onUpdate={fetchHoldings}
              getConnectionLabel={getConnectionLabel}
            />
          </TabsContent>

          {/* Stocks Tab */}
          <TabsContent value="stocks">
            <AssetTypeContent 
              holdings={filteredHoldings.filter(h => h.asset_type === 'stock')} 
              type="Stocks"
              loading={loading}
              onDelete={deleteHolding}
              onAdded={fetchHoldings}
              onUpdate={fetchHoldings}
              getConnectionLabel={getConnectionLabel}
            />
          </TabsContent>

          {/* Bonds Tab */}
          <TabsContent value="bonds">
            <AssetTypeContent 
              holdings={filteredHoldings.filter(h => h.asset_type === 'bond')} 
              type="Bonds"
              loading={loading}
              onDelete={deleteHolding}
              onAdded={fetchHoldings}
              onUpdate={fetchHoldings}
              getConnectionLabel={getConnectionLabel}
            />
          </TabsContent>

          {/* Other Tab */}
          <TabsContent value="other">
            <AssetTypeContent 
              holdings={filteredHoldings.filter(h => !['crypto', 'stock', 'bond'].includes(h.asset_type))} 
              type="Other Assets"
              loading={loading}
              onDelete={deleteHolding}
              onAdded={fetchHoldings}
              onUpdate={fetchHoldings}
              getConnectionLabel={getConnectionLabel}
            />
          </TabsContent>

          {/* Trading Tab */}
          <TabsContent value="trading">
            {topAssets.length > 0 ? (
              <TradingPanel 
                symbol={topAssets[0].asset_symbol}
                currentPrice={topAssets[0].price_usd}
                assetType={topAssets[0].asset_type as 'crypto' | 'stock' | 'bond' | 'metal' | 'other'}
              />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Add holdings to start trading</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <PerformanceDashboard />
          </TabsContent>

          {/* Tax Helper */}
          <TabsContent value="tax">
            <TaxCalculator holdings={holdings} />
          </TabsContent>

          {/* Connections */}
          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Connections</CardTitle>
              </CardHeader>
              <CardContent>
                {walletConnections.length === 0 ? (
                  <div className="text-center py-12">
                    <LinkIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold mb-2">No Wallet Connections</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect a crypto wallet to automatically sync your holdings
                    </p>
                    <AddHoldingDialog onAdded={() => { fetchHoldings(); fetchWalletConnections(); }} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {walletConnections.map((connection) => (
                      <div key={connection.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Wallet className="w-5 h-5" />
                            <div>
                              <p className="font-semibold">{connection.name}</p>
                              <p className="text-sm text-muted-foreground">
                                <Badge variant="outline" className="mr-2">{connection.blockchain}</Badge>
                                {connection.wallet_address.length > 20 
                                  ? `${connection.wallet_address.slice(0, 12)}...${connection.wallet_address.slice(-10)}`
                                  : connection.wallet_address
                                }
                              </p>
                              {connection.wallet_address.startsWith('xpub') && connection.wallet_address.length < 111 && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="destructive" className="text-xs">
                                    ⚠️ Invalid Address
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      deleteConnection(connection.id, false);
                                      toast({
                                        title: 'Connection Deleted',
                                        description: 'Now add a new connection with the complete xpub address (111 characters)',
                                      });
                                    }}
                                    className="h-6 text-xs"
                                  >
                                    Delete & Re-add
                                  </Button>
                                </div>
                              )}
                              {connection.last_synced_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Last synced: {new Date(connection.last_synced_at).toLocaleString()}
                                </p>
                              )}
                              {!connection.last_synced_at && (
                                <p className="text-xs text-destructive mt-1">
                                  Never synced - click sync to fetch your balance
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {!(connection.wallet_address.startsWith('xpub') && connection.wallet_address.length < 111) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => syncWallet(connection.id)}
                              disabled={syncingWallet === connection.id}
                            >
                              <RefreshCw className={`w-4 h-4 mr-2 ${syncingWallet === connection.id ? 'animate-spin' : ''}`} />
                              {syncingWallet === connection.id ? 'Syncing...' : 'Sync'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteConnection(connection.id, false)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exchange Connections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Exchange Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exchangeConnections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No exchange connections yet</p>
                    <p className="text-sm">Add API connections from the "Add Holding" button above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exchangeConnections.map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Building className="w-5 h-5" />
                          <div>
                            <p className="font-medium">{connection.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {connection.exchange_name}
                            </p>
                            {connection.last_synced_at && (
                              <p className="text-xs text-muted-foreground">
                                Last synced: {new Date(connection.last_synced_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncExchange(connection.id)}
                            disabled={syncingWallet === connection.id}
                          >
                            <RefreshCw className={`w-4 h-4 mr-2 ${syncingWallet === connection.id ? 'animate-spin' : ''}`} />
                            {syncingWallet === connection.id ? 'Syncing...' : 'Sync'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteConnection(connection.id, true)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
    </ErrorBoundary>
  );
}

// Helper component for aggregated crypto assets
function AggregatedAssetTypeContent({ 
  holdings, 
  type, 
  loading, 
  onDelete, 
  onAdded,
  onUpdate,
  getConnectionLabel
}: { 
  holdings: Holding[]; 
  type: string; 
  loading: boolean; 
  onDelete: (id: string) => void;
  onAdded: () => void;
  onUpdate: () => void;
  getConnectionLabel: (connectionId: string | null | undefined) => string;
}) {
  // Aggregate holdings by asset_symbol
  const aggregatedHoldings = holdings.reduce((acc, holding) => {
    const baseSymbol = holding.asset_symbol;
    
    if (!acc[baseSymbol]) {
      acc[baseSymbol] = {
        id: holding.id,
        asset_symbol: baseSymbol,
        asset_name: holding.asset_name?.replace(/\s*\(.*?\)\s*/g, '').trim() || baseSymbol,
        amount: 0,
        price_usd: holding.price_usd,
        value_usd: 0,
        last_updated_at: holding.last_updated_at,
        asset_type: holding.asset_type,
        subHoldings: []
      };
    }
    
    acc[baseSymbol].amount += Number(holding.amount);
    acc[baseSymbol].value_usd += Number(holding.value_usd);
    acc[baseSymbol].subHoldings.push(holding);
    
    // Use the most recent update time
    if (new Date(holding.last_updated_at) > new Date(acc[baseSymbol].last_updated_at)) {
      acc[baseSymbol].last_updated_at = holding.last_updated_at;
    }
    
    return acc;
  }, {} as Record<string, any>);

  const aggregatedList = Object.values(aggregatedHoldings);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{type} Holdings (Aggregated)</CardTitle>
        <p className="text-sm text-muted-foreground">Duplicate tokens are summed together</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : aggregatedList.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No {type} Holdings</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first {type.toLowerCase()} holding to start tracking
            </p>
            <AddHoldingDialog onAdded={onAdded} />
          </div>
        ) : (
          <div className="space-y-2">
            {aggregatedList.map((aggregated) => (
              <div key={aggregated.id} className="space-y-2">
                {/* Aggregated Summary Row */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border-l-4 border-primary">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-lg">{aggregated.asset_symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {aggregated.asset_name}
                          <Badge variant="outline" className="ml-2">{aggregated.asset_type}</Badge>
                          <Badge variant="secondary" className="ml-2">{aggregated.subHoldings.length} source(s)</Badge>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right mr-4">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-semibold">
                      {aggregated.amount.toFixed(8)} {aggregated.asset_symbol}
                    </p>
                  </div>

                  <div className="text-right mr-4">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-semibold">
                      ${aggregated.price_usd.toLocaleString(undefined, { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="font-bold text-lg text-primary">
                      ${aggregated.value_usd.toLocaleString(undefined, { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
                    </p>
                  </div>
                </div>
                
                {/* Individual Holdings (Sub-items) */}
                <div className="ml-8 space-y-2">
                  {aggregated.subHoldings.map((holding: Holding) => (
                    <HoldingRow 
                      key={holding.id} 
                      holding={holding} 
                      onDelete={onDelete}
                      onUpdate={onUpdate}
                      connectionLabel={getConnectionLabel(holding.connection_id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper component for asset type tabs
function AssetTypeContent({ 
  holdings, 
  type, 
  loading, 
  onDelete, 
  onAdded,
  onUpdate,
  getConnectionLabel
}: { 
  holdings: Holding[]; 
  type: string; 
  loading: boolean; 
  onDelete: (id: string) => void;
  onAdded: () => void;
  onUpdate: () => void;
  getConnectionLabel: (connectionId: string | null | undefined) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{type} Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : holdings.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No {type} Holdings</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first {type.toLowerCase()} holding to start tracking
            </p>
            <AddHoldingDialog onAdded={onAdded} />
          </div>
        ) : (
          <div className="space-y-2">
            {holdings.map((holding) => (
              <HoldingRow 
                key={holding.id} 
                holding={holding} 
                onDelete={onDelete}
                onUpdate={onUpdate}
                connectionLabel={getConnectionLabel(holding.connection_id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
