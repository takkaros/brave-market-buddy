import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
  historicalPrices?: Array<{ time: number; price: number }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch BTC price from Binance (free, no API key needed)
    const binanceResponse = await fetch(
      'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'
    );
    
    if (!binanceResponse.ok) {
      throw new Error('Failed to fetch Binance data');
    }
    
    const binanceData = await binanceResponse.json();
    const price = parseFloat(binanceData.lastPrice);
    const volume24h = parseFloat(binanceData.quoteVolume);
    
    // Fetch BTC dominance from CoinCap (free, no API key needed)
    let dominance = 57; // Default
    let marketCap = price * 19800000; // Approximate circulating supply
    try {
      const coinCapResponse = await fetch('https://api.coincap.io/v2/assets/bitcoin');
      if (coinCapResponse.ok) {
        const coinCapData = await coinCapResponse.json();
        marketCap = parseFloat(coinCapData.data.marketCapUsd);
        
        // Get total market cap for dominance calculation
        const globalResponse = await fetch('https://api.coincap.io/v2/assets?limit=100');
        if (globalResponse.ok) {
          const globalData = await globalResponse.json();
          const totalMarketCap = globalData.data.reduce((sum: number, asset: any) => 
            sum + parseFloat(asset.marketCapUsd), 0
          );
          dominance = (marketCap / totalMarketCap) * 100;
        }
      }
    } catch (error) {
      console.log('CoinCap API failed, using defaults:', error);
    }
    
    // Fetch Fear & Greed Index (free)
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
    
    // Fetch historical data (5 years of monthly data) from Binance
    let historicalPrices: Array<{ time: number; price: number }> = [];
    try {
      // Get monthly klines for last 5 years (60 months)
      const endTime = Date.now();
      const startTime = endTime - (5 * 365 * 24 * 60 * 60 * 1000);
      
      const klinesResponse = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1M&startTime=${startTime}&endTime=${endTime}&limit=60`
      );
      
      if (klinesResponse.ok) {
        const klines = await klinesResponse.json();
        historicalPrices = klines.map((k: any) => ({
          time: k[0], // Open time
          price: parseFloat(k[4]) // Close price
        }));
      }
    } catch (error) {
      console.log('Failed to fetch historical data:', error);
    }
    
    const macroData: BTCMacroData = {
      price,
      dominance,
      marketCap,
      volume24h,
      fearGreedIndex,
      timestamp: new Date().toISOString(),
      historicalPrices,
    };

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
