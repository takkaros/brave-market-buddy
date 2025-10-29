import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: Date;
}

export function useRealTimePrice(symbol: string, assetType: string = 'crypto') {
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchPrice = async () => {
      try {
        setLoading(true);
        
        // Fetch price based on asset type
        if (assetType === 'crypto') {
          const { data, error } = await supabase.functions.invoke('fetch-crypto-data', {
            body: { symbol }
          });
          
          if (error) throw error;
          
          const priceData = data?.data?.Data?.Data;
          if (priceData && priceData.length > 0) {
            const latestPrice = priceData[priceData.length - 1]?.close || 0;
            setPrice(latestPrice);
            setError(null);
          }
        } else if (assetType === 'metal') {
          const metalMap: Record<string, string> = {
            'GOLD': 'GOLD',
            'GLD': 'GOLD',
            'XAU': 'GOLD',
            'SILVER': 'SILVER',
            'SLV': 'SILVER',
            'XAG': 'SILVER',
          };
          
          const metalName = metalMap[symbol.toUpperCase()] || 'GOLD';
          
          const { data, error } = await supabase.functions.invoke('fetch-metals-data', {
            body: { metal: metalName }
          });
          
          if (error) throw error;
          
          const priceData = data?.data?.Data?.Data;
          if (priceData && priceData.length > 0) {
            const latestPrice = priceData[priceData.length - 1]?.close || 0;
            setPrice(latestPrice);
            setError(null);
          }
        } else if (assetType === 'stock') {
          const { data, error } = await supabase.functions.invoke('fetch-stocks-data', {
            body: { symbol }
          });
          
          if (error) throw error;
          
          if (data?.price) {
            setPrice(data.price);
            setError(null);
          }
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Price fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchPrice();
    
    // Update every 30 seconds for real-time feel
    intervalId = setInterval(fetchPrice, 30000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [symbol, assetType]);

  return { price, loading, error };
}
