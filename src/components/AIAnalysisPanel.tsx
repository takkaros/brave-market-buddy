import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIAnalysisPanelProps {
  riskScore: number;
  fearGreedIndex: number;
  onOpenChat: () => void;
}

const AIAnalysisPanel = ({ riskScore, fearGreedIndex, onOpenChat }: AIAnalysisPanelProps) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateAnalysis = async () => {
    setLoading(true);
    
    // Simulate AI response for demo
    setTimeout(() => {
      const demoAnalysis = `Current Risk Score: ${riskScore}/100 (MODERATE - Improving from 67 last month)

📊 MARKET SENTIMENT ANALYSIS:
Fear & Greed Index: ${fearGreedIndex} (${fearGreedIndex < 40 ? 'Extreme Fear' : 'Neutral'})
VIX: 22 (Elevated but falling)
Put/Call Ratio: 1.3 (Defensive positioning)

🎯 MY ASSESSMENT: Everyone IS fearful. Classic contrarian opportunity.

💡 WHAT TO DO NOW:

📈 STOCKS: Time to be BOLD (Score: ${riskScore} - Improving)
✅ BUY SIGNAL: Market has likely bottomed
- S&P 500 down 18% from peak, earnings stable
- Yield curve starting to normalize (recession fears overdone)
- ACTION: Increase equity allocation to 65-70%
- FOCUS: Quality growth + value blend (MSFT, GOOGL, BRK.B)
- TIMEFRAME: 12-18 month recovery expected
- CONFIDENCE: 70%

₿ CRYPTO: NEUTRAL (Score: 55)
⚠️ BTC at $42k (down from $69k high)
- Still risky but less frothy than 6 months ago
- Not a bottom yet, but getting interesting
- ACTION: Dollar-cost average 2-5% of portfolio
- IF RISK SCORE drops below 35 → increase to 10%

🏠 HOUSING: WAIT (Score: 58)
❌ Not a buy yet
- Prices sticky, inventory low, rates still high
- Need 6-12 more months of correction
- ACTION: Rent or wait for better entry

💰 GOLD: REDUCE (Score: 48)
↘️ Defensive positioning no longer needed
- Real yields rising (negative for gold)
- ACTION: Trim from 15% → 8% of portfolio
- Rotate proceeds into stocks

💵 CASH: DEPLOY (Score: 30)
✅ Time to put cash to work
- Yields attractive but opportunity cost rising
- ACTION: Reduce cash from 30% → 15%
- Deploy into stocks over next 3 months

🎲 BOTTOM LINE:
This is a "Be Greedy When Others Are Fearful" moment.
Risk/Reward is shifting positive. Not a perfect bottom,
but good enough. Expected 12-month return: +15-25% on stocks.

Recession Risk: 35% (down from 65%)
Rally Probability: 65% (12-month horizon)`;

      setAnalysis(demoAnalysis);
      setLoading(false);
      
      toast({
        title: "AI Analysis Generated",
        description: "Market analysis updated with current conditions",
      });
    }, 1500);
  };

  return (
    <Card className="glass-card col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">AI Market Navigator</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={onOpenChat}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Ask AI
            </Button>
            <Button
              onClick={generateAnalysis}
              disabled={loading}
              size="sm"
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Refresh Analysis
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!analysis && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Get AI-powered market analysis and specific investment recommendations
            </p>
            <Button onClick={generateAnalysis} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Generate AI Analysis
            </Button>
          </div>
        )}
        
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        
        {analysis && !loading && (
          <div className="prose prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
              {analysis}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnalysisPanel;
