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
    console.log('sync-wallet-balance: Starting sync');
    const { connectionId, blockchain, walletAddress } = await req.json();
    console.log('sync-wallet-balance: Received', { connectionId, blockchain, walletAddress });
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('sync-wallet-balance: Auth error', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('sync-wallet-balance: Authenticated user', user.id);

    let balance = 0;
    let holdings: any[] = [];

    // Fetch balance based on blockchain
    if (blockchain === 'Bitcoin') {
      // Check if it's an xpub address
      if (walletAddress.startsWith('xpub') || walletAddress.startsWith('ypub') || walletAddress.startsWith('zpub')) {
        console.log('sync-wallet-balance: Fetching xpub balance from BlockCypher');
        // Use BlockCypher API for xpub
        const btcResponse = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${walletAddress}/balance`);
        console.log('sync-wallet-balance: BlockCypher response status:', btcResponse.status);
        
        if (btcResponse.ok) {
          const btcData = await btcResponse.json();
          console.log('sync-wallet-balance: BlockCypher response:', JSON.stringify(btcData));
          
          // BlockCypher returns balance in satoshis
          const satoshis = btcData.balance || 0;
          balance = satoshis / 100000000;
          
          console.log('sync-wallet-balance: Parsed balance:', balance, 'BTC');
          
          // Get BTC price
          const { data: priceData, error: priceError } = await supabase.functions.invoke('fetch-crypto-data', {
            body: { symbol: 'BTC' }
          });
          
          if (priceError) {
            console.error('sync-wallet-balance: Failed to fetch BTC price:', priceError);
          }
          
          const btcPrice = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;
          console.log('sync-wallet-balance: BTC price:', btcPrice);
          
          // Always create holding even if balance is 0 (so user can see the connection is working)
          holdings = [{
            asset_symbol: 'BTC',
            asset_name: 'Bitcoin',
            amount: balance,
            price_usd: btcPrice,
            value_usd: balance * btcPrice,
          }];
          console.log('sync-wallet-balance: Created holding:', holdings[0]);
        } else {
          const errorText = await btcResponse.text();
          console.error('sync-wallet-balance: BlockCypher API error:', errorText);
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
    } else if (blockchain === 'Ethereum') {
      console.log('sync-wallet-balance: Fetching Ethereum balance from Etherscan');
      const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY');
      
      const ethResponse = await fetch(
        `https://api.etherscan.io/api?module=account&action=balance&address=${walletAddress}&tag=latest&apikey=${etherscanKey}`
      );
      
      if (ethResponse.ok) {
        const ethData = await ethResponse.json();
        console.log('sync-wallet-balance: Etherscan response:', JSON.stringify(ethData));
        
        if (ethData.status === '1') {
          balance = parseInt(ethData.result || '0') / 1e18;
          console.log('sync-wallet-balance: Parsed ETH balance:', balance);
          
          // Get ETH price
          const { data: priceData, error: priceError } = await supabase.functions.invoke('fetch-crypto-data', {
            body: { symbol: 'ETH' }
          });
          
          if (priceError) {
            console.error('sync-wallet-balance: Failed to fetch ETH price:', priceError);
          }
          
          const ethPrice = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;
          console.log('sync-wallet-balance: ETH price:', ethPrice);
          
          holdings = [{
            asset_symbol: 'ETH',
            asset_name: 'Ethereum',
            amount: balance,
            price_usd: ethPrice,
            value_usd: balance * ethPrice,
          }];
          console.log('sync-wallet-balance: Created ETH holding:', holdings[0]);
        } else {
          console.error('sync-wallet-balance: Etherscan API error:', ethData.message || ethData.result);
        }
      } else {
        const errorText = await ethResponse.text();
        console.error('sync-wallet-balance: Etherscan HTTP error:', errorText);
      }
    } else if (blockchain === 'Polygon') {
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
    } else if (blockchain === 'BSC') {
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
    } else if (blockchain === 'Solana') {
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
      console.log('sync-wallet-balance: Inserting', holdings.length, 'holdings');
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
        console.error('sync-wallet-balance: Insert error:', insertError);
        throw insertError;
      }
      console.log('sync-wallet-balance: Holdings inserted successfully');
    } else {
      console.log('sync-wallet-balance: No holdings to insert (balance fetch may have failed)');
    }

    // Update last synced time
    const { error: updateError } = await supabase
      .from('portfolio_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', connectionId);

    if (updateError) {
      console.error('sync-wallet-balance: Failed to update last_synced_at', updateError);
    }

    console.log(`sync-wallet-balance: Successfully synced ${walletAddress} on ${blockchain}`, {
      balance,
      holdings: holdings.length,
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
    console.error('Error syncing wallet:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
