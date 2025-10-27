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
    const { connectionId } = await req.json();
    console.log('📥 INPUT:', JSON.stringify({ connectionId }, null, 2));
    
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

    // Fetch connection details from database and verify ownership
    const { data: connection, error: connError } = await supabase
      .from('portfolio_connections')
      .select('api_key, api_secret, api_passphrase, exchange_name, user_id')
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      console.error('❌ CONNECTION ERROR:', connError);
      return new Response(JSON.stringify({ 
        error: 'Connection not found or unauthorized',
        logs: ['❌ Invalid connection ID or access denied']
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const exchangeName = connection.exchange_name;
    const apiKey = connection.api_key;
    const apiSecret = connection.api_secret;
    
    console.log('🔐 Using stored credentials for exchange:', exchangeName);

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

      // 2. FETCH SIMPLE EARN FLEXIBLE POSITIONS
      console.log('💎 Fetching Binance Simple Earn Flexible...');
      const flexTimestamp = Date.now();
      const flexQueryString = `timestamp=${flexTimestamp}`;
      const flexSignature = createHmac('sha256', apiSecret)
        .update(flexQueryString)
        .digest('hex');
      
      const flexUrl = `https://api.binance.com/sapi/v1/simple-earn/flexible/position?${flexQueryString}&signature=${flexSignature}`;
      console.log('🌐 Calling Simple Earn Flexible API...');
      
      const flexResponse = await fetch(flexUrl, {
        headers: {
          'X-MBX-APIKEY': apiKey
        }
      });

      console.log('📊 Flexible Response status:', flexResponse.status);

      if (flexResponse.ok) {
        const flexData = await flexResponse.json();
        console.log('📦 Full Flexible data:', JSON.stringify(flexData, null, 2));
        
        if (flexData.rows && Array.isArray(flexData.rows)) {
          console.log('✅ Found', flexData.rows.length, 'flexible positions');
          
          for (const position of flexData.rows) {
            const amount = parseFloat(position.totalAmount || 0);
            const symbol = position.asset;
            
            if (amount > 0 && symbol) {
              console.log(`📈 Processing flexible ${symbol}: ${amount}`);
              
              // Get price from CryptoCompare
              const { data: priceData } = await supabase.functions.invoke('fetch-crypto-data', {
                body: { symbol }
              });
              
              const price = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;
              console.log(`💵 ${symbol} price: ${price}`);
              
              holdings.push({
                asset_symbol: symbol,
                asset_name: `${symbol} (Flexible)`,
                amount,
                price_usd: price,
                value_usd: amount * price,
              });
            }
          }
        }
        
        console.log('✅ Total holdings after flexible:', holdings.length);
      } else {
        const flexError = await flexResponse.text();
        console.error('⚠️ Simple Earn Flexible API ERROR:', flexError);
        console.log('💡 Continuing with spot balances only...');
      }

      // 3. FETCH SIMPLE EARN LOCKED POSITIONS
      console.log('🔒 Fetching Binance Simple Earn Locked...');
      const lockTimestamp = Date.now();
      const lockQueryString = `timestamp=${lockTimestamp}`;
      const lockSignature = createHmac('sha256', apiSecret)
        .update(lockQueryString)
        .digest('hex');
      
      const lockUrl = `https://api.binance.com/sapi/v1/simple-earn/locked/position?${lockQueryString}&signature=${lockSignature}`;
      console.log('🌐 Calling Simple Earn Locked API...');
      
      const lockResponse = await fetch(lockUrl, {
        headers: {
          'X-MBX-APIKEY': apiKey
        }
      });

      console.log('📊 Locked Response status:', lockResponse.status);

      if (lockResponse.ok) {
        const lockData = await lockResponse.json();
        console.log('📦 Full Locked data:', JSON.stringify(lockData, null, 2));
        
        if (lockData.rows && Array.isArray(lockData.rows)) {
          console.log('✅ Found', lockData.rows.length, 'locked positions');
          
          for (const position of lockData.rows) {
            const amount = parseFloat(position.amount || 0);
            const symbol = position.asset;
            
            if (amount > 0 && symbol) {
              console.log(`📈 Processing locked ${symbol}: ${amount}`);
              
              // Get price from CryptoCompare
              const { data: priceData } = await supabase.functions.invoke('fetch-crypto-data', {
                body: { symbol }
              });
              
              const price = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;
              console.log(`💵 ${symbol} price: ${price}`);
              
              holdings.push({
                asset_symbol: symbol,
                asset_name: `${symbol} (Locked)`,
                amount,
                price_usd: price,
                value_usd: amount * price,
              });
            }
          }
        }
        
        console.log('✅ Total holdings after locked:', holdings.length);
      } else {
        const lockError = await lockResponse.text();
        console.error('⚠️ Simple Earn Locked API ERROR:', lockError);
        console.log('💡 Continuing without locked positions...');
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
      logs: [
        `✅ Synced ${exchangeName} exchange`,
        `💰 Spot Holdings: ${holdings.filter(h => !h.asset_name.includes('Savings')).length}`,
        `💎 Savings Holdings: ${holdings.filter(h => h.asset_name.includes('Savings')).length}`,
        `📊 Total Holdings: ${holdings.length}`,
        `💵 Total Value: $${holdings.reduce((sum, h) => sum + (h.value_usd || 0), 0).toFixed(2)}`
      ],
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
      logs: [
        `❌ Sync failed`,
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      ]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
