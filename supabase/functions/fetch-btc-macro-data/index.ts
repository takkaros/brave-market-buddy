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
    const CRYPTOCOMPARE_API_KEY = Deno.env.get('CRYPTOCOMPARE_API_KEY');
    
    if (!CRYPTOCOMPARE_API_KEY) {
      throw new Error('CryptoCompare API key not configured');
    }

    // Fetch current BTC data from CryptoCompare
    const currentDataResponse = await fetch(
      `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC&tsyms=USD&api_key=${CRYPTOCOMPARE_API_KEY}`
    );
    
    if (!currentDataResponse.ok) {
      throw new Error('Failed to fetch current BTC data from CryptoCompare');
    }
    
    const currentData = await currentDataResponse.json();
    const btcData = currentData.RAW?.BTC?.USD;
    
    if (!btcData) {
      throw new Error('Invalid response from CryptoCompare');
    }
    
    const price = btcData.PRICE;
    const volume24h = btcData.TOTALVOLUME24HTO;
    const marketCap = btcData.MKTCAP;
    
    // Calculate BTC dominance
    const topCapResponse = await fetch(
      `https://min-api.cryptocompare.com/data/top/mktcapfull?limit=100&tsym=USD&api_key=${CRYPTOCOMPARE_API_KEY}`
    );
    
    let dominance = 57; // Default
    if (topCapResponse.ok) {
      const topCapData = await topCapResponse.json();
      const totalMarketCap = topCapData.Data.reduce((sum: number, coin: any) => 
        sum + (coin.RAW?.USD?.MKTCAP || 0), 0
      );
      dominance = (marketCap / totalMarketCap) * 100;
    }
    
    // Fetch Fear & Greed Index (free alternative API)
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
    
    // Fetch 5 years of monthly historical data from CryptoCompare
    let historicalPrices: Array<{ time: number; price: number }> = [];
    try {
      // Get last 60 months (5 years)
      const historyResponse = await fetch(
        `https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=1825&api_key=${CRYPTOCOMPARE_API_KEY}`
      );
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        const dailyData = historyData.Data.Data;
        
        // Convert daily to monthly by sampling every 30 days
        historicalPrices = dailyData
          .filter((_: any, index: number) => index % 30 === 0)
          .map((item: any) => ({
            time: item.time * 1000, // Convert to milliseconds
            price: item.close
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
