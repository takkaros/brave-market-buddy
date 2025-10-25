import { useState } from 'react';
import { generateMockData } from '@/utils/mockData';
import { calculateRiskScore } from '@/utils/riskCalculator';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import InfoTooltip from '@/components/InfoTooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Lightbulb, Award } from 'lucide-react';

const Indicators = () => {
  const mockData = generateMockData('bottom');
  const { categories } = calculateRiskScore(mockData);
  
  // Professional insights for each category
  const proInsights = {
    'Market Risk': {
      keyMetrics: ['VIX', 'Put/Call Ratio', 'Shiller P/E', 'Buffett Indicator'],
      whatProsWatch: 'Professional traders focus on volatility patterns (VIX), market breadth, and valuation multiples. When VIX spikes above 30, it often signals capitulation. Shiller P/E above 30 = overvalued.',
      actionableSignal: 'VIX > 30 + P/E < 18 = Strong buy zone'
    },
    'Credit Risk': {
      keyMetrics: ['BBB-AAA Spread', 'Credit Card Delinquency', 'Auto Loan Defaults'],
      whatProsWatch: 'Credit analysts monitor spread widening as early warning of stress. When BBB spreads widen past 2.5%, corporate credit is deteriorating. Rising consumer delinquencies precede recessions by 6-12 months.',
      actionableSignal: 'Spreads > 3% = Risk-off, Move to quality bonds'
    },
    'Liquidity Risk': {
      keyMetrics: ['TED Spread', 'Fed Balance Sheet', 'Bank Liquidity Ratio'],
      whatProsWatch: 'Money managers obsess over liquidity metrics. TED spread above 0.5% means banks don\'t trust each other. Fed expanding balance sheet = liquidity injection = bullish for risk assets.',
      actionableSignal: 'TED < 0.3% + Fed expanding = Buy stocks'
    },
    'Monetary Risk': {
      keyMetrics: ['Yield Curve', 'Real Yields', 'Fed Funds Rate'],
      whatProsWatch: 'Bond traders live by the yield curve. Inversion (10Y-2Y negative) predicts recessions with 100% accuracy. Real yields above 2% make bonds attractive vs stocks.',
      actionableSignal: 'Curve steepening after inversion = Buy everything'
    },
    'Systemic Risk': {
      keyMetrics: ['Unemployment Rate', 'Initial Claims', 'Bank Failures'],
      whatProsWatch: 'Macro analysts track labor market tightness. Unemployment below 4% = peak cycle. Initial claims rising 20% = slowdown. Bank failures cluster before crises.',
      actionableSignal: 'Claims rising + Banks failing = Major risk-off'
    },
    'Real Estate Risk': {
      keyMetrics: ['Case-Shiller Index', 'Mortgage Rates', 'Days on Market'],
      whatProsWatch: 'Real estate pros watch affordability (price-to-income) and inventory. Days on market > 60 = buyer\'s market. Mortgage rates > 7% = demand destruction.',
      actionableSignal: 'Prices falling + Inventory rising = Wait 12 months'
    }
  };

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
      <div className="max-w-7xl mx-auto space-y-6">
        <Navigation />

        <div className="glass-card rounded-2xl p-8 border-l-4 border-primary">
          <div className="flex items-start gap-4">
            <Award className="w-12 h-12 text-primary mt-1" />
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3 text-gradient">Professional Economic Indicators</h1>
              <p className="text-lg text-muted-foreground mb-4">
                The same metrics institutional investors and hedge funds use to make billion-dollar decisions
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="text-sm">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {categories.reduce((sum, cat) => sum + cat.indicators.length, 0)} Live Indicators
                </Badge>
                <Badge variant="outline" className="text-sm">
                  <Lightbulb className="w-3 h-3 mr-1" />
                  Professional Insights
                </Badge>
              </div>
            </div>
          </div>
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

          {categories.map((category) => {
            const insight = proInsights[category.name];
            
            return (
            <TabsContent 
              key={category.name.toLowerCase().replace(' ', '')} 
              value={category.name.toLowerCase().replace(' ', '')}
              className="space-y-6"
            >
              {/* Professional Insights Card */}
              <Card className="glass-card border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {category.name}
                        <Badge variant={category.score < 40 ? 'default' : category.score < 60 ? 'secondary' : 'destructive'}>
                          {Math.round(category.score)}/100
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        Weight in total risk: {(category.weight * 100).toFixed(0)}%
                      </CardDescription>
                    </div>
                    {category.score < category.indicators[0]?.risk ? (
                      <TrendingDown className="w-8 h-8 text-risk-low" />
                    ) : (
                      <TrendingUp className="w-8 h-8 text-risk-elevated" />
                    )}
                  </div>
                </CardHeader>
                {insight && (
                  <CardContent className="space-y-4 border-t border-border pt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <Award className="w-4 h-4" />
                          What Professionals Watch
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {insight.whatProsWatch}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <Lightbulb className="w-4 h-4" />
                          Actionable Signal
                        </div>
                        <p className="text-sm font-mono bg-primary/10 p-3 rounded-lg">
                          {insight.actionableSignal}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {insight.keyMetrics.map(metric => (
                            <Badge key={metric} variant="outline" className="text-xs">
                              {metric}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Indicators Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {category.indicators.map((indicator) => {
                  const history = generateIndicatorHistory(indicator.value);
                  const trend = history[history.length - 1].value > history[0].value;
                  
                  return (
                    <Card key={indicator.name} className="glass-card hover:border-primary/30 transition-all">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {indicator.name}
                            <InfoTooltip 
                              content={indicatorExplanations[indicator.name.toLowerCase().replace(/[^a-z]/g, '')] || 
                                `This indicator helps measure ${category.name.toLowerCase()}. Professional investors monitor this closely for early warning signals.`}
                            />
                          </CardTitle>
                          {trend ? (
                            <TrendingUp className="w-5 h-5 text-risk-elevated" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-risk-low" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-3xl font-bold">
                              {indicator.value.toFixed(2)}{indicator.unit}
                            </p>
                            <p className="text-xs text-muted-foreground">Current Value</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {trend ? 'Rising' : 'Falling'}
                            </Badge>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-3xl font-bold" 
                               style={{ 
                                 color: indicator.risk < 40 ? 'hsl(142, 76%, 36%)' : 
                                        indicator.risk < 60 ? 'hsl(45, 93%, 47%)' : 
                                        'hsl(0, 84%, 60%)'
                               }}>
                              {Math.round(indicator.risk)}
                            </p>
                            <p className="text-xs text-muted-foreground">Risk Score</p>
                            <Badge 
                              variant={indicator.risk < 40 ? 'default' : indicator.risk < 60 ? 'secondary' : 'destructive'}
                              className="text-xs mt-1"
                            >
                              {indicator.risk < 40 ? 'Low Risk' : indicator.risk < 60 ? 'Moderate' : 'High Risk'}
                            </Badge>
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

                        <div className="text-xs text-muted-foreground pt-3 border-t border-border space-y-2">
                          <p className="font-semibold text-foreground">
                            Professional Interpretation:
                          </p>
                          <p className="leading-relaxed">
                            {indicator.risk < 40 
                              ? '✓ Green zone - Favorable conditions. Professionals are constructive on risk assets in this environment.' 
                              : indicator.risk < 60 
                              ? '⚠ Yellow zone - Mixed signals. Pros are monitoring closely but not panicking. Stay diversified.' 
                              : '⚡ Red zone - Elevated stress. Institutional money is defensive. Consider reducing exposure or hedging.'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          )}
          )}
        </Tabs>

        {/* Educational Footer */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                How Professionals Use This Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong>Hedge funds</strong> monitor these exact metrics in real-time via Bloomberg terminals. 
                They use quantitative models to identify regime changes (risk-on vs risk-off).
              </p>
              <p>
                <strong>Institutional investors</strong> compare current readings to historical percentiles. 
                When multiple indicators flash red simultaneously, it's a systemic warning.
              </p>
              <p>
                <strong>Central banks</strong> (Fed, ECB) explicitly reference many of these in policy decisions. 
                Yield curve inversion, credit spreads, and unemployment drive rate decisions.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong>Beginners:</strong> Focus on the category-level scores first (Market, Credit, etc.). 
                Don't get lost in individual metrics. Red categories = reduce risk.
              </p>
              <p>
                <strong>Intermediate:</strong> Learn the "big 5" - VIX, yield curve, credit spreads, unemployment, 
                and fear/greed. These drive 80% of market moves.
              </p>
              <p>
                <strong>Advanced:</strong> Build your own composite indicators. Combine metrics with your own weights. 
                Backtest signals. Remember: no single indicator is perfect.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Data Sources & API Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>Current mode:</strong> Demo data for evaluation. All metrics are realistic but simulated.
            </p>
            <p>
              <strong>Live data:</strong> Go to Settings to add API keys for FRED (Federal Reserve), Alpha Vantage (stocks), 
              Yahoo Finance (crypto), and other sources. Once connected, data updates automatically.
            </p>
            <p>
              <strong>Update frequency:</strong> Most indicators refresh daily. Some (VIX, market data) update every 15 minutes 
              during trading hours. Historical data goes back 30+ years for backtesting.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Indicators;
