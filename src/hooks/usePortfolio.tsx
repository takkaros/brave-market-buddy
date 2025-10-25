import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Holding {
  id: string;
  user_id: string;
  connection_id: string | null;
  asset_symbol: string;
  asset_name: string | null;
  amount: number;
  price_usd: number | null;
  value_usd: number | null;
  last_updated_at: string;
}

export interface Connection {
  id: string;
  user_id: string;
  connection_type: string;
  name: string;
  blockchain: string | null;
  wallet_address: string | null;
  exchange_name: string | null;
  last_synced_at: string | null;
  is_active: boolean;
}

export const usePortfolio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching portfolio for user:', user.id);

      const [holdingsRes, connectionsRes] = await Promise.all([
        supabase.from('portfolio_holdings').select('*').eq('user_id', user.id).order('value_usd', { ascending: false }),
        supabase.from('portfolio_connections').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (holdingsRes.error) throw holdingsRes.error;
      if (connectionsRes.error) throw connectionsRes.error;

      console.log('Portfolio fetched:', {
        holdings: holdingsRes.data?.length || 0,
        connections: connectionsRes.data?.length || 0,
      });

      setHoldings(holdingsRes.data || []);
      setConnections(connectionsRes.data || []);
    } catch (error: any) {
      console.error('Error fetching portfolio:', error);
      toast({
        title: 'Failed to Load Portfolio',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const syncConnection = useCallback(async (connection: Connection) => {
    if (connection.connection_type !== 'wallet') return;

    setSyncing(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Not authenticated');

      console.log('Syncing wallet:', connection.id, connection.blockchain, connection.wallet_address);

      const { data, error } = await supabase.functions.invoke('sync-wallet-balance', {
        body: {
          connectionId: connection.id,
          blockchain: connection.blockchain,
          walletAddress: connection.wallet_address,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      console.log('Sync response:', data);

      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'Sync failed');

      toast({
        title: 'Wallet Synced',
        description: `Updated ${connection.name} - Balance: ${data.balance || 0}`,
      });

      await fetchPortfolio();
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  }, [toast, fetchPortfolio]);

  const deleteConnection = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('portfolio_connections').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: 'Connection Deleted',
        description: 'Connection removed successfully',
      });

      await fetchPortfolio();
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast, fetchPortfolio]);

  useEffect(() => {
    fetchPortfolio();

    // Setup realtime subscriptions
    const channel = supabase
      .channel('portfolio-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_holdings' }, () => {
        console.log('Holdings changed, refetching...');
        fetchPortfolio();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio_connections' }, () => {
        console.log('Connections changed, refetching...');
        fetchPortfolio();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPortfolio]);

  const totalValue = holdings.reduce((sum, h) => sum + (Number(h.value_usd) || 0), 0);

  return {
    holdings,
    connections,
    loading,
    syncing,
    totalValue,
    fetchPortfolio,
    syncConnection,
    deleteConnection,
  };
};
