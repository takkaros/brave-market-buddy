// Elite Trading Panel - Order Entry & Management
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  calculatePositionSize, 
  validateTradeRisk, 
  type RiskLimits,
  type Position,
  DEFAULT_RISK_LIMITS
} from '@/utils/riskManagement';

interface TradingPanelProps {
  symbol: string;
  currentPrice: number;
  assetType: 'crypto' | 'stock' | 'bond' | 'metal' | 'other';
}

export default function TradingPanel({ symbol, currentPrice, assetType }: TradingPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop' | 'stop_limit'>('market');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [timeInForce, setTimeInForce] = useState<'gtc' | 'ioc' | 'fok' | 'day'>('gtc');
  
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(2);
  const [riskLimits, setRiskLimits] = useState<RiskLimits>(DEFAULT_RISK_LIMITS);
  const [positions, setPositions] = useState<Position[]>([]);
  const [todayPnL, setTodayPnL] = useState(0);
  
  const [riskCheck, setRiskCheck] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [user]);

  // Auto-calculate position size when inputs change
  useEffect(() => {
    if (stopLoss && currentPrice && accountSize) {
      calculateOptimalSize();
    }
  }, [stopLoss, currentPrice, accountSize, riskPercent]);

  // Run risk check when quantity changes
  useEffect(() => {
    if (quantity && parseFloat(quantity) > 0) {
      performRiskCheck();
    }
  }, [quantity, stopLoss, side]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load risk limits
      const { data: limitsData } = await supabase
        .from('risk_limits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (limitsData) {
        setRiskLimits(limitsData as RiskLimits);
      }

      // Load positions
      const { data: positionsData } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', user.id);
      
      if (positionsData) {
        setPositions(positionsData as Position[]);
      }

      // Load account size (from portfolio holdings total value)
      const { data: holdingsData } = await supabase
        .from('portfolio_holdings')
        .select('value_usd')
        .eq('user_id', user.id);
      
      if (holdingsData) {
        const totalValue = holdingsData.reduce((sum, h) => sum + (h.value_usd || 0), 0);
        setAccountSize(totalValue > 0 ? totalValue : 10000);
      }

      // Calculate today's P&L
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayTrades } = await supabase
        .from('trades')
        .select('realized_pnl_usd')
        .eq('user_id', user.id)
        .gte('executed_at', today.toISOString());
      
      if (todayTrades) {
        const pnl = todayTrades.reduce((sum, t) => sum + (t.realized_pnl_usd || 0), 0);
        setTodayPnL(pnl);
      }
    } catch (error: any) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOptimalSize = () => {
    try {
      const entryPrice = orderType === 'limit' && limitPrice 
        ? parseFloat(limitPrice) 
        : currentPrice;
      
      const stopLossPrice = stopLoss ? parseFloat(stopLoss) : 0;
      
      if (!stopLossPrice || !entryPrice) return;

      const size = calculatePositionSize({
        accountSize,
        riskPercentPerTrade: riskPercent,
        entryPrice,
        stopLossPrice,
        method: 'fixed_fractional',
      });

      setQuantity(size.toFixed(8));
    } catch (error) {
      console.error('Error calculating position size:', error);
    }
  };

  const performRiskCheck = async () => {
    try {
      const qty = parseFloat(quantity);
      const entryPrice = orderType === 'limit' && limitPrice 
        ? parseFloat(limitPrice) 
        : currentPrice;
      const stopLossPrice = stopLoss ? parseFloat(stopLoss) : undefined;

      const check = validateTradeRisk({
        symbol,
        side,
        quantity: qty,
        entryPrice,
        stopLossPrice,
        accountSize,
        currentPositions: positions,
        riskLimits,
        todayPnL,
      });

      setRiskCheck(check);
    } catch (error) {
      console.error('Risk check error:', error);
    }
  };

  const handleSubmitOrder = async () => {
    if (!user) {
      toast({ title: 'Not Authenticated', variant: 'destructive' });
      return;
    }

    // Final risk check
    if (!riskCheck || !riskCheck.allowed) {
      toast({ 
        title: 'Risk Check Failed', 
        description: riskCheck?.reason || 'Trade does not meet risk requirements',
        variant: 'destructive' 
      });
      return;
    }

    setSubmitting(true);
    try {
      const qty = parseFloat(quantity);
      const price = orderType === 'market' ? null : parseFloat(limitPrice);
      const stop = stopPrice ? parseFloat(stopPrice) : null;
      const stopLossPrice = stopLoss ? parseFloat(stopLoss) : null;
      const takeProfitPrice = takeProfit ? parseFloat(takeProfit) : null;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          symbol,
          asset_type: assetType,
          side,
          order_type: orderType,
          quantity: qty,
          price,
          stop_price: stop,
          stop_loss_price: stopLossPrice,
          take_profit_price: takeProfitPrice,
          time_in_force: timeInForce,
          exchange: 'simulator', // In production, use actual exchange
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // For market orders in simulator, execute immediately
      if (orderType === 'market') {
        await executeSimulatedOrder(orderData.id, qty, currentPrice);
      }

      toast({
        title: '✅ Order Submitted',
        description: `${side.toUpperCase()} ${qty} ${symbol} @ ${orderType === 'market' ? 'market' : '$' + price}`,
      });

      // Reset form
      setQuantity('');
      setLimitPrice('');
      setStopPrice('');
      setRiskCheck(null);

      // Reload data
      loadUserData();
    } catch (error: any) {
      toast({
        title: 'Order Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const executeSimulatedOrder = async (orderId: string, qty: number, price: number) => {
    try {
      // Create trade record
      await supabase.from('trades').insert({
        user_id: user!.id,
        order_id: orderId,
        symbol,
        asset_type: assetType,
        side,
        quantity: qty,
        price,
        total_usd: qty * price,
        commission_usd: qty * price * 0.001, // 0.1% commission
        exchange: 'simulator',
      });

      // Update order status
      await supabase
        .from('orders')
        .update({ 
          status: 'filled',
          filled_quantity: qty,
          average_fill_price: price,
          filled_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // Update or create position
      if (side === 'buy') {
        // Add to position
        const { data: existingPos } = await supabase
          .from('positions')
          .select('*')
          .eq('user_id', user!.id)
          .eq('symbol', symbol)
          .maybeSingle();

        if (existingPos) {
          // Update existing position
          const newQty = existingPos.quantity + qty;
          const newCost = existingPos.total_cost_usd + (qty * price);
          const newAvg = newCost / newQty;

          await supabase
            .from('positions')
            .update({
              quantity: newQty,
              total_cost_usd: newCost,
              average_entry_price: newAvg,
              stop_loss_price: stopLoss ? parseFloat(stopLoss) : null,
              take_profit_price: takeProfit ? parseFloat(takeProfit) : null,
            })
            .eq('id', existingPos.id);
        } else {
          // Create new position
          await supabase.from('positions').insert({
            user_id: user!.id,
            symbol,
            asset_type: assetType,
            quantity: qty,
            average_entry_price: price,
            total_cost_usd: qty * price,
            stop_loss_price: stopLoss ? parseFloat(stopLoss) : null,
            take_profit_price: takeProfit ? parseFloat(takeProfit) : null,
          });
        }
      } else {
        // Sell - reduce or close position
        const { data: existingPos } = await supabase
          .from('positions')
          .select('*')
          .eq('user_id', user!.id)
          .eq('symbol', symbol)
          .single();

        if (existingPos) {
          // Calculate realized P&L
          const realizedPnL = (price - existingPos.average_entry_price) * qty;

          // Update trade with realized P&L
          await supabase
            .from('trades')
            .update({ realized_pnl_usd: realizedPnL })
            .eq('order_id', orderId);

          const newQty = existingPos.quantity - qty;
          if (newQty <= 0) {
            // Close position
            await supabase.from('positions').delete().eq('id', existingPos.id);
          } else {
            // Reduce position
            await supabase
              .from('positions')
              .update({
                quantity: newQty,
                total_cost_usd: newQty * existingPos.average_entry_price,
              })
              .eq('id', existingPos.id);
          }
        }
      }
    } catch (error) {
      console.error('Error executing simulated order:', error);
      throw error;
    }
  };

  const getRiskColor = () => {
    if (!riskCheck) return 'text-muted-foreground';
    if (!riskCheck.allowed) return 'text-destructive';
    if (riskCheck.warnings.length > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Trade {symbol}</CardTitle>
          <Badge variant="outline">${currentPrice.toFixed(2)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Side Selection */}
        <Tabs value={side} onValueChange={(v) => setSide(v as 'buy' | 'sell')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="data-[state=active]:bg-green-500/20">
              <TrendingUp className="w-4 h-4 mr-2" />
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell" className="data-[state=active]:bg-red-500/20">
              <TrendingDown className="w-4 h-4 mr-2" />
              Sell
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Order Type */}
        <div className="space-y-2">
          <Label>Order Type</Label>
          <Select value={orderType} onValueChange={(v: any) => setOrderType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market">Market</SelectItem>
              <SelectItem value="limit">Limit</SelectItem>
              <SelectItem value="stop">Stop</SelectItem>
              <SelectItem value="stop_limit">Stop Limit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            step="0.00000001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {/* Limit Price (for limit orders) */}
        {(orderType === 'limit' || orderType === 'stop_limit') && (
          <div className="space-y-2">
            <Label>Limit Price</Label>
            <Input
              type="number"
              step="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={currentPrice.toFixed(2)}
            />
          </div>
        )}

        {/* Stop Price (for stop orders) */}
        {(orderType === 'stop' || orderType === 'stop_limit') && (
          <div className="space-y-2">
            <Label>Stop Price</Label>
            <Input
              type="number"
              step="0.01"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              placeholder={currentPrice.toFixed(2)}
            />
          </div>
        )}

        {/* Risk Management */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Stop Loss</Label>
            <Input
              type="number"
              step="0.01"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder={side === 'buy' ? 'Below entry' : 'Above entry'}
            />
          </div>
          <div className="space-y-2">
            <Label>Take Profit</Label>
            <Input
              type="number"
              step="0.01"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder={side === 'buy' ? 'Above entry' : 'Below entry'}
            />
          </div>
        </div>

        {/* Position Sizing Helper */}
        <div className="p-3 bg-muted/30 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Account Size:</span>
            <span className="font-semibold">${accountSize.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Risk Per Trade:</span>
            <span className="font-semibold">{riskPercent}%</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={calculateOptimalSize}
          >
            Calculate Optimal Size
          </Button>
        </div>

        {/* Risk Check Display */}
        {riskCheck && (
          <Alert variant={riskCheck.allowed ? 'default' : 'destructive'}>
            <div className="flex items-start gap-2">
              {riskCheck.allowed ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <AlertDescription className={getRiskColor()}>
                  {riskCheck.allowed ? 'Trade approved' : riskCheck.reason}
                </AlertDescription>
                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                  <div>
                    <span className="text-muted-foreground">Risk: </span>
                    <span className="font-semibold">
                      ${riskCheck.calculatedRisk.dollarRisk.toFixed(2)} 
                      ({riskCheck.calculatedRisk.percentRisk.toFixed(2)}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Position: </span>
                    <span className="font-semibold">
                      ${riskCheck.calculatedRisk.positionValue.toFixed(2)}
                    </span>
                  </div>
                </div>
                {riskCheck.warnings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {riskCheck.warnings.map((warning: string, i: number) => (
                      <div key={i} className="flex items-center gap-1 text-xs text-yellow-500">
                        <AlertTriangle className="w-3 h-3" />
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmitOrder}
          disabled={!quantity || !riskCheck?.allowed || submitting}
          variant={side === 'buy' ? 'default' : 'destructive'}
        >
          {submitting ? 'Submitting...' : `${side.toUpperCase()} ${symbol}`}
        </Button>

        {/* Order Summary */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <div className="flex justify-between">
            <span>Estimated Value:</span>
            <span>
              ${quantity && currentPrice ? (parseFloat(quantity) * currentPrice).toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Est. Commission (0.1%):</span>
            <span>
              ${quantity && currentPrice ? (parseFloat(quantity) * currentPrice * 0.001).toFixed(2) : '0.00'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
