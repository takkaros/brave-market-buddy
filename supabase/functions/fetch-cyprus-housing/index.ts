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
    const FRED_KEY = Deno.env.get('FRED_API_KEY');

    if (!FRED_KEY) {
      throw new Error('FRED API key not configured');
    }

    // Fetch Cyprus House Price Index from FRED
    // QCYH628BIS = Cyprus House Price Index (BIS)
    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=QCYH628BIS&api_key=${FRED_KEY}&file_type=json&limit=20&sort_order=desc`
    );

    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error_message) {
      throw new Error(data.error_message);
    }

    // Get additional Cyprus economic data for context
    const gdpResponse = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=CPRGDPQDSNAQ&api_key=${FRED_KEY}&file_type=json&limit=8&sort_order=desc`
    );

    let gdpData = null;
    if (gdpResponse.ok) {
      gdpData = await gdpResponse.json();
    }

    console.log('Successfully fetched Cyprus housing data');

    return new Response(JSON.stringify({ 
      success: true, 
      housingData: data,
      gdpData: gdpData,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching Cyprus housing data:', error);
    
    // Fallback to mock Cyprus data
    const mockData = {
      observations: Array.from({ length: 20 }, (_, i) => ({
        date: new Date(Date.now() - (20 - i) * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: (185 + (Math.random() - 0.3) * 15 - i * 0.5).toFixed(2), // Cyprus HPI around 185 index
      }))
    };

    return new Response(JSON.stringify({ 
      success: true,
      housingData: mockData,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
