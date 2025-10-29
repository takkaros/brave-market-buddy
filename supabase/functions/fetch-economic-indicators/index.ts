import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!FRED_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Define indicators to fetch
    const indicators = [
      // Global indicators
      { code: 'GDP', name: 'US GDP', region: 'global' },
      { code: 'UNRATE', name: 'US Unemployment Rate', region: 'global' },
      { code: 'CPIAUCSL', name: 'US Consumer Price Index', region: 'global' },
      { code: 'FEDFUNDS', name: 'Federal Funds Rate', region: 'global' },
      { code: 'DGS10', name: '10-Year Treasury Yield', region: 'global' },
      
      // EU indicators (using FRED's EU series)
      { code: 'LMUNRRTTEUM156S', name: 'EU Unemployment Rate', region: 'eu' },
      { code: 'EA19CPALTT01GYM', name: 'EU Inflation Rate', region: 'eu' },
      { code: 'ECBDFR', name: 'ECB Deposit Facility Rate', region: 'eu' },
      { code: 'EA19GDPDEFAISMEI', name: 'EU GDP Growth', region: 'eu' },
      
      // Cyprus - using available FRED data
      { code: 'CYPRGDPDEFQISMEI', name: 'Cyprus GDP Growth Rate', region: 'cyprus' },
      { code: 'LRUNTTTTCYA156S', name: 'Cyprus Unemployment Rate', region: 'cyprus' },
      { code: 'FPCPITOTLZGCYP', name: 'Cyprus Inflation Rate', region: 'cyprus' },
      { code: 'CYPLRPTTTHTY', name: 'Cyprus Interest Rate', region: 'cyprus' },
    ];

    console.log('Fetching economic indicators...');

    // Fetch all indicators
    const results = [];
    for (const indicator of indicators) {
      try {
        const response = await fetch(
          `https://api.stlouisfed.org/fred/series/observations?series_id=${indicator.code}&api_key=${FRED_KEY}&file_type=json&limit=1&sort_order=desc`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.observations && data.observations.length > 0) {
            const latest = data.observations[0];
            
            // Insert or update in database
            const { error: upsertError } = await supabase
              .from('economic_indicators')
              .upsert({
                indicator_code: indicator.code,
                indicator_name: indicator.name,
                value: parseFloat(latest.value),
                date: latest.date,
                region: indicator.region,
                source: 'FRED',
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'indicator_code'
              });

            if (upsertError) {
              console.error(`Error upserting ${indicator.code}:`, upsertError);
            } else {
              results.push({
                code: indicator.code,
                name: indicator.name,
                value: parseFloat(latest.value),
                date: latest.date,
                region: indicator.region,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Failed to fetch ${indicator.code}:`, error);
      }
    }

    console.log(`Successfully fetched and cached ${results.length} indicators`);

    return new Response(JSON.stringify({ 
      success: true, 
      indicators: results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching economic indicators:', error);
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
