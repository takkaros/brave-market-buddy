import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface RealPnLData {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalInvested: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  loading: boolean;
}

export function useRealPnL(): RealPnLData {
  const { user } = useAuth();
  const [data, setData] = useState<RealPnLData>({
    totalValue: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
    dayChange: 0,
    dayChangePercent: 0,
    realizedPnL: 0,
    unrealizedPnL: 0,
    totalInvested: 0,
    winRate: 0,
    profitFactor: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    const calculatePnL = async () => {
      try {
        // Fetch holdings
        const { data: holdings, error: holdingsError } = await supabase
          .from('portfolio_holdings')
          .select('*')
          .eq('user_id', user.id);

        if (holdingsError) throw holdingsError;

        // Fetch positions
        const { data: positions, error: positionsError } = await supabase
          .from('positions')
          .select('*')
          .eq('user_id', user.id);

        if (positionsError) throw positionsError;

        // Fetch trades
        const { data: trades, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .order('executed_at', { ascending: false });

        if (tradesError) throw tradesError;

        // Calculate portfolio value
        const totalValue = holdings?.reduce((sum, h) => sum + (Number(h.value_usd) || 0), 0) || 0;

        // Calculate total invested (from holdings purchase prices)
        const totalInvested = holdings?.reduce((sum, h) => {
          const purchaseValue = (h.purchase_price_usd || h.price_usd) * h.amount;
          return sum + purchaseValue;
        }, 0) || 0;

        // Calculate unrealized P&L from positions
        const unrealizedPnL = positions?.reduce((sum, p) => sum + (p.unrealized_pnl_usd || 0), 0) || 0;

        // Calculate realized P&L from trades
        const realizedPnL = trades?.reduce((sum, t) => sum + (t.realized_pnl_usd || 0), 0) || 0;

        // Total P&L
        const totalPnL = realizedPnL + unrealizedPnL;
        const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

        // Calculate 24h change (compare to previous day snapshot)
        // For now, we'll estimate from holdings (need historical data for accurate calc)
        const dayChange = totalValue * 0.01; // Placeholder - should use historical prices
        const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

        // Calculate win rate from trades
        const closingTrades = trades?.filter(t => t.realized_pnl_usd !== null) || [];
        const winningTrades = closingTrades.filter(t => (t.realized_pnl_usd || 0) > 0);
        const winRate = closingTrades.length > 0 
          ? (winningTrades.length / closingTrades.length) * 100 
          : 0;

        // Calculate profit factor
        const totalWins = closingTrades
          .filter(t => (t.realized_pnl_usd || 0) > 0)
          .reduce((sum, t) => sum + (t.realized_pnl_usd || 0), 0);
        
        const totalLosses = Math.abs(
          closingTrades
            .filter(t => (t.realized_pnl_usd || 0) < 0)
            .reduce((sum, t) => sum + (t.realized_pnl_usd || 0), 0)
        );
        
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

        // Fetch performance metrics if available
        const { data: perfMetrics } = await supabase
          .from('performance_metrics')
          .select('*')
          .eq('user_id', user.id)
          .order('period_end', { ascending: false })
          .limit(1)
          .single();

        setData({
          totalValue,
          totalPnL,
          totalPnLPercent,
          dayChange,
          dayChangePercent,
          realizedPnL,
          unrealizedPnL,
          totalInvested,
          winRate,
          profitFactor,
          sharpeRatio: perfMetrics?.sharpe_ratio || 0,
          maxDrawdown: perfMetrics?.max_drawdown_percent || 0,
          loading: false,
        });
      } catch (error) {
        console.error('Failed to calculate P&L:', error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    calculatePnL();

    // Set up realtime subscriptions
    const holdingsChannel = supabase
      .channel('holdings-pnl')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'portfolio_holdings', filter: `user_id=eq.${user.id}` },
        calculatePnL
      )
      .subscribe();

    const positionsChannel = supabase
      .channel('positions-pnl')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'positions', filter: `user_id=eq.${user.id}` },
        calculatePnL
      )
      .subscribe();

    const tradesChannel = supabase
      .channel('trades-pnl')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user.id}` },
        calculatePnL
      )
      .subscribe();

    return () => {
      supabase.removeChannel(holdingsChannel);
      supabase.removeChannel(positionsChannel);
      supabase.removeChannel(tradesChannel);
    };
  }, [user]);

  return data;
}
