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
        const errorData = await binanceResponse.json();
        console.error('❌ Binance Spot API ERROR:', errorData);
        
        // Check for authentication errors
        if (errorData.code === -2015 || errorData.code === -2008) {
          throw new Error(`❌ Invalid Binance API credentials: ${errorData.msg}`);
        }
        
        // For other errors, log but continue
        console.log('⚠️ Continuing without spot balances...');
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
    } else if (exchangeLower === 'kucoin') {
      console.log('🟢 KUCOIN SYNC INITIATED');
      const apiPassphrase = connection.api_passphrase;
      
      if (!apiPassphrase) {
        throw new Error('KuCoin requires API passphrase');
      }

      const timestamp = Date.now().toString();
      const method = 'GET';
      const endpoint = '/api/v1/accounts';
      const body = '';
      
      // Generate signature
      const stringToSign = timestamp + method + endpoint + body;
      const encoder = new TextEncoder();
      const keyData = encoder.encode(apiSecret);
      const messageData = encoder.encode(stringToSign);
      
      const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
      
      // Encrypt passphrase
      const passphraseData = encoder.encode(apiPassphrase);
      const encryptedPassphraseBuffer = await crypto.subtle.sign('HMAC', cryptoKey, passphraseData);
      const encryptedPassphrase = btoa(String.fromCharCode(...new Uint8Array(encryptedPassphraseBuffer)));

      const kucoinResponse = await fetch(`https://api.kucoin.com${endpoint}`, {
        headers: {
          'KC-API-KEY': apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp,
          'KC-API-PASSPHRASE': encryptedPassphrase,
          'KC-API-KEY-VERSION': '2',
        }
      });

      const kucoinData = await kucoinResponse.json();

      if (kucoinData.code === '400005') {
        throw new Error('❌ Invalid API passphrase');
      } else if (kucoinData.code === '400006') {
        throw new Error('❌ Invalid API key');
      } else if (kucoinData.code === '400007') {
        throw new Error('❌ Invalid API secret - check signature');
      } else if (kucoinResponse.status === 401) {
        throw new Error('❌ Unauthorized - API key may be revoked');
      } else if (kucoinResponse.status === 403) {
        throw new Error("❌ Insufficient API permissions - enable 'General' access");
      } else if (kucoinResponse.status === 429) {
        throw new Error('⏱️ Rate limit exceeded - wait 1 minute');
      } else if (!kucoinResponse.ok || kucoinData.code !== '200000') {
        throw new Error(`KuCoin API error: ${kucoinData.msg || kucoinResponse.statusText}`);
      }

      const accounts = kucoinData.data || [];
      console.log(`Found ${accounts.length} KuCoin accounts`);

      for (const account of accounts) {
        const balance = parseFloat(account.balance);
        if (balance > 0) {
          const symbol = account.currency;
          
          const { data: priceData } = await supabase.functions.invoke('fetch-crypto-data', { body: { symbol } });
          const price = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;

          holdings.push({
            asset_symbol: symbol,
            asset_name: symbol,
            amount: balance,
            price_usd: price,
            value_usd: balance * price,
          });
        }
      }
    } else if (exchangeLower === 'coinbase') {
      console.log('🔵 COINBASE SYNC INITIATED');
      const coinbaseResponse = await fetch('https://api.coinbase.com/v2/accounts', {
        headers: {
          'CB-ACCESS-KEY': apiKey,
          'CB-ACCESS-SIGN': apiSecret,
          'CB-VERSION': '2023-01-01',
        }
      });

      if (!coinbaseResponse.ok) {
        throw new Error(`Coinbase API error: ${coinbaseResponse.statusText}`);
      }

      const coinbaseData = await coinbaseResponse.json();
      const accounts = coinbaseData.data || [];
      console.log(`Found ${accounts.length} Coinbase accounts`);

      for (const account of accounts) {
        const balance = parseFloat(account.balance.amount);
        if (balance > 0) {
          const symbol = account.balance.currency;
          
          const { data: priceData } = await supabase.functions.invoke('fetch-crypto-data', { body: { symbol } });
          const price = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;

          holdings.push({
            asset_symbol: symbol,
            asset_name: account.name || symbol,
            amount: balance,
            price_usd: price,
            value_usd: balance * price,
          });
        }
      }
    } else if (exchangeLower === 'kraken') {
      console.log('🟣 KRAKEN SYNC INITIATED');
      const nonce = Date.now().toString();
      const endpoint = '/0/private/Balance';
      const postData = `nonce=${nonce}`;
      
      const encoder = new TextEncoder();
      const noncePostData = nonce + postData;
      const sha256Hash = await crypto.subtle.digest('SHA-256', encoder.encode(noncePostData));
      const pathHash = encoder.encode(endpoint);
      
      const combined = new Uint8Array(pathHash.length + sha256Hash.byteLength);
      combined.set(pathHash);
      combined.set(new Uint8Array(sha256Hash), pathHash.length);
      
      const keyData = Uint8Array.from(atob(apiSecret), c => c.charCodeAt(0));
      const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, combined);
      const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

      const krakenResponse = await fetch(`https://api.kraken.com${endpoint}`, {
        method: 'POST',
        headers: {
          'API-Key': apiKey,
          'API-Sign': signature,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData
      });

      const krakenData = await krakenResponse.json();
      if (krakenData.error && krakenData.error.length > 0) {
        throw new Error(`Kraken API error: ${krakenData.error.join(', ')}`);
      }

      const balances = krakenData.result || {};
      console.log(`Found ${Object.keys(balances).length} Kraken balances`);

      for (const [symbol, balance] of Object.entries(balances)) {
        const amount = parseFloat(balance as string);
        if (amount > 0) {
          const cleanSymbol = symbol.replace(/^X|^Z/, '');
          
          const { data: priceData } = await supabase.functions.invoke('fetch-crypto-data', { body: { symbol: cleanSymbol } });
          const price = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;

          holdings.push({
            asset_symbol: cleanSymbol,
            asset_name: cleanSymbol,
            amount,
            price_usd: price,
            value_usd: amount * price,
          });
        }
      }
    }

    // Delete existing NON-HIDDEN holdings for this connection
    // This preserves hidden holdings during sync
    const { error: deleteError } = await supabase
      .from('portfolio_holdings')
      .delete()
      .eq('connection_id', connectionId)
      .eq('is_hidden', false);  // Only delete visible holdings
    
    if (deleteError) {
      console.error('❌ Failed to delete old holdings:', deleteError);
    } else {
      console.log('✅ Deleted old visible holdings (preserved hidden ones)');
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
