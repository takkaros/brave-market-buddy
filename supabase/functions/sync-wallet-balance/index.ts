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
        console.log('sync-wallet-balance: Fetching xpub balance from blockchain.info');
        // Use blockchain.info xpub API
        const btcResponse = await fetch(`https://blockchain.info/multiaddr?active=${walletAddress}`);
        console.log('sync-wallet-balance: blockchain.info response status:', btcResponse.status);
        
        if (btcResponse.ok) {
          const btcData = await btcResponse.json();
          console.log('sync-wallet-balance: blockchain.info response:', JSON.stringify(btcData));
          
          // blockchain.info multiaddr returns final_balance directly for xpub
          const satoshis = btcData.wallet?.final_balance || btcData.final_balance || 0;
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
          console.error('sync-wallet-balance: blockchain.info API error:', errorText);
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
      // Use public Etherscan API (no key required, but rate limited)
      const ethResponse = await fetch(
        `https://api.etherscan.io/api?module=account&action=balance&address=${walletAddress}&tag=latest`
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
