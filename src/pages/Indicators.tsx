import { useState } from 'react';
import { generateMockData } from '@/utils/mockData';
import { calculateRiskScore } from '@/utils/riskCalculator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import InfoTooltip from '@/components/InfoTooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Indicators = () => {
  const navigate = useNavigate();
  const mockData = generateMockData('bottom');
  const { categories } = calculateRiskScore(mockData);

  // Generate mock historical data for each indicator
  const generateIndicatorHistory = (currentValue: number) => {
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      value: currentValue + (Math.random() - 0.5) * currentValue * 0.2,
    }));
  };

  const indicatorExplanations = {
    vix: "The VIX (Volatility Index) measures expected volatility in the S&P 500. Often called the 'fear index', readings above 20 indicate elevated market uncertainty. Historically, extreme VIX spikes (40+) have marked major buying opportunities.",
    bbbAaaSpread: "Credit spreads measure the difference between corporate bond yields and risk-free treasuries. Widening spreads indicate investors demanding higher compensation for credit risk, often preceding economic stress.",
    yieldCurve: "The yield curve (10Y-2Y spread) is one of the most reliable recession predictors. When it inverts (goes negative), it has preceded every recession since 1950. Normal is +0.5% to +2%.",
    unemploymentRate: "Rising unemployment signals economic weakness and reduced consumer spending. The Fed watches this closely. Rates below 4% are historically strong, above 6% is concerning.",
    fearGreed: "Aggregates 7 market sentiment indicators including momentum, volatility, safe haven demand, and options activity. Warren Buffett's famous advice: 'Be fearful when others are greedy, and greedy when others are fearful.'",
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Economic Indicators</h1>
          <p className="text-muted-foreground">
            Detailed view of all 35 indicators with historical trends and explanations
          </p>
        </div>

        <Tabs defaultValue="market" className="space-y-6">
          <TabsList className="glass-card p-1">
            <TabsTrigger value="market">Market Risk</TabsTrigger>
            <TabsTrigger value="credit">Credit</TabsTrigger>
            <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
            <TabsTrigger value="monetary">Monetary</TabsTrigger>
            <TabsTrigger value="systemic">Systemic</TabsTrigger>
            <TabsTrigger value="realestate">Real Estate</TabsTrigger>
          </TabsList>

          {categories.map((category) => (
            <TabsContent 
              key={category.name.toLowerCase().replace(' ', '')} 
              value={category.name.toLowerCase().replace(' ', '')}
              className="space-y-6"
            >
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Weight in total risk: {(category.weight * 100).toFixed(0)}% | 
                    Current Score: <strong>{Math.round(category.score)}/100</strong>
                  </p>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {category.indicators.map((indicator) => {
                  const history = generateIndicatorHistory(indicator.value);
                  
                  return (
                    <Card key={indicator.name} className="glass-card">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          {indicator.name}
                          <InfoTooltip 
                            content={indicatorExplanations[indicator.name.toLowerCase().replace(/[^a-z]/g, '')] || 
                              `This indicator helps measure ${category.name.toLowerCase()}. Higher values generally indicate higher risk.`}
                          />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-3xl font-bold">
                              {indicator.value.toFixed(2)}{indicator.unit}
                            </p>
                            <p className="text-sm text-muted-foreground">Current Value</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold" 
                               style={{ 
                                 color: indicator.risk < 40 ? 'hsl(142, 76%, 36%)' : 
                                        indicator.risk < 60 ? 'hsl(45, 93%, 47%)' : 
                                        'hsl(0, 84%, 60%)'
                               }}>
                              {Math.round(indicator.risk)}
                            </p>
                            <p className="text-sm text-muted-foreground">Risk Score</p>
                          </div>
                        </div>

                        <ResponsiveContainer width="100%" height={150}>
                          <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="day" 
                              stroke="hsl(var(--muted-foreground))"
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                              label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis 
                              stroke="hsl(var(--muted-foreground))"
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>

                        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                          <p>
                            <strong>Interpretation:</strong> {
                              indicator.risk < 40 ? 'Low risk - conditions are favorable' :
                              indicator.risk < 60 ? 'Moderate risk - watch for changes' :
                              'Elevated risk - caution advised'
                            }
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="glass-card mt-6">
          <CardHeader>
            <CardTitle>About These Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>How to use this data:</strong> Each indicator is normalized to a 0-100 risk score. 
              Lower scores are better (less risky), higher scores indicate elevated risk.
            </p>
            <p>
              <strong>Data sources:</strong> Currently showing demo data. Add API keys in Settings to pull 
              real-time data from Federal Reserve Economic Data (FRED), Alpha Vantage, and other sources.
            </p>
            <p>
              <strong>Update frequency:</strong> With live API connections, most indicators update daily, 
              some (like VIX) update intraday during market hours.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Indicators;
