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

    console.log('Authenticated portfolio analysis request from user:', user.id);
    const { allocation, marketData, riskTolerance } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable AI key not configured');
    }

    const prompt = `You are a wealth advisor analyzing a portfolio allocation. Provide optimization recommendations.

Current Allocation:
- Stocks: ${allocation.stocks}%
- Bonds: ${allocation.bonds}%
- Crypto: ${allocation.crypto}%
- Metals: ${allocation.metals}%
- Cash: ${allocation.cash}%
- Real Estate: ${allocation.realEstate}%

Risk Tolerance: ${riskTolerance || 'Moderate'}

Current Market Data:
- Bitcoin: $${marketData.btcPrice?.toLocaleString() || 'N/A'}
- Gold: $${marketData.goldPrice?.toLocaleString() || 'N/A'}/oz
- 10Y Yield: ${marketData.yield10Y || 'N/A'}%
- VIX: ${marketData.vix || 'N/A'}
- Fear & Greed: ${marketData.fearGreed || 'N/A'}

Provide analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "currentAnalysis": {
    "totalAllocation": number,
    "riskScore": number (0-100),
    "expectedReturn": "percentage range",
    "diversificationScore": number (0-100),
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"]
  },
  "recommendedAllocation": {
    "stocks": "percentage",
    "bonds": "percentage",
    "crypto": "percentage",
    "metals": "percentage",
    "cash": "percentage",
    "realEstate": "percentage"
  },
  "optimizedAnalysis": {
    "riskScore": number (0-100),
    "expectedReturn": "percentage range",
    "diversificationScore": number (0-100),
    "improvementSummary": "2-3 sentence description"
  },
  "rebalancingActions": [
    {
      "action": "Increase/Decrease/Maintain",
      "asset": "asset class",
      "from": "current %",
      "to": "target %",
      "rationale": "brief explanation"
    }
  ],
  "marketTiming": {
    "environment": "FAVORABLE" | "NEUTRAL" | "CHALLENGING",
    "recommendation": "detailed recommendation for current market conditions"
  },
  "riskRewardProfile": {
    "conservativeReturn": "percentage",
    "moderateReturn": "percentage",
    "aggressiveReturn": "percentage",
    "maxDrawdown": "percentage"
  }
}`;

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
            content: 'You are a professional wealth advisor and portfolio strategist. Provide comprehensive, data-driven portfolio analysis and recommendations. Respond only with valid JSON.' 
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
    
    let analysis;
    try {
      const cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText);
      throw new Error('Failed to parse AI analysis');
    }

    console.log('Portfolio analysis generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      analysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in portfolio analysis:', error);
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
