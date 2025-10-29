import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BTCMacroData {
  price: number;
  dominance: number;
  marketCap: number;
  volume24h: number;
  fearGreedIndex: number;
  timestamp: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Fetch BTC price and market data
    const coinGeckoResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false'
    );
    
    if (!coinGeckoResponse.ok) {
      throw new Error('Failed to fetch CoinGecko data');
    }
    
    const btcData = await coinGeckoResponse.json();
    
    // Fetch global crypto market data for dominance
    const globalResponse = await fetch(
      'https://api.coingecko.com/api/v3/global'
    );
    
    if (!globalResponse.ok) {
      throw new Error('Failed to fetch global market data');
    }
    
    const globalData = await globalResponse.json();
    
    // Fetch Fear & Greed Index
    let fearGreedIndex = 50; // Default neutral
    try {
      const fearGreedResponse = await fetch(
        'https://api.alternative.me/fng/?limit=1'
      );
      if (fearGreedResponse.ok) {
        const fearGreedData = await fearGreedResponse.json();
        fearGreedIndex = parseInt(fearGreedData.data[0].value);
      }
    } catch (error) {
      console.log('Fear & Greed API failed, using default:', error);
    }
    
    const macroData: BTCMacroData = {
      price: btcData.market_data.current_price.usd,
      dominance: globalData.data.market_cap_percentage.btc,
      marketCap: btcData.market_data.market_cap.usd,
      volume24h: btcData.market_data.total_volume.usd,
      fearGreedIndex: fearGreedIndex,
      timestamp: new Date().toISOString(),
    };

    // Store in database
    const { error: dbError } = await supabase
      .from('btc_macro_data')
      .insert({
        price: macroData.price,
        dominance: macroData.dominance,
        market_cap: macroData.marketCap,
        volume_24h: macroData.volume24h,
        fear_greed_index: macroData.fearGreedIndex,
        timestamp: macroData.timestamp,
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
    }

    return new Response(JSON.stringify(macroData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching BTC macro data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
