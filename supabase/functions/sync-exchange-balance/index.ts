import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('==================== EXCHANGE SYNC START ====================');
    const { connectionId, exchangeName, apiKey, apiSecret } = await req.json();
    console.log('📥 INPUT:', JSON.stringify({ connectionId, exchangeName }, null, 2));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ AUTH ERROR:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('✅ Authenticated user:', user.id);

    let holdings: any[] = [];
    const exchangeLower = exchangeName.toLowerCase();
    console.log('🔍 Exchange (normalized):', exchangeLower);

    // Fetch balances based on exchange
    if (exchangeLower === 'binance') {
      console.log('🟡 BINANCE SYNC INITIATED');
      
      // 1. FETCH SPOT BALANCES
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = createHmac('sha256', apiSecret)
        .update(queryString)
        .digest('hex');
      
      const apiUrl = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`;
      console.log('🌐 Calling Binance Spot API...');
      
      const binanceResponse = await fetch(apiUrl, {
        headers: {
          'X-MBX-APIKEY': apiKey
        }
      });
      
      console.log('📊 Spot Response status:', binanceResponse.status);
      
      if (binanceResponse.ok) {
        const binanceData = await binanceResponse.json();
        console.log('📦 Fetched', binanceData.balances?.length || 0, 'spot balances');
        
        // Filter out zero balances
        const nonZeroBalances = binanceData.balances.filter((b: any) => 
          parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
        );
        
        console.log('💰 Non-zero spot balances:', nonZeroBalances.length);
        
        // Get prices for each asset
        for (const balance of nonZeroBalances) {
          const amount = parseFloat(balance.free) + parseFloat(balance.locked);
          const symbol = balance.asset;
          
          console.log(`📈 Processing spot ${symbol}: ${amount}`);
          
          // Get price from CryptoCompare
          const { data: priceData } = await supabase.functions.invoke('fetch-crypto-data', {
            body: { symbol }
          });
          
          const price = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;
          
          holdings.push({
            asset_symbol: symbol,
            asset_name: balance.asset,
            amount,
            price_usd: price,
            value_usd: amount * price,
          });
        }
        
        console.log('✅ Created', holdings.length, 'holdings from spot balances');
      } else {
        const errorText = await binanceResponse.text();
        console.error('❌ Binance Spot API ERROR:', errorText);
      }

      // 2. FETCH SAVINGS/EARN BALANCES (Flexible + Locked)
      console.log('💎 Fetching Binance Savings/Earn...');
      const savingsTimestamp = Date.now();
      const savingsQueryString = `timestamp=${savingsTimestamp}`;
      const savingsSignature = createHmac('sha256', apiSecret)
        .update(savingsQueryString)
        .digest('hex');
      
      const savingsUrl = `https://api.binance.com/sapi/v1/lending/union/account?${savingsQueryString}&signature=${savingsSignature}`;
      
      const savingsResponse = await fetch(savingsUrl, {
        headers: {
          'X-MBX-APIKEY': apiKey
        }
      });

      console.log('📊 Savings Response status:', savingsResponse.status);

      if (savingsResponse.ok) {
        const savingsData = await savingsResponse.json();
        console.log('📦 Savings data:', JSON.stringify(savingsData, null, 2));
        
        // Process flexible savings
        if (savingsData.positionAmountVos && savingsData.positionAmountVos.length > 0) {
          console.log('🔄 Processing', savingsData.positionAmountVos.length, 'savings positions');
          
          for (const position of savingsData.positionAmountVos) {
            const amount = parseFloat(position.amount || 0);
            const symbol = position.asset;
            
            if (amount > 0) {
              console.log(`📈 Processing savings ${symbol}: ${amount}`);
              
              // Get price from CryptoCompare
              const { data: priceData } = await supabase.functions.invoke('fetch-crypto-data', {
                body: { symbol }
              });
              
              const price = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;
              
              holdings.push({
                asset_symbol: symbol,
                asset_name: `${position.asset} (Savings)`,
                amount,
                price_usd: price,
                value_usd: amount * price,
              });
            }
          }
        }
        
        console.log('✅ Total holdings after savings:', holdings.length);
      } else {
        const savingsError = await savingsResponse.text();
        console.error('⚠️ Binance Savings API ERROR (non-critical):', savingsError);
        console.log('💡 Continuing with spot balances only...');
      }
    } else if (exchangeLower === 'coinbase') {
      console.log('🔵 COINBASE SYNC - NOT IMPLEMENTED YET');
      console.log('⚠️ Coinbase requires OAuth, not simple API keys');
    } else if (exchangeLower === 'kraken') {
      console.log('🟣 KRAKEN SYNC - NOT IMPLEMENTED YET');
    }

    // Delete existing holdings for this connection
    const { error: deleteError } = await supabase
      .from('portfolio_holdings')
      .delete()
      .eq('connection_id', connectionId);
    
    if (deleteError) {
      console.error('❌ Failed to delete old holdings:', deleteError);
    }

    // Insert new holdings
    if (holdings.length > 0) {
      console.log('💾 Inserting', holdings.length, 'holdings into database...');
      const { error: insertError } = await supabase
        .from('portfolio_holdings')
        .insert(
          holdings.map(h => ({
            user_id: user.id,
            connection_id: connectionId,
            ...h,
          }))
        );

      if (insertError) {
        console.error('❌ Database insert error:', JSON.stringify(insertError, null, 2));
        throw insertError;
      }
      console.log('✅ Holdings inserted successfully');
    } else {
      console.log('⚠️ No holdings to insert - API call may have failed or zero balances');
    }

    // Update last synced time
    const { error: updateError } = await supabase
      .from('portfolio_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', connectionId);

    if (updateError) {
      console.error('❌ Failed to update last_synced_at', updateError);
    }

    console.log('==================== SYNC COMPLETE ====================');
    console.log('📊 FINAL RESULT:', {
      exchange: exchangeName,
      holdingsCount: holdings.length,
      totalValue: holdings.reduce((sum, h) => sum + (h.value_usd || 0), 0),
    });

    return new Response(JSON.stringify({ 
      success: true,
      holdings,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌❌❌ SYNC FAILED ❌❌❌');
    console.error('Error details:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
