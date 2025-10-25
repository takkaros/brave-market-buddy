import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, DollarSign, PieChart, Activity, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolio } from '@/hooks/usePortfolio';

const Portfolio = () => {
  const { holdings, connections, loading, totalValue, fetchPortfolio } = usePortfolio();

  const transactions = [
    { date: 'N/A', type: 'N/A', asset: 'N/A', amount: 'N/A', price: 'N/A', total: 'N/A' },
  ];

  const taxEvents = [
    { date: 'N/A', type: 'N/A', asset: 'N/A', gainLoss: 'N/A', taxable: 'N/A' },
  ];

  return (
    <div className="min-h-screen dashboard-gradient p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Navigation />
        
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 gradient-text">Portfolio Manager</h1>
              <p className="text-muted-foreground">
                Track your holdings, transactions, and tax events
              </p>
              <Badge variant="outline" className="mt-2">
                Privacy-First • Secure • Real-time Updates
              </Badge>
            </div>
            <Button onClick={fetchPortfolio} disabled={loading} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <p className="text-2xl font-bold">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {connections.length} connection{connections.length !== 1 ? 's' : ''}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{holdings.length}</p>
                  <p className="text-xs text-muted-foreground">Different holdings</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Realized P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">N/A</p>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Unrealized P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">N/A</p>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="holdings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="tax">Tax Events</TabsTrigger>
          </TabsList>

          {/* Holdings Tab */}
          <TabsContent value="holdings">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Asset Holdings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : holdings.length > 0 ? (
                  <div className="space-y-3">
                    {holdings.map((holding) => {
                      const allocation = totalValue > 0 ? ((Number(holding.value_usd) / totalValue) * 100).toFixed(1) : '0';
                      
                      return (
                        <div key={holding.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <p className="font-semibold">{holding.asset_name || holding.asset_symbol}</p>
                            <p className="text-xs text-muted-foreground">
                              {Number(holding.amount).toFixed(8)} {holding.asset_symbol}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              ${(Number(holding.value_usd) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @ ${(Number(holding.price_usd) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <Badge variant="outline">{allocation}%</Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm text-center text-muted-foreground">
                      📊 No holdings found. Go to Portfolio Builder to connect wallets and add holdings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transactions.map((tx, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-semibold">{tx.type} • {tx.asset}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{tx.amount}</p>
                        <p className="text-xs text-muted-foreground">@ {tx.price}</p>
                      </div>
                      <p className="font-semibold">{tx.total}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-center text-muted-foreground">
                    📝 Transaction tracking available when connected to data sources
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Events Tab */}
          <TabsContent value="tax">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Tax Events & Accounting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {taxEvents.map((event, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-semibold">{event.type} • {event.asset}</p>
                        <p className="text-xs text-muted-foreground">{event.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{event.gainLoss}</p>
                        <p className="text-xs text-muted-foreground">Taxable: {event.taxable}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-center text-muted-foreground">
                    🧾 Automated tax calculations will be available with connected transaction data
                  </p>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Supports FIFO, LIFO, and other accounting methods
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Privacy Note */}
        <Card className="glass-card mt-6 border-primary/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Privacy-First Design</p>
                <p className="text-sm text-muted-foreground">
                  Your financial data is encrypted and secure. All wallet connections are read-only and you maintain full control over your information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Portfolio;
