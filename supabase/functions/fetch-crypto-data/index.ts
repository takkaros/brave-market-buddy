import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateFallbackData = (symbol: string) => {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  const basePrice = symbol === 'BTC' ? 110000 : 4000;
  
  return {
    Response: 'Success',
    Data: {
      Data: Array.from({ length: 31 }, (_, i) => {
        const time = Math.floor((now - (30 - i) * dayInMs) / 1000);
        const volatility = 0.05;
        const trend = Math.sin(i / 5) * 0.03;
        const random = (Math.random() - 0.5) * volatility;
        const price = basePrice * (1 + trend + random);
        
        return {
          time,
          high: price * 1.02,
          low: price * 0.98,
          open: price * 0.99,
          close: price,
          volumefrom: Math.random() * 50000 + 10000,
          volumeto: price * (Math.random() * 50000 + 10000),
          conversionType: 'direct',
          conversionSymbol: ''
        };
      })
    }
  };
};

const fetchWithRetry = async (url: string, retries = 3, backoff = 1000): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      
      if (response.status >= 500 && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, i)));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries reached');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'BTC', timeframe = '1M' } = await req.json();
    const CRYPTOCOMPARE_KEY = Deno.env.get('CRYPTOCOMPARE_API_KEY');

    if (!CRYPTOCOMPARE_KEY) {
      throw new Error('CryptoCompare API key not configured');
    }

    let data;
    let fallback = false;
    let apiError;

    try {
      const response = await fetchWithRetry(
        `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${symbol}&tsym=USD&limit=30&api_key=${CRYPTOCOMPARE_KEY}`,
        3,
        1000
      );

      if (!response.ok) {
        throw new Error(`CryptoCompare API error: ${response.status}`);
      }

      data = await response.json();

      if (data.Response === 'Error') {
        throw new Error(data.Message);
      }

      console.log('Successfully fetched crypto data for:', symbol);
    } catch (error) {
      console.warn('CryptoCompare API unavailable, using fallback data:', error);
      apiError = error instanceof Error ? error.message : 'Unknown error';
      data = generateFallbackData(symbol);
      fallback = true;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data,
      fallback,
      error: fallback ? apiError : undefined,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-crypto-data function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
