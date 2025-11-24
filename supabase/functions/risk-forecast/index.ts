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
    console.log('Risk forecast request received');
    const { currentScore, historicalData, marketData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable AI key not configured');
    }

    const prompt = `You are a quantitative risk analyst. Based on the current risk score and market data, provide a 7-day risk forecast.

Current Risk Score: ${currentScore}/100
Recent Historical Trend: ${historicalData?.slice(-7).map((d: any) => d.score).join(', ')}

Market Context:
- BTC: $${marketData.btcPrice?.toLocaleString() || 'N/A'}
- Gold: $${marketData.goldPrice?.toLocaleString() || 'N/A'}/oz
- VIX: ${marketData.vix || 'N/A'}
- 10Y Yield: ${marketData.yield10Y || 'N/A'}%
- Fear & Greed: ${marketData.fearGreed || 'N/A'}

Provide a 7-day forecast in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "forecast": [
    {
      "day": 1,
      "score": number (0-100),
      "confidence80Lower": number,
      "confidence80Upper": number,
      "confidence95Lower": number,
      "confidence95Upper": number
    },
    // ... days 2-7
  ],
  "scenarios": {
    "bull": {
      "description": "Best case scenario description",
      "day7Score": number,
      "probability": "percentage"
    },
    "base": {
      "description": "Most likely scenario description",
      "day7Score": number,
      "probability": "percentage"
    },
    "bear": {
      "description": "Worst case scenario description",
      "day7Score": number,
      "probability": "percentage"
    }
  },
  "interpretation": "2-3 sentence analysis of the forecast and key drivers",
  "keyRiskFactors": ["factor1", "factor2", "factor3"],
  "catalysts": {
    "upside": ["positive catalyst 1", "positive catalyst 2"],
    "downside": ["negative catalyst 1", "negative catalyst 2"]
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
            content: 'You are a quantitative risk analyst specializing in financial forecasting. Provide data-driven, realistic forecasts. Respond only with valid JSON.' 
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
    const forecastText = data.choices[0].message.content;
    
    let forecast;
    try {
      const cleanedText = forecastText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      forecast = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', forecastText);
      throw new Error('Failed to parse AI forecast');
    }

    console.log('Risk forecast generated successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      forecast,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in risk forecast:', error);
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
