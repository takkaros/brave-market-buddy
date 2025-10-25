import Navigation from '@/components/Navigation';
import AddConnectionDialog from '@/components/AddConnectionDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Wallet as WalletIcon, Trash2 } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';

const PortfolioBuilder = () => {
  const { connections, holdings, loading, syncing, fetchPortfolio, syncConnection, deleteConnection } = usePortfolio();

  return (
    <div className="min-h-screen dashboard-gradient p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Navigation />
        
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 gradient-text">Portfolio Builder</h1>
              <p className="text-muted-foreground">
                Connect wallets, exchanges, and manage your crypto portfolio
              </p>
            </div>
            <AddConnectionDialog onConnectionAdded={fetchPortfolio} />
          </div>
        </div>

        {/* Connected Accounts Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="w-5 h-5" />
              Connected Accounts ({connections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Loading connections...</p>
              </div>
            ) : connections.length > 0 ? (
              <div className="space-y-3">
                {connections.map((conn) => {
                  const connHoldings = holdings.filter(h => h.connection_id === conn.id);
                  const totalValue = connHoldings.reduce((sum, h) => sum + (Number(h.value_usd) || 0), 0);

                  return (
                    <div key={conn.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold">{conn.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {conn.connection_type === 'wallet' 
                            ? `${conn.blockchain} • ${conn.wallet_address?.slice(0, 8)}...${conn.wallet_address?.slice(-6)}`
                            : conn.connection_type === 'exchange'
                            ? `${conn.exchange_name} Exchange`
                            : 'Manual Entry'
                          }
                        </p>
                        {connHoldings.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">
                              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {connHoldings.map(h => `${h.amount} ${h.asset_symbol}`).join(', ')}
                            </p>
                          </div>
                        )}
                        {conn.last_synced_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last synced: {new Date(conn.last_synced_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {conn.connection_type === 'wallet' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncConnection(conn)}
                            disabled={syncing}
                          >
                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteConnection(conn.id)}
                          disabled={syncing}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <WalletIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Connections Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your wallets, exchanges, or manually add holdings to start tracking your portfolio
                </p>
                <AddConnectionDialog onConnectionAdded={fetchPortfolio} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">🔐 Secure Connections</h4>
              <p className="text-sm text-muted-foreground">
                All wallet connections are read-only. We never ask for private keys or seed phrases.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">📊 Real-time Updates</h4>
              <p className="text-sm text-muted-foreground">
                Automatic price updates and balance syncing keep your portfolio data current.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">📁 Multiple Formats</h4>
              <p className="text-sm text-muted-foreground">
                Import CSV files from exchanges or connect wallets directly - we support both.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="glass-card mt-6 border-primary/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline">Tip</Badge>
              <div>
                <p className="font-semibold mb-1">Getting Started</p>
                <p className="text-sm text-muted-foreground">
                  Click "Add Connection" to start. You can add crypto wallets (Bitcoin, Ethereum), import CSV files from exchanges, or manually enter holdings.
                  For Bitcoin, both regular addresses and xpub extended public keys are supported.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortfolioBuilder;
