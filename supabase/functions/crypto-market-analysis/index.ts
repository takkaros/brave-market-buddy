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
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Unauthorized - Authentication required',
        timestamp: new Date().toISOString()
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Unauthorized - Invalid token',
        timestamp: new Date().toISOString()
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated crypto analysis request from user:', user.id);
    const { btcPrice, ethPrice, fearGreed, btcDominance, marketCap, holdings = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable AI key not configured');
    }

    // Build holdings context
    const holdingsContext = holdings.length > 0 
      ? `\n\nUser's Current Crypto Holdings (Cyprus-based investor):\n${holdings.map((h: any) => 
          `- ${h.name || h.symbol}: ${h.amount} ${h.symbol} = $${h.value_usd?.toFixed(2) || '0'} (@ $${h.price_usd?.toFixed(2) || '0'})`
        ).join('\n')}\nTotal Portfolio Value: $${holdings.reduce((sum: number, h: any) => sum + (h.value_usd || 0), 0).toFixed(2)}`
      : '\n\nUser has no current crypto holdings - provide advice for a new Cyprus-based investor.';

    const prompt = `You are a professional cryptocurrency market analyst specializing in the European/Cyprus market. Based on current market data, provide a personalized technical analysis.

Current Market Data:
- Bitcoin (BTC): $${btcPrice.toLocaleString()}
- Ethereum (ETH): $${ethPrice.toLocaleString()}
- Fear & Greed Index: ${fearGreed}
- BTC Dominance: ${btcDominance}%
- Total Market Cap: $${marketCap}T
${holdingsContext}

**Cyprus/Europe Market Context:**
- Trading hours: Consider European timezone (GMT+2 Cyprus)
- European crypto regulations (MiCA framework)
- Cyprus tax implications: 0% capital gains on crypto
- Recommended European exchanges: Kraken, Bitstamp, Coinbase
- Local Cyprus considerations: Strong tech/crypto community, favorable regulatory environment

Provide a comprehensive PERSONALIZED analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "signal": "STRONG BUY" | "BUY" | "HOLD" | "SELL",
  "signalScore": number (0-10),
  "marketContext": "detailed paragraph about current market conditions from a European investor perspective, considering the user's holdings",
  "btcAllocation": "percentage recommendation (consider their current holdings)",
  "ethAllocation": "percentage recommendation (consider their current holdings)", 
  "altAllocation": "percentage recommendation",
  "btcSupport": ["$XX,XXX level1", "$XX,XXX level2", "$XX,XXX level3"] (in USD),
  "btcResistance": ["$XX,XXX level1", "$XX,XXX level2", "$XX,XXX level3"] (in USD),
  "ethSupport": ["$X,XXX level1", "$X,XXX level2", "$X,XXX level3"] (in USD),
  "ethResistance": ["$X,XXX level1", "$X,XXX level2", "$X,XXX level3"] (in USD),
  "riskFactors": ["factor1 relevant to EU/Cyprus", "factor2", "factor3", "factor4"],
  "bottomLine": "2-3 sentence personalized summary based on their holdings with specific advice for Cyprus investors"
}

Base your analysis on:
- Current price levels vs historical ranges (in USD)
- Fear & Greed sentiment
- Technical support/resistance levels in USD
- Market structure and trends
- Risk/reward at current levels FOR THIS SPECIFIC INVESTOR based on their holdings
- European trading session considerations
- Cyprus-specific tax advantages (0% capital gains)

Be accurate, realistic, and PERSONALIZED to their portfolio. If they have holdings, reference them specifically.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional cryptocurrency technical analyst specializing in European markets and Cyprus investors. Provide accurate, data-driven, personalized analysis. Respond only with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Lovable AI error:', errorData);
      throw new Error(errorData.error?.message || 'AI API error');
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    // Parse JSON response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText);
      throw new Error('Failed to parse AI analysis');
    }

    console.log('Crypto market analysis generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      analysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in crypto market analysis:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});