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
    const { connectionId, blockchain, walletAddress } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let balance = 0;
    let holdings: any[] = [];

    // Fetch balance based on blockchain
    if (blockchain === 'Bitcoin') {
      // Check if it's an xpub address
      if (walletAddress.startsWith('xpub') || walletAddress.startsWith('ypub') || walletAddress.startsWith('zpub')) {
        // Use blockchain.info xpub API
        const btcResponse = await fetch(`https://blockchain.info/multiaddr?active=${walletAddress}`);
        if (btcResponse.ok) {
          const btcData = await btcResponse.json();
          const satoshis = btcData.wallet?.final_balance || 0;
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
          console.log(`Synced Bitcoin xpub: ${balance} BTC = $${balance * btcPrice}`);
        }
      } else {
        // Regular Bitcoin address
        const btcResponse = await fetch(`https://blockchain.info/balance?active=${walletAddress}`);
        if (btcResponse.ok) {
          const btcData = await btcResponse.json();
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
          console.log(`Synced Bitcoin address: ${balance} BTC = $${balance * btcPrice}`);
        }
      }
    } else if (blockchain === 'Ethereum') {
      // Use public Etherscan API (no key required, but rate limited)
      const ethResponse = await fetch(
        `https://api.etherscan.io/api?module=account&action=balance&address=${walletAddress}&tag=latest`
      );
      if (ethResponse.ok) {
        const ethData = await ethResponse.json();
        if (ethData.status === '1') {
          balance = parseInt(ethData.result || '0') / 1e18;
          
          // Get ETH price
          const { data: priceData } = await supabase.functions.invoke('fetch-crypto-data', {
            body: { symbol: 'ETH' }
          });
          const ethPrice = priceData?.data?.Data?.Data?.[priceData?.data?.Data?.Data?.length - 1]?.close || 0;
          
          holdings = [{
            asset_symbol: 'ETH',
            asset_name: 'Ethereum',
            amount: balance,
            price_usd: ethPrice,
            value_usd: balance * ethPrice,
          }];
          console.log(`Synced Ethereum address: ${balance} ETH = $${balance * ethPrice}`);
        } else {
          console.error('Etherscan API error:', ethData.message);
        }
      }
    }

    // Delete existing holdings for this connection
    await supabase
      .from('portfolio_holdings')
      .delete()
      .eq('connection_id', connectionId);

    // Insert new holdings
    if (holdings.length > 0) {
      const { error: insertError } = await supabase
        .from('portfolio_holdings')
        .insert(
          holdings.map(h => ({
            user_id: user.id,
            connection_id: connectionId,
            ...h,
          }))
        );

      if (insertError) throw insertError;
    }

    // Update last synced time
    await supabase
      .from('portfolio_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', connectionId);

    console.log(`Synced wallet ${walletAddress} on ${blockchain}`);

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
