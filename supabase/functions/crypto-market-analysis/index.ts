import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { btcPrice, ethPrice, fearGreed, btcDominance, marketCap } = await req.json();
    const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `You are a professional cryptocurrency market analyst. Based on current market data, provide a detailed technical analysis.

Current Market Data:
- Bitcoin (BTC): $${btcPrice.toLocaleString()}
- Ethereum (ETH): $${ethPrice.toLocaleString()}
- Fear & Greed Index: ${fearGreed}
- BTC Dominance: ${btcDominance}%
- Total Market Cap: $${marketCap}T

Provide a comprehensive analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "signal": "STRONG BUY" | "BUY" | "HOLD" | "SELL",
  "signalScore": number (0-10),
  "marketContext": "detailed paragraph about current market conditions",
  "btcAllocation": "percentage recommendation",
  "ethAllocation": "percentage recommendation", 
  "altAllocation": "percentage recommendation",
  "btcSupport": ["level1", "level2", "level3"],
  "btcResistance": ["level1", "level2", "level3"],
  "ethSupport": ["level1", "level2", "level3"],
  "ethResistance": ["level1", "level2", "level3"],
  "riskFactors": ["factor1", "factor2", "factor3", "factor4"],
  "bottomLine": "2-3 sentence summary with specific advice"
}

Base your analysis on:
- Current price levels vs historical ranges
- Fear & Greed sentiment
- Technical support/resistance levels based on recent price action
- Market structure and trends
- Risk/reward at current levels

Be accurate and realistic. Do not hallucinate data. Base support/resistance on actual technical analysis principles.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional cryptocurrency technical analyst. Provide accurate, data-driven analysis. Respond only with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(errorData.error?.message || 'OpenAI API error');
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