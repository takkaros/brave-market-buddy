import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter
} from 'lucide-react';

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  order_type: string;
  quantity: number;
  price: number | null;
  stop_price: number | null;
  status: string;
  created_at: string;
  filled_at: string | null;
  filled_quantity: number;
  average_fill_price: number | null;
  exchange: string;
  notes: string | null;
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'filled' | 'cancelled'>('all');

  const fetchOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (error: any) {
      toast.error('Failed to load orders', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (error: any) {
      toast.error('Failed to cancel order', { description: error.message });
    }
  };

  useEffect(() => {
    fetchOrders();

    // Realtime subscription
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user?.id}`,
        },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, filter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filled':
        return <CheckCircle2 className="w-4 h-4 text-risk-low" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'default',
      filled: 'secondary',
      cancelled: 'outline',
      rejected: 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status.toUpperCase()}</Badge>;
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    filled: orders.filter(o => o.status === 'filled').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Navigation />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order Book</h1>
            <p className="text-muted-foreground">Track and manage all your orders</p>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-risk-low" />
                Filled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.filled}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 text-muted-foreground" />
                Cancelled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.cancelled}</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Order History</CardTitle>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="filled">Filled</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
                <p className="text-muted-foreground">
                  {filter !== 'all' ? `No ${filter} orders` : 'Place your first order from the Trading page'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {order.side === 'buy' ? (
                        <TrendingUp className="w-5 h-5 text-risk-low" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-risk-high" />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{order.symbol}</p>
                          <Badge variant={order.side === 'buy' ? 'default' : 'secondary'}>
                            {order.side.toUpperCase()}
                          </Badge>
                          {getStatusBadge(order.status)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            <span className="font-medium">{order.order_type.toUpperCase()}</span>
                            {' • '}
                            Qty: {order.quantity}
                            {order.price && ` @ $${order.price.toFixed(2)}`}
                            {order.stop_price && ` (Stop: $${order.stop_price.toFixed(2)})`}
                          </p>
                          
                          {order.filled_quantity > 0 && (
                            <p className="text-risk-low">
                              Filled: {order.filled_quantity} @ ${order.average_fill_price?.toFixed(2)}
                            </p>
                          )}
                          
                          <p>
                            {order.filled_at ? (
                              <>Filled: {new Date(order.filled_at).toLocaleString()}</>
                            ) : (
                              <>Created: {new Date(order.created_at).toLocaleString()}</>
                            )}
                            {' • '}
                            {order.exchange}
                          </p>
                          
                          {order.notes && (
                            <p className="text-xs italic">{order.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      {order.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelOrder(order.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
