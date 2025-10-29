import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  X,
  Target,
  Shield
} from 'lucide-react';

interface Position {
  id: string;
  symbol: string;
  asset_type: string;
  quantity: number;
  average_entry_price: number;
  current_price_usd: number | null;
  current_value_usd: number | null;
  unrealized_pnl_usd: number | null;
  unrealized_pnl_percent: number | null;
  stop_loss_price: number | null;
  take_profit_price: number | null;
  risk_amount_usd: number | null;
  position_size_percent: number | null;
  opened_at: string;
}

export default function Positions() {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchPositions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', user.id)
        .order('opened_at', { ascending: false });

      if (error) throw error;
      setPositions(data || []);
    } catch (error: any) {
      toast.error('Failed to load positions', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const syncPrices = async () => {
    if (positions.length === 0) return;
    
    setSyncing(true);
    try {
      // Update prices from exchange or price API
      const updates = await Promise.all(
        positions.map(async (pos) => {
          try {
            const response = await fetch(
              `https://min-api.cryptocompare.com/data/price?fsym=${pos.symbol}&tsyms=USD`
            );
            const data = await response.json();
            
            if (data.USD) {
              const currentPrice = data.USD;
              const currentValue = pos.quantity * currentPrice;
              const unrealizedPnL = currentValue - (pos.quantity * pos.average_entry_price);
              const unrealizedPnLPercent = (unrealizedPnL / (pos.quantity * pos.average_entry_price)) * 100;
              
              await supabase
                .from('positions')
                .update({
                  current_price_usd: currentPrice,
                  current_value_usd: currentValue,
                  unrealized_pnl_usd: unrealizedPnL,
                  unrealized_pnl_percent: unrealizedPnLPercent,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', pos.id);
            }
          } catch (error) {
            console.error(`Failed to update ${pos.symbol}:`, error);
          }
        })
      );

      toast.success('Positions synced successfully');
      fetchPositions();
    } catch (error: any) {
      toast.error('Failed to sync prices', { description: error.message });
    } finally {
      setSyncing(false);
    }
  };

  const closePosition = async (positionId: string) => {
    try {
      // In production, this would place a market sell order
      // For now, we'll just delete the position
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', positionId);

      if (error) throw error;

      toast.success('Position closed successfully');
      fetchPositions();
    } catch (error: any) {
      toast.error('Failed to close position', { description: error.message });
    }
  };

  useEffect(() => {
    fetchPositions();

    // Realtime subscription
    const channel = supabase
      .channel('positions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'positions',
          filter: `user_id=eq.${user?.id}`,
        },
        () => fetchPositions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const totalValue = positions.reduce((sum, p) => sum + (p.current_value_usd || 0), 0);
  const totalPnL = positions.reduce((sum, p) => sum + (p.unrealized_pnl_usd || 0), 0);
  const totalPnLPercent = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;
  const winningPositions = positions.filter(p => (p.unrealized_pnl_usd || 0) > 0).length;
  const losingPositions = positions.filter(p => (p.unrealized_pnl_usd || 0) < 0).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Navigation />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Open Positions</h1>
            <p className="text-muted-foreground">Monitor and manage your active trades</p>
          </div>
          <Button onClick={syncPrices} variant="outline" size="sm" disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync Prices
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Unrealized P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-risk-low' : 'text-risk-high'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </p>
              <p className={`text-sm ${totalPnL >= 0 ? 'text-risk-low' : 'text-risk-high'}`}>
                {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{positions.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {positions.length > 0 
                  ? `${((winningPositions / positions.length) * 100).toFixed(0)}%`
                  : '0%'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {winningPositions}W / {losingPositions}L
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Positions List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Positions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading positions...</div>
            ) : positions.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Open Positions</h3>
                <p className="text-muted-foreground">Open your first position from the Trading page</p>
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((position) => {
                  const pnl = position.unrealized_pnl_usd || 0;
                  const pnlPercent = position.unrealized_pnl_percent || 0;
                  const isProfitable = pnl >= 0;
                  
                  // Calculate stop loss and take profit progress
                  const currentPrice = position.current_price_usd || position.average_entry_price;
                  const entryPrice = position.average_entry_price;
                  const stopLoss = position.stop_loss_price;
                  const takeProfit = position.take_profit_price;
                  
                  let riskRewardProgress = 0;
                  if (stopLoss && takeProfit) {
                    const totalRange = takeProfit - stopLoss;
                    const currentPosition = currentPrice - stopLoss;
                    riskRewardProgress = (currentPosition / totalRange) * 100;
                  }

                  return (
                    <div
                      key={position.id}
                      className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
                    >
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isProfitable ? (
                            <TrendingUp className="w-5 h-5 text-risk-low" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-risk-high" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{position.symbol}</h3>
                              <Badge variant="outline" className="text-xs">
                                {position.asset_type.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {position.quantity} @ ${position.average_entry_price.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <X className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Close Position?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will close your {position.symbol} position at market price.
                                Current P&L: {isProfitable ? '+' : ''}${pnl.toFixed(2)}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => closePosition(position.id)}>
                                Close Position
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Current Price</p>
                          <p className="font-semibold">${currentPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Value</p>
                          <p className="font-semibold">
                            ${(position.current_value_usd || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Unrealized P&L</p>
                          <p className={`font-semibold ${isProfitable ? 'text-risk-low' : 'text-risk-high'}`}>
                            {isProfitable ? '+' : ''}${pnl.toFixed(2)} ({isProfitable ? '+' : ''}{pnlPercent.toFixed(2)}%)
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-semibold">
                            {Math.floor((Date.now() - new Date(position.opened_at).getTime()) / (1000 * 60 * 60 * 24))}d
                          </p>
                        </div>
                      </div>

                      {/* Risk Management */}
                      {(stopLoss || takeProfit) && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Risk Management</span>
                          </div>
                          
                          {stopLoss && takeProfit && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Stop Loss: ${stopLoss.toFixed(2)}</span>
                                <span>Take Profit: ${takeProfit.toFixed(2)}</span>
                              </div>
                              <Progress value={Math.max(0, Math.min(100, riskRewardProgress))} className="h-2" />
                            </div>
                          )}
                          
                          <div className="flex gap-4 text-xs">
                            {stopLoss && (
                              <div>
                                <span className="text-muted-foreground">SL: </span>
                                <span className="text-risk-high font-medium">${stopLoss.toFixed(2)}</span>
                              </div>
                            )}
                            {takeProfit && (
                              <div>
                                <span className="text-muted-foreground">TP: </span>
                                <span className="text-risk-low font-medium">${takeProfit.toFixed(2)}</span>
                              </div>
                            )}
                            {position.risk_amount_usd && (
                              <div>
                                <span className="text-muted-foreground">Risk: </span>
                                <span className="font-medium">${position.risk_amount_usd.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
