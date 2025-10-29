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
    const { symbol = 'BTC', timeframe = '1M' } = await req.json();
    const CRYPTOCOMPARE_KEY = Deno.env.get('CRYPTOCOMPARE_API_KEY');

    if (!CRYPTOCOMPARE_KEY) {
      throw new Error('CryptoCompare API key not configured');
    }

    // Fetch crypto data from CryptoCompare
    const response = await fetch(
      `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${symbol}&tsym=USD&limit=30&api_key=${CRYPTOCOMPARE_KEY}`
    );

    if (!response.ok) {
      throw new Error(`CryptoCompare API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.Response === 'Error') {
      throw new Error(data.Message);
    }

    console.log('Successfully fetched crypto data for:', symbol);

    return new Response(JSON.stringify({ 
      success: true, 
      data,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching crypto data:', error);
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
