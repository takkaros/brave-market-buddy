import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Send, Loader2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AI_PROVIDERS = [
  { value: 'lovable', label: 'Lovable AI', description: 'Uses your Lovable credits', requiresKey: false },
  { value: 'openai', label: 'OpenAI', description: 'Use your OpenAI API key', requiresKey: true },
  { value: 'anthropic', label: 'Anthropic (Claude)', description: 'Use your Anthropic API key', requiresKey: true },
  { value: 'google', label: 'Google AI', description: 'Use your Google AI API key', requiresKey: true },
];

const AI_MODELS = {
  lovable: [
    { value: 'google/gemini-2.5-flash-lite', label: '⚡ Gemini Flash Lite', description: 'Cheapest - Best for free tier' },
    { value: 'google/gemini-2.5-flash', label: 'Gemini Flash', description: 'Fast & balanced' },
    { value: 'openai/gpt-5-nano', label: '💨 GPT-5 Nano', description: 'Super fast & cheap' },
    { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini', description: 'Efficient' },
    { value: 'google/gemini-2.5-pro', label: 'Gemini Pro', description: 'Premium reasoning' },
    { value: 'openai/gpt-5', label: 'GPT-5', description: 'Premium power' },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & cost-effective' },
    { value: 'gpt-4o', label: 'GPT-4o', description: 'Powerful & versatile' },
  ],
  anthropic: [
    { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', description: 'Most capable model' },
    { value: 'claude-opus-4-1-20250805', label: 'Claude Opus 4.1', description: 'Highly intelligent' },
  ],
  google: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Fast & efficient' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Most capable' },
  ],
};

const AIChat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('lovable');
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash-lite');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [portfolioStats, setPortfolioStats] = useState<{
    totalValue: number;
    holdingsCount: number;
    topAsset: string;
    cryptoPercentage: number;
  } | null>(null);

  useEffect(() => {
    const fetchPortfolioStats = async () => {
      if (!user) return;
      
      try {
        const { data: holdings } = await supabase
          .from('portfolio_holdings')
          .select('*')
          .eq('user_id', user.id);

        if (holdings && holdings.length > 0) {
          const totalValue = holdings.reduce((sum, h) => sum + (Number(h.value_usd) || 0), 0);
          const cryptoHoldings = holdings.filter(h => h.asset_type === 'crypto');
          const cryptoValue = cryptoHoldings.reduce((sum, h) => sum + (Number(h.value_usd) || 0), 0);
          
          const sortedByValue = [...holdings].sort((a, b) => 
            (Number(b.value_usd) || 0) - (Number(a.value_usd) || 0)
          );
          
          setPortfolioStats({
            totalValue,
            holdingsCount: holdings.length,
            topAsset: sortedByValue[0]?.asset_symbol || 'N/A',
            cryptoPercentage: totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0
          });
        }
      } catch (error) {
        // Error handled silently
      }
    };

    fetchPortfolioStats();
  }, [user]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            model: selectedModel,
            provider: selectedProvider,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 402) {
          throw new Error('💳 AI credits exhausted. Please add credits in Settings → Workspace → Usage to continue using AI features.');
        }
        if (response.status === 429) {
          throw new Error('⏱️ Rate limit exceeded. Please wait a moment and try again.');
        }
        
        throw new Error(errorData.error || errorData.message || 'Failed to get AI response');
      }

      const data = await response.json();
      
      if (data.success && data.data.choices?.[0]?.message) {
        const aiResponse: Message = {
          role: 'assistant',
          content: data.data.choices[0].message.content,
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again later.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <Card className="glass-card h-[calc(100vh-12rem)]">
          <CardHeader className="border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle>AI Investment Advisor</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Ask me anything about your investments, portfolio allocation, or market conditions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <Select value={selectedProvider} onValueChange={(value) => {
                      setSelectedProvider(value);
                      setSelectedModel(AI_MODELS[value as keyof typeof AI_MODELS][0].value);
                    }}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_PROVIDERS.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            <div className="flex flex-col text-left">
                              <span className="font-medium text-sm">{provider.label}</span>
                              <span className="text-xs text-muted-foreground">{provider.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS[selectedProvider as keyof typeof AI_MODELS].map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            <div className="flex flex-col text-left">
                              <span className="font-medium text-sm">{model.label}</span>
                              <span className="text-xs text-muted-foreground">{model.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedProvider === 'lovable' ? 'Free tier included • ⚡💨 = Most economical' : 'Using your own API key'}
                  </p>
                </div>
                
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>AI Provider Settings</DialogTitle>
                      <DialogDescription>
                        Configure your own API keys to use external AI providers without Lovable credits.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Selected Provider: <span className="font-bold">{AI_PROVIDERS.find(p => p.value === selectedProvider)?.label}</span></Label>
                      </div>
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <p className="text-sm font-medium">To add your own API keys:</p>
                        <ol className="text-sm space-y-1 list-decimal list-inside">
                          <li>Go to Settings → Secrets in your Lovable project</li>
                          <li>Add one or more of these secrets:
                            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                              <li><code className="text-xs bg-background px-1 py-0.5 rounded">OPENAI_USER_API_KEY</code> - For OpenAI</li>
                              <li><code className="text-xs bg-background px-1 py-0.5 rounded">ANTHROPIC_USER_API_KEY</code> - For Claude</li>
                              <li><code className="text-xs bg-background px-1 py-0.5 rounded">GOOGLE_AI_USER_API_KEY</code> - For Google AI</li>
                            </ul>
                          </li>
                          <li>Select the provider above and start chatting!</li>
                        </ol>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Get API keys from: <a href="https://platform.openai.com" target="_blank" rel="noopener" className="underline">OpenAI</a>, <a href="https://console.anthropic.com" target="_blank" rel="noopener" className="underline">Anthropic</a>, or <a href="https://ai.google.dev" target="_blank" rel="noopener" className="underline">Google AI</a>
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-full flex flex-col">
            <ScrollArea className="flex-1 p-6">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  {portfolioStats && (
                    <div className="mb-6 p-4 bg-muted/30 rounded-lg max-w-md mx-auto">
                      <p className="text-sm font-medium mb-2">Your Portfolio Summary</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>Total Value: <span className="text-foreground font-semibold">${portfolioStats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                        <div>Holdings: <span className="text-foreground font-semibold">{portfolioStats.holdingsCount}</span></div>
                        <div>Top Asset: <span className="text-foreground font-semibold">{portfolioStats.topAsset}</span></div>
                        <div>Crypto: <span className="text-foreground font-semibold">{portfolioStats.cryptoPercentage.toFixed(1)}%</span></div>
                      </div>
                    </div>
                  )}
                  <p className="text-muted-foreground mb-6">
                    {portfolioStats 
                      ? 'Get personalized advice based on your portfolio'
                      : 'Start a conversation with your AI advisor'
                    }
                  </p>
                  <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                    {portfolioStats ? (
                      <>
                        <Button
                          variant="outline"
                          className="text-left justify-start h-auto py-3"
                          onClick={() => setInput(`I have ${portfolioStats.holdingsCount} holdings worth $${portfolioStats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}. ${portfolioStats.cryptoPercentage.toFixed(0)}% is in crypto. Is my portfolio well-balanced?`)}
                        >
                          "Is my current portfolio allocation well-balanced?"
                        </Button>
                        <Button
                          variant="outline"
                          className="text-left justify-start h-auto py-3"
                          onClick={() => setInput(`My top holding is ${portfolioStats.topAsset}. Should I diversify more or is this concentration acceptable?`)}
                        >
                          "Should I diversify more given my top holding?"
                        </Button>
                        <Button
                          variant="outline"
                          className="text-left justify-start h-auto py-3"
                          onClick={() => setInput(`Given current market conditions and my ${portfolioStats.holdingsCount} holdings, what adjustments should I consider?`)}
                        >
                          "What portfolio adjustments should I consider now?"
                        </Button>
                        <Button
                          variant="outline"
                          className="text-left justify-start h-auto py-3"
                          onClick={() => setInput("Based on my holdings, what are the key risks I should monitor?")}
                        >
                          "What are my key portfolio risks to monitor?"
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="text-left justify-start h-auto py-3"
                          onClick={() => setInput("I'm 32, have $50k saved. 90% in cash earning 5%. What should I do?")}
                        >
                          "I'm 32, have $50k saved. 90% in cash earning 5%. What should I do?"
                        </Button>
                        <Button
                          variant="outline"
                          className="text-left justify-start h-auto py-3"
                          onClick={() => setInput("Has the market bottomed? Time to buy?")}
                        >
                          "Has the market bottomed? Time to buy?"
                        </Button>
                        <Button
                          variant="outline"
                          className="text-left justify-start h-auto py-3"
                          onClick={() => setInput("Should I take profits from my stocks?")}
                        >
                          "Should I take profits from my stocks?"
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, i) => (
                    <div
                      key={i}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'glass-card'
                        }`}
                      >
                        <pre className="whitespace-pre-wrap font-sans text-sm">
                          {message.content}
                        </pre>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="glass-card rounded-lg p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="sr-only">AI is thinking</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="p-6 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about your investment strategy..."
                  disabled={loading}
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIChat;
