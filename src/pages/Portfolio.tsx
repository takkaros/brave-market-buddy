import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Wallet, DollarSign, PieChart, Activity } from 'lucide-react';

const Portfolio = () => {
  // Mock data - in real implementation, this would come from user's connected wallets/accounts
  const holdings = [
    { asset: 'Bitcoin', amount: 'N/A', value: 'N/A', change24h: 'N/A', allocation: 'N/A' },
    { asset: 'Ethereum', amount: 'N/A', value: 'N/A', change24h: 'N/A', allocation: 'N/A' },
    { asset: 'S&P 500 ETF', amount: 'N/A', value: 'N/A', change24h: 'N/A', allocation: 'N/A' },
    { asset: 'Gold', amount: 'N/A', value: 'N/A', change24h: 'N/A', allocation: 'N/A' },
  ];

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
          <h1 className="text-4xl font-bold mb-2 gradient-text">Portfolio Manager</h1>
          <p className="text-muted-foreground">
            Track your holdings, transactions, and tax events (inspired by Rotki)
          </p>
          <Badge variant="outline" className="mt-2">
            Privacy-First • Self-Hosted Ready • Open-Source Philosophy
          </Badge>
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
              <p className="text-2xl font-bold">N/A</p>
              <p className="text-xs text-muted-foreground">Connect accounts to track</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-risk-low" />
                24h Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">N/A</p>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
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
              <p className="text-xs text-muted-foreground">All-time</p>
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
              <p className="text-xs text-muted-foreground">Current positions</p>
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
                <div className="space-y-3">
                  {holdings.map((holding, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-semibold">{holding.asset}</p>
                        <p className="text-xs text-muted-foreground">Amount: {holding.amount}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{holding.value}</p>
                        <p className="text-xs text-muted-foreground">{holding.change24h}</p>
                      </div>
                      <Badge variant="outline">{holding.allocation}</Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-center text-muted-foreground">
                    📊 Connect your wallets and exchanges to track real holdings
                  </p>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    This feature requires integration with blockchain explorers, exchange APIs, or manual input
                  </p>
                </div>
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
                  Inspired by Rotki's open-source philosophy, this portfolio manager is designed to protect your privacy. 
                  All data stays local, and you maintain full control over your financial information. 
                  Connect only what you choose to share.
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
