import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CryptoPrice {
  symbol: string;
  price: number;
  volume_24h?: number;
  market_cap?: number;
  change_24h?: number;
  timestamp: string;
}

interface StockPrice {
  symbol: string;
  price: number;
  volume?: number;
  change_percent?: number;
  timestamp: string;
}

interface MetalPrice {
  metal: string;
  price: number;
  change_24h?: number;
  timestamp: string;
}

interface BondData {
  bond_type: string;
  yield: number;
  price?: number;
  timestamp: string;
}

interface BTCMacroData {
  price: number;
  dominance: number;
  market_cap: number;
  volume_24h: number;
  fear_greed_index: number;
  timestamp: string;
}

export function useCryptoPriceFromDB(symbol: string) {
  const [data, setData] = useState<CryptoPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: priceData, error } = await supabase
          .from('crypto_prices')
          .select('*')
          .eq('symbol', symbol)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setData(priceData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching crypto price:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`crypto_prices_${symbol}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crypto_prices',
          filter: `symbol=eq.${symbol}`,
        },
        (payload) => {
          setData(payload.new as CryptoPrice);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [symbol]);

  return { data, loading, error };
}

export function useStockPriceFromDB(symbol: string) {
  const [data, setData] = useState<StockPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: priceData, error } = await supabase
          .from('stock_prices')
          .select('*')
          .eq('symbol', symbol)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setData(priceData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching stock price:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`stock_prices_${symbol}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_prices',
          filter: `symbol=eq.${symbol}`,
        },
        (payload) => {
          setData(payload.new as StockPrice);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [symbol]);

  return { data, loading, error };
}

export function useMetalPriceFromDB(metal: string) {
  const [data, setData] = useState<MetalPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: priceData, error } = await supabase
          .from('metal_prices')
          .select('*')
          .eq('metal', metal)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setData(priceData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching metal price:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`metal_prices_${metal}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'metal_prices',
          filter: `metal=eq.${metal}`,
        },
        (payload) => {
          setData(payload.new as MetalPrice);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [metal]);

  return { data, loading, error };
}

export function useBondDataFromDB(bondType: string) {
  const [data, setData] = useState<BondData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: bondData, error } = await supabase
          .from('bond_data')
          .select('*')
          .eq('bond_type', bondType)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setData(bondData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching bond data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`bond_data_${bondType}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bond_data',
          filter: `bond_type=eq.${bondType}`,
        },
        (payload) => {
          setData(payload.new as BondData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bondType]);

  return { data, loading, error };
}

export function useBTCMacroDataFromDB() {
  const [data, setData] = useState<BTCMacroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: macroData, error } = await supabase
          .from('btc_macro_data')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setData(macroData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching BTC macro data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription
    const channel = supabase
      .channel('btc_macro_data')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'btc_macro_data',
        },
        (payload) => {
          setData(payload.new as BTCMacroData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { data, loading, error };
}
