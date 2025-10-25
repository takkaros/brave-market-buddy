import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    console.log('==================== WALLET SYNC START ====================');
    const { connectionId, blockchain, walletAddress } = await req.json();
    console.log('📥 INPUT:', JSON.stringify({ connectionId, blockchain, walletAddress }, null, 2));
    
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

    let balance = 0;
    let holdings: any[] = [];

    // Normalize blockchain to lowercase for comparison
    const blockchainLower = blockchain.toLowerCase();
    console.log('🔍 Blockchain (normalized):', blockchainLower);

    // Fetch balance based on blockchain
    if (blockchainLower === 'bitcoin') {
      console.log('🟠 BITCOIN SYNC INITIATED');
      // Check if it's an xpub address
      if (walletAddress.startsWith('xpub') || walletAddress.startsWith('ypub') || walletAddress.startsWith('zpub')) {
        console.log('📡 Fetching XPUB balance from Blockchain.info');
        const apiUrl = `https://blockchain.info/balance?active=${walletAddress}`;
        console.log('🌐 API URL:', apiUrl);
        
        const btcResponse = await fetch(apiUrl);
        console.log('📊 Response status:', btcResponse.status);
        console.log('📊 Response headers:', JSON.stringify(Object.fromEntries(btcResponse.headers.entries())));
        
        if (btcResponse.ok) {
          const btcData = await btcResponse.json();
          console.log('📦 Raw API response:', JSON.stringify(btcData, null, 2));
          
          // Blockchain.info returns balance in satoshis
          const satoshis = btcData[walletAddress]?.final_balance || 0;
          balance = satoshis / 100000000;
          
          console.log('💰 Parsed balance:', balance, 'BTC (', satoshis, 'satoshis )');
          
          // Get BTC price
          console.log('💵 Fetching BTC price...');
          const { data: priceData, error: priceError } = await supabase.functions.invoke('fetch-crypto-data', {
            body: { symbol: 'BTC' }
          });
          
          if (priceError) {
            console.error('❌ Failed to fetch BTC price:', priceError);
          }
          
          const btcPrice = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;
          console.log('💵 BTC price:', btcPrice);
          
          // Always create holding even if balance is 0 (so user can see the connection is working)
          holdings = [{
            asset_symbol: 'BTC',
            asset_name: 'Bitcoin',
            amount: balance,
            price_usd: btcPrice,
            value_usd: balance * btcPrice,
          }];
          console.log('✅ Created BTC holding:', JSON.stringify(holdings[0], null, 2));
        } else {
          const errorText = await btcResponse.text();
          console.error('❌ Blockchain.info API ERROR:', errorText);
          console.error('❌ This may indicate the xpub format is not supported by blockchain.info');
        }
      } else {
        // Regular Bitcoin address
        console.log('sync-wallet-balance: Fetching regular address balance from blockchain.info');
        const btcResponse = await fetch(`https://blockchain.info/balance?active=${walletAddress}`);
        
        if (btcResponse.ok) {
          const btcData = await btcResponse.json();
          console.log('sync-wallet-balance: blockchain.info balance response:', JSON.stringify(btcData));
          const satoshis = btcData[walletAddress]?.final_balance || 0;
          balance = satoshis / 100000000;
          
          // Get BTC price
          const { data: priceData } = await supabase.functions.invoke('fetch-crypto-data', {
            body: { symbol: 'BTC' }
          });
          const btcPrice = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;
          
          holdings = [{
            asset_symbol: 'BTC',
            asset_name: 'Bitcoin',
            amount: balance,
            price_usd: btcPrice,
            value_usd: balance * btcPrice,
          }];
          console.log('sync-wallet-balance: Synced Bitcoin address:', balance, 'BTC =', balance * btcPrice, 'USD');
        }
      }
    } else if (blockchainLower === 'ethereum') {
      console.log('🔵 ETHEREUM SYNC INITIATED');
      const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY');
      console.log('🔑 API Key present:', !!etherscanKey);
      
      const apiUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=balance&address=${walletAddress}&tag=latest&apikey=${etherscanKey}`;
      console.log('🌐 API URL:', apiUrl.replace(etherscanKey || '', 'HIDDEN'));
      
      const ethResponse = await fetch(apiUrl);
      console.log('📊 Response status:', ethResponse.status);
      console.log('📊 Response headers:', JSON.stringify(Object.fromEntries(ethResponse.headers.entries())));
      
      if (ethResponse.ok) {
        const ethData = await ethResponse.json();
        console.log('📦 Raw Etherscan V2 response:', JSON.stringify(ethData, null, 2));
        
        if (ethData.status === '1') {
          balance = parseInt(ethData.result || '0') / 1e18;
          console.log('💰 Parsed ETH balance:', balance);
          
          // Get ETH price
          console.log('💵 Fetching ETH price...');
          const { data: priceData, error: priceError } = await supabase.functions.invoke('fetch-crypto-data', {
            body: { symbol: 'ETH' }
          });
          
          if (priceError) {
            console.error('❌ Failed to fetch ETH price:', priceError);
          }
          
          const ethPrice = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;
          console.log('💵 ETH price:', ethPrice);
          
          holdings = [{
            asset_symbol: 'ETH',
            asset_name: 'Ethereum',
            amount: balance,
            price_usd: ethPrice,
            value_usd: balance * ethPrice,
          }];
          console.log('✅ Created ETH holding:', JSON.stringify(holdings[0], null, 2));
        } else {
          console.error('❌ Etherscan V2 API returned error status:', ethData.status);
          console.error('❌ Error message:', ethData.message || ethData.result);
        }
      } else {
        const errorText = await ethResponse.text();
        console.error('❌ Etherscan V2 HTTP ERROR (status', ethResponse.status, '):', errorText);
      }
    } else if (blockchainLower === 'polygon') {
      console.log('sync-wallet-balance: Fetching Polygon balance from Polygonscan');
      const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY'); // Polygonscan accepts Etherscan API key
      
      const polyResponse = await fetch(
        `https://api.polygonscan.com/api?module=account&action=balance&address=${walletAddress}&tag=latest&apikey=${etherscanKey}`
      );
      
      if (polyResponse.ok) {
        const polyData = await polyResponse.json();
        console.log('sync-wallet-balance: Polygonscan response:', JSON.stringify(polyData));
        
        if (polyData.status === '1') {
          balance = parseInt(polyData.result || '0') / 1e18;
          console.log('sync-wallet-balance: Parsed MATIC balance:', balance);
          
          // Get MATIC price
          const { data: priceData } = await supabase.functions.invoke('fetch-crypto-data', {
            body: { symbol: 'MATIC' }
          });
          
          const maticPrice = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;
          console.log('sync-wallet-balance: MATIC price:', maticPrice);
          
          holdings = [{
            asset_symbol: 'MATIC',
            asset_name: 'Polygon',
            amount: balance,
            price_usd: maticPrice,
            value_usd: balance * maticPrice,
          }];
        } else {
          console.error('sync-wallet-balance: Polygonscan API error:', polyData.message || polyData.result);
        }
      }
    } else if (blockchainLower === 'bsc') {
      console.log('sync-wallet-balance: Fetching BSC balance from BscScan');
      const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY'); // BscScan accepts Etherscan API key
      
      const bscResponse = await fetch(
        `https://api.bscscan.com/api?module=account&action=balance&address=${walletAddress}&tag=latest&apikey=${etherscanKey}`
      );
      
      if (bscResponse.ok) {
        const bscData = await bscResponse.json();
        console.log('sync-wallet-balance: BscScan response:', JSON.stringify(bscData));
        
        if (bscData.status === '1') {
          balance = parseInt(bscData.result || '0') / 1e18;
          console.log('sync-wallet-balance: Parsed BNB balance:', balance);
          
          // Get BNB price
          const { data: priceData } = await supabase.functions.invoke('fetch-crypto-data', {
            body: { symbol: 'BNB' }
          });
          
          const bnbPrice = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;
          console.log('sync-wallet-balance: BNB price:', bnbPrice);
          
          holdings = [{
            asset_symbol: 'BNB',
            asset_name: 'BNB',
            amount: balance,
            price_usd: bnbPrice,
            value_usd: balance * bnbPrice,
          }];
        } else {
          console.error('sync-wallet-balance: BscScan API error:', bscData.message || bscData.result);
        }
      }
    } else if (blockchainLower === 'solana') {
      console.log('sync-wallet-balance: Fetching Solana balance from public RPC');
      
      const solResponse = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [walletAddress]
        })
      });
      
      if (solResponse.ok) {
        const solData = await solResponse.json();
        console.log('sync-wallet-balance: Solana RPC response:', JSON.stringify(solData));
        
        if (solData.result) {
          balance = (solData.result.value || 0) / 1e9; // SOL has 9 decimals
          console.log('sync-wallet-balance: Parsed SOL balance:', balance);
          
          // Get SOL price
          const { data: priceData } = await supabase.functions.invoke('fetch-crypto-data', {
            body: { symbol: 'SOL' }
          });
          
          const solPrice = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;
          console.log('sync-wallet-balance: SOL price:', solPrice);
          
          holdings = [{
            asset_symbol: 'SOL',
            asset_name: 'Solana',
            amount: balance,
            price_usd: solPrice,
            value_usd: balance * solPrice,
          }];
        } else {
          console.error('sync-wallet-balance: Solana RPC error:', solData.error);
        }
      }
    }

    // Delete existing holdings for this connection
    const { error: deleteError } = await supabase
      .from('portfolio_holdings')
      .delete()
      .eq('connection_id', connectionId);
    
    if (deleteError) {
      console.error('sync-wallet-balance: Failed to delete old holdings:', deleteError);
    }

    // Insert new holdings (even if balance is 0, so user can see the connection is working)
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
      console.log('⚠️ No holdings to insert - API call may have failed');
      console.log('⚠️ Check the API response logs above for details');
    }

    // Update last synced time
    const { error: updateError } = await supabase
      .from('portfolio_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', connectionId);

    if (updateError) {
      console.error('sync-wallet-balance: Failed to update last_synced_at', updateError);
    }

    console.log('==================== SYNC COMPLETE ====================');
    console.log('📊 FINAL RESULT:', {
      wallet: walletAddress,
      blockchain,
      balance,
      holdingsCount: holdings.length,
      totalValue: holdings.reduce((sum, h) => sum + (h.value_usd || 0), 0),
    });

    return new Response(JSON.stringify({ 
      success: true,
      balance,
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
