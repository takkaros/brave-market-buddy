import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metal = 'GOLD', timeframe = '1M' } = await req.json();
    const CRYPTOCOMPARE_KEY = Deno.env.get('CRYPTOCOMPARE_API_KEY');

    if (!CRYPTOCOMPARE_KEY) {
      throw new Error('CryptoCompare API key not configured');
    }

    // Map metal symbols to CryptoCompare format
    const metalSymbol = metal === 'GOLD' ? 'XAU' : 'XAG'; // Gold or Silver
    
    // Determine limit based on timeframe
    const limitMap: Record<string, number> = {
      '1D': 24,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
    };
    const limit = limitMap[timeframe] || 30;

    // Fetch metals data from CryptoCompare (hourly or daily based on timeframe)
    const endpoint = timeframe === '1D' ? 'histohour' : 'histoday';
    const response = await fetch(
      `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${metalSymbol}&tsym=USD&limit=${limit}&api_key=${CRYPTOCOMPARE_KEY}`
    );

    if (!response.ok) {
      throw new Error(`CryptoCompare API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.Response === 'Error') {
      throw new Error(data.Message);
    }

    console.log('Successfully fetched metals data for:', metal);

    return new Response(JSON.stringify({ 
      success: true, 
      data,
      metal,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching metals data:', error);
    
    // Fallback to mock data if API fails
    const mockData = {
      Response: 'Success',
      Data: {
        Data: Array.from({ length: 30 }, (_, i) => ({
          time: Date.now() / 1000 - (30 - i) * 86400,
          close: 2050 + (Math.random() - 0.5) * 100,
          high: 2080 + (Math.random() - 0.5) * 100,
          low: 2020 + (Math.random() - 0.5) * 100,
        }))
      }
    };

    return new Response(JSON.stringify({ 
      success: true,
      data: mockData,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
