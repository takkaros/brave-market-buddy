import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, TrendingUp, Target, AlertTriangle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PortfolioBuilder = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [riskTolerance, setRiskTolerance] = useState('moderate');
  const [allocation, setAllocation] = useState({
    stocks: 40,
    bonds: 30,
    crypto: 10,
    metals: 10,
    cash: 5,
    realEstate: 5,
  });
  const [analysis, setAnalysis] = useState<any>(null);

  const totalAllocation = Object.values(allocation).reduce((sum, val) => sum + val, 0);
  const isValidAllocation = totalAllocation === 100;

  const handleInputChange = (asset: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAllocation(prev => ({ ...prev, [asset]: numValue }));
  };

  const analyzePortfolio = async () => {
    if (!isValidAllocation) {
      toast({
        title: 'Invalid Allocation',
        description: 'Total allocation must equal 100%',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch current market data
      const [cryptoRes, metalsRes, bondsRes] = await Promise.all([
        supabase.functions.invoke('fetch-crypto-data', { body: { timeframe: '1M' } }),
        supabase.functions.invoke('fetch-metals-data', { body: { timeframe: '1M' } }),
        supabase.functions.invoke('fetch-bond-data', { body: { timeframe: '1M' } }),
      ]);

      const marketData = {
        btcPrice: cryptoRes.data?.bitcoin?.usd || 0,
        goldPrice: metalsRes.data?.prices?.Gold || 0,
        yield10Y: bondsRes.data?.['10Year']?.current || 0,
        vix: 22, // Mock for now
        fearGreed: 45, // Mock for now
      };

      const { data, error } = await supabase.functions.invoke('portfolio-analysis', {
        body: { allocation, marketData, riskTolerance },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setAnalysis(data.analysis);
      toast({
        title: 'Analysis Complete',
        description: 'Portfolio optimization recommendations generated',
      });
    } catch (error: any) {
      console.error('Portfolio analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze portfolio',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dashboard-gradient p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Navigation />
        
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Portfolio Builder</h1>
          <p className="text-muted-foreground">
            AI-powered portfolio optimization and rebalancing recommendations
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Current Allocation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Risk Tolerance</Label>
                  <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {Object.entries(allocation).map(([asset, value]) => (
                  <div key={asset}>
                    <Label className="capitalize">{asset}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) => handleInputChange(asset, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Total Allocation:</span>
                    <Badge variant={isValidAllocation ? 'default' : 'destructive'}>
                      {totalAllocation}%
                    </Badge>
                  </div>
                  <Button 
                    onClick={analyzePortfolio} 
                    disabled={!isValidAllocation || loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze Portfolio
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Section */}
          <div className="space-y-6">
            {loading ? (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            ) : analysis ? (
              <>
                {/* Current Analysis */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Current Portfolio Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Risk Score</p>
                        <p className="text-2xl font-bold">{analysis.currentAnalysis.riskScore}/100</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Diversification</p>
                        <p className="text-2xl font-bold">{analysis.currentAnalysis.diversificationScore}/100</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Expected Return</p>
                        <p className="text-xl font-bold">{analysis.currentAnalysis.expectedReturn}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-semibold text-risk-low">Strengths:</p>
                        <ul className="text-xs text-muted-foreground">
                          {analysis.currentAnalysis.strengths.map((s: string, i: number) => (
                            <li key={i}>✓ {s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-risk-elevated">Weaknesses:</p>
                        <ul className="text-xs text-muted-foreground">
                          {analysis.currentAnalysis.weaknesses.map((w: string, i: number) => (
                            <li key={i}>⚠ {w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommended Allocation */}
                <Card className="glass-card border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Recommended Allocation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {Object.entries(analysis.recommendedAllocation).map(([asset, percent]) => (
                        <div key={asset} className="flex justify-between items-center">
                          <span className="capitalize text-sm">{asset}:</span>
                          <span className="font-semibold">{percent as string}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">New Risk Score</p>
                          <p className="text-xl font-bold">{analysis.optimizedAnalysis.riskScore}/100</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">New Diversification</p>
                          <p className="text-xl font-bold">{analysis.optimizedAnalysis.diversificationScore}/100</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{analysis.optimizedAnalysis.improvementSummary}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Rebalancing Actions */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Rebalancing Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.rebalancingActions.map((action: any, i: number) => (
                        <div key={i} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-semibold capitalize">{action.asset}</span>
                            <Badge variant={action.action === 'Increase' ? 'default' : 'secondary'}>
                              {action.action}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {action.from} → {action.to}
                          </p>
                          <p className="text-xs">{action.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Market Timing */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Market Environment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge className="text-sm">
                      {analysis.marketTiming.environment}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {analysis.marketTiming.recommendation}
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Enter your allocation and click "Analyze Portfolio" to get AI-powered recommendations
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioBuilder;
