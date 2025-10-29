import { useState, useEffect } from 'react';
import { useCryptoPriceFromDB, useStockPriceFromDB, useMetalPriceFromDB } from './useMarketDataFromDB';

export function useRealTimePrice(symbol: string, assetType: string = 'crypto') {
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use database hooks based on asset type
  const cryptoData = useCryptoPriceFromDB(symbol);
  const stockData = useStockPriceFromDB(symbol);
  const metalData = useMetalPriceFromDB(symbol);

  useEffect(() => {
    if (assetType === 'crypto') {
      setPrice(cryptoData.data?.price || 0);
      setLoading(cryptoData.loading);
      setError(cryptoData.error);
    } else if (assetType === 'stock') {
      setPrice(stockData.data?.price || 0);
      setLoading(stockData.loading);
      setError(stockData.error);
    } else if (assetType === 'metal') {
      setPrice(metalData.data?.price || 0);
      setLoading(metalData.loading);
      setError(metalData.error);
    }
  }, [assetType, cryptoData, stockData, metalData]);

  return { price, loading, error };
}
