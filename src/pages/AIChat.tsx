import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIChat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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
        console.error('Failed to fetch portfolio stats:', error);
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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI response');
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
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
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
            <CardTitle>AI Investment Advisor</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Ask me anything about your investments, portfolio allocation, or market conditions
            </p>
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
