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

    console.log('Authenticated request from user:', user.id);
    const { messages, stream = false, model = 'google/gemini-2.5-flash', provider = 'lovable' } = await req.json();
    
    // Check for user-specific API keys in database first
    let userApiKey = null;
    if (provider !== 'lovable') {
      const { data: keyData } = await supabase
        .from('user_api_keys')
        .select('api_key_encrypted')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .single();

      if (keyData?.api_key_encrypted) {
        // Decrypt the user's API key
        const { data: decryptedKey } = await supabase
          .rpc('decrypt_secret', { encrypted_text: keyData.api_key_encrypted });
        
        if (decryptedKey) {
          userApiKey = decryptedKey;
          console.log(`Using user's own ${provider} API key`);
        }
      }
    }
    
    // Fall back to environment secrets if user doesn't have their own key
    const OPENAI_USER_KEY = userApiKey || Deno.env.get('OPENAI_USER_API_KEY');
    const ANTHROPIC_USER_KEY = userApiKey || Deno.env.get('ANTHROPIC_USER_API_KEY');
    const GOOGLE_USER_KEY = userApiKey || Deno.env.get('GOOGLE_AI_USER_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    let response;
    
    if (provider === 'openai' && OPENAI_USER_KEY) {
      // Use OpenAI API directly
      console.log('Using OpenAI API');
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_USER_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional wealth advisor and financial risk analyst. Provide clear, actionable insights about investments, portfolio allocation, market risks, and economic trends.'
            },
            ...messages
          ],
        }),
      });
    } else if (provider === 'anthropic' && ANTHROPIC_USER_KEY) {
      // Use Anthropic API directly
      console.log('Using Anthropic API');
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_USER_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'claude-sonnet-4-5',
          max_tokens: 1024,
          messages: messages,
          system: 'You are a professional wealth advisor and financial risk analyst. Provide clear, actionable insights about investments, portfolio allocation, market risks, and economic trends.'
        }),
      });
    } else if (provider === 'google' && GOOGLE_USER_KEY) {
      // Use Google AI API directly
      console.log('Using Google AI API');
      const promptText = messages.map((m: any) => `${m.role}: ${m.content}`).join('\n');
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:generateContent?key=${GOOGLE_USER_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a professional wealth advisor and financial risk analyst. Provide clear, actionable insights about investments, portfolio allocation, market risks, and economic trends.\n\n${promptText}`
            }]
          }]
        }),
      });
    } else if (provider !== 'lovable' && !userApiKey) {
      // User selected a provider but doesn't have a key configured
      throw new Error(`No API key configured for ${provider}. Please add your API key in Settings or switch to Lovable AI.`);
    } else {
      // Use Lovable AI Gateway (default)
      console.log('Using Lovable AI Gateway');
      if (!LOVABLE_API_KEY) {
        throw new Error('Lovable AI key not configured');
      }

      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { 
              role: 'system', 
              content: 'You are a professional wealth advisor and financial risk analyst. Provide clear, actionable insights about investments, portfolio allocation, market risks, and economic trends.' 
            },
            ...messages
          ],
          stream,
        }),
      });
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI usage limit reached. Please add more credits or use your own API key in Settings.');
      }
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your API key in Settings.');
      }
      const errorText = await response.text();
      console.error(`AI API error (${response.status}):`, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    // Handle streaming for Lovable AI
    if (stream && provider === 'lovable') {
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    const data = await response.json();
    console.log(`AI response generated successfully using ${provider}${userApiKey ? ' (user key)' : ' (env key)'}`);

    // Parse response based on provider
    let assistantMessage;
    if (provider === 'anthropic') {
      assistantMessage = data.content[0].text;
    } else if (provider === 'google') {
      assistantMessage = data.candidates[0].content.parts[0].text;
    } else {
      // OpenAI and Lovable AI format
      assistantMessage = data.choices?.[0]?.message?.content || data;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: provider === 'lovable' || provider === 'openai' ? data : { choices: [{ message: { content: assistantMessage } }] },
      provider,
      usingUserKey: !!userApiKey,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
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
