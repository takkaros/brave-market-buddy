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

    console.log('Authenticated market analysis request from user:', user.id);

    const { 
      btcPrice, 
      ethPrice, 
      goldPrice, 
      silverPrice,
      yield10Y,
      yield2Y,
      cyprusHPI,
      vix,
      fearGreed,
      sp500
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable AI key not configured');
    }

    const prompt = `You are a professional wealth advisor analyzing the entire investment landscape. Provide a comprehensive market assessment across ALL asset classes.

Current Market Data:
CRYPTO:
- Bitcoin: $${btcPrice?.toLocaleString() || 'N/A'}
- Ethereum: $${ethPrice?.toLocaleString() || 'N/A'}

PRECIOUS METALS:
- Gold: $${goldPrice?.toLocaleString() || 'N/A'}/oz
- Silver: $${silverPrice?.toLocaleString() || 'N/A'}/oz

BONDS:
- 10-Year Treasury: ${yield10Y || 'N/A'}%
- 2-Year Treasury: ${yield2Y || 'N/A'}%
- Yield Curve: ${yield10Y && yield2Y ? (yield10Y - yield2Y).toFixed(2) : 'N/A'}%

EQUITIES:
- S&P 500: ${sp500 || 'N/A'}
- VIX (Volatility): ${vix || 'N/A'}

REAL ESTATE (CYPRUS):
- House Price Index: ${cyprusHPI || 'N/A'}

SENTIMENT:
- Fear & Greed Index: ${fearGreed || 'N/A'}

Provide a comprehensive analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "overallSignal": "RISK ON" | "BALANCED" | "RISK OFF" | "CRISIS MODE",
  "overallScore": number (0-10, where 10 = maximum bullish),
  "marketRegime": "detailed 2-3 sentence assessment of current market environment",
  "assetClassRankings": {
    "mostAttractive": ["asset1", "asset2", "asset3"],
    "leastAttractive": ["asset1", "asset2", "asset3"]
  },
  "portfolioAllocation": {
    "stocks": "percentage",
    "bonds": "percentage",
    "crypto": "percentage",
    "metals": "percentage",
    "cash": "percentage",
    "realEstate": "percentage"
  },
  "keyOpportunities": ["opportunity1", "opportunity2", "opportunity3"],
  "majorRisks": ["risk1", "risk2", "risk3"],
  "tacticalMoves": ["move1", "move2", "move3"],
  "timeHorizon": "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM",
  "confidenceLevel": "HIGH" | "MEDIUM" | "LOW",
  "bottomLine": "2-3 sentence actionable summary for investors"
}

Base your analysis on:
- Cross-asset correlations and flows
- Risk-on vs risk-off dynamics
- Inflation hedges vs deflation plays
- Yield opportunities vs growth potential
- Geographic considerations (Cyprus real estate context)
- Current fear/greed levels and contrarian opportunities

Be realistic and data-driven. Consider the interplay between asset classes.`;

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
            content: 'You are a professional wealth advisor and portfolio strategist. Provide comprehensive, data-driven analysis across all asset classes. Respond only with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Lovable AI error:', errorData);
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'PAYMENT_REQUIRED',
          message: 'Lovable AI credits exhausted. Please add credits to continue.',
          timestamp: new Date().toISOString()
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'RATE_LIMIT',
          message: 'Rate limit exceeded. Please wait a moment and try again.',
          timestamp: new Date().toISOString()
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(errorData.error?.message || 'AI API error');
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    // Parse JSON response
    let analysis;
    try {
      const cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText);
      throw new Error('Failed to parse AI analysis');
    }

    console.log('Overall market analysis generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      analysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in overall market analysis:', error);
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
