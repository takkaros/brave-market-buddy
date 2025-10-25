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
    const { timeframe = '1M' } = await req.json();
    const FRED_KEY = Deno.env.get('FRED_API_KEY');

    if (!FRED_KEY) {
      throw new Error('FRED API key not configured');
    }

    // Determine limit based on timeframe
    const limitMap: Record<string, number> = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
    };
    const limit = limitMap[timeframe] || 30;

    // Fetch 10-Year Treasury (DGS10) and 2-Year Treasury (DGS2)
    const [yield10Response, yield2Response] = await Promise.all([
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${FRED_KEY}&file_type=json&limit=${limit}&sort_order=desc`),
      fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=DGS2&api_key=${FRED_KEY}&file_type=json&limit=${limit}&sort_order=desc`)
    ]);

    if (!yield10Response.ok || !yield2Response.ok) {
      throw new Error('FRED API error');
    }

    const [yield10Data, yield2Data] = await Promise.all([
      yield10Response.json(),
      yield2Response.json()
    ]);

    if (yield10Data.error_message || yield2Data.error_message) {
      throw new Error(yield10Data.error_message || yield2Data.error_message);
    }

    console.log('Successfully fetched bond data');

    return new Response(JSON.stringify({ 
      success: true, 
      yield10: yield10Data,
      yield2: yield2Data,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching bond data:', error);
    
    // Fallback to mock data
    const mockData = {
      observations: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: (4.5 + (Math.random() - 0.5) * 0.3).toFixed(2),
      }))
    };

    return new Response(JSON.stringify({ 
      success: true,
      yield10: mockData,
      yield2: { ...mockData, observations: mockData.observations.map(o => ({ ...o, value: (parseFloat(o.value) + 0.3).toFixed(2) })) },
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
