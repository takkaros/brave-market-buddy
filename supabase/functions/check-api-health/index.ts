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
    const ALPHA_VANTAGE_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    const CRYPTOCOMPARE_KEY = Deno.env.get('CRYPTOCOMPARE_API_KEY');
    const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');

    const healthStatus = {
      fred: { status: 'unknown' as string, configured: !!FRED_KEY, error: undefined as string | undefined },
      alphaVantage: { status: 'unknown' as string, configured: !!ALPHA_VANTAGE_KEY, error: undefined as string | undefined },
      cryptoCompare: { status: 'unknown' as string, configured: !!CRYPTOCOMPARE_KEY, error: undefined as string | undefined },
      openai: { status: 'unknown' as string, configured: !!OPENAI_KEY, error: undefined as string | undefined },
    };

    // Test FRED API
    if (FRED_KEY) {
      try {
        const fredResponse = await fetch(
          `https://api.stlouisfed.org/fred/series/observations?series_id=GDP&api_key=${FRED_KEY}&file_type=json&limit=1`,
          { signal: AbortSignal.timeout(5000) }
        );
        healthStatus.fred.status = fredResponse.ok ? 'connected' : 'error';
        if (!fredResponse.ok) {
          const errorData = await fredResponse.json();
          healthStatus.fred.error = errorData.error_message || 'API error';
        }
      } catch (error) {
        healthStatus.fred.status = 'error';
        healthStatus.fred.error = error instanceof Error ? error.message : 'Connection failed';
      }
    }

    // Test Alpha Vantage API
    if (ALPHA_VANTAGE_KEY) {
      try {
        const avResponse = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPY&apikey=${ALPHA_VANTAGE_KEY}&outputsize=compact`,
          { signal: AbortSignal.timeout(5000) }
        );
        const avData = await avResponse.json();
        healthStatus.alphaVantage.status = 
          avResponse.ok && !avData['Error Message'] && !avData['Note'] ? 'connected' : 'error';
        if (avData['Error Message']) {
          healthStatus.alphaVantage.error = avData['Error Message'];
        }
        if (avData['Note']) {
          healthStatus.alphaVantage.error = 'Rate limit reached';
        }
      } catch (error) {
        healthStatus.alphaVantage.status = 'error';
        healthStatus.alphaVantage.error = error instanceof Error ? error.message : 'Connection failed';
      }
    }

    // Test CryptoCompare API
    if (CRYPTOCOMPARE_KEY) {
      try {
        const ccResponse = await fetch(
          `https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD&api_key=${CRYPTOCOMPARE_KEY}`,
          { signal: AbortSignal.timeout(5000) }
        );
        const ccData = await ccResponse.json();
        healthStatus.cryptoCompare.status = 
          ccResponse.ok && ccData.Response !== 'Error' ? 'connected' : 'error';
        if (ccData.Message) {
          healthStatus.cryptoCompare.error = ccData.Message;
        }
      } catch (error) {
        healthStatus.cryptoCompare.status = 'error';
        healthStatus.cryptoCompare.error = error instanceof Error ? error.message : 'Connection failed';
      }
    }

    // Test OpenAI API
    if (OPENAI_KEY) {
      try {
        const openaiResponse = await fetch(
          'https://api.openai.com/v1/models',
          {
            headers: { Authorization: `Bearer ${OPENAI_KEY}` },
            signal: AbortSignal.timeout(5000)
          }
        );
        healthStatus.openai.status = openaiResponse.ok ? 'connected' : 'error';
        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json();
          healthStatus.openai.error = errorData.error?.message || 'API error';
        }
      } catch (error) {
        healthStatus.openai.status = 'error';
        healthStatus.openai.error = error instanceof Error ? error.message : 'Connection failed';
      }
    }

    console.log('API Health Check completed:', healthStatus);

    return new Response(JSON.stringify({ 
      success: true, 
      healthStatus,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error checking API health:', error);
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
