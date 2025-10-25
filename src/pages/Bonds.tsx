import { generateMockData } from '@/utils/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navigation from '@/components/Navigation';
import InfoTooltip from '@/components/InfoTooltip';
import { CreditCard } from 'lucide-react';

const Bonds = () => {
  const mockData = generateMockData('bottom');
  const yield10Y = 4.5;
  const yield2Y = 4.8;
  const yieldCurve = mockData.yieldCurve10y2y;
  
  const yieldHistory = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    y10: yield10Y + (Math.random() - 0.5) * 0.3,
    y2: yield2Y + (Math.random() - 0.5) * 0.3,
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Bond Market Analysis</h1>
          <p className="text-muted-foreground">Treasury yields, yield curve, and fixed income opportunities</p>
        </div>

        <Navigation />

        <Card className="glass-card border-l-4 border-risk-low">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2 text-risk-low">ATTRACTIVE</h3>
                <p className="text-sm text-muted-foreground">10Y Treasury at {yield10Y}% - good risk-free returns</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Score</p>
                <p className="text-4xl font-bold text-risk-low">7.5/10</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                10-Year Treasury
                <InfoTooltip content="Benchmark U.S. government bond yield. Above 4% = attractive for conservative investors. Risk-free rate." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{yield10Y}%</p>
              <p className="text-sm text-risk-low mt-1">Attractive level</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                2-Year Treasury
                <InfoTooltip content="Short-term government bond. Reflects Fed policy expectations. Inverted curve = recession warning." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{yield2Y}%</p>
              <p className="text-sm text-muted-foreground mt-1">Fed policy driven</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Yield Curve (10Y-2Y)
                <InfoTooltip content="Difference between long and short rates. Negative = inverted = recession likely within 12-18 months." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{yieldCurve.toFixed(2)}%</p>
              <p className={`text-sm mt-1 ${yieldCurve < 0 ? 'text-risk-elevated' : 'text-risk-low'}`}>
                {yieldCurve < 0 ? 'Inverted (warning)' : 'Normalizing'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              Yield Curve (30 Days)
              <InfoTooltip content="Track the yield curve. Steepening = economic recovery. Flattening/inversion = slowdown." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yieldHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="y10" stroke="hsl(var(--chart-1))" strokeWidth={2} name="10Y" />
                <Line type="monotone" dataKey="y2" stroke="hsl(var(--chart-2))" strokeWidth={2} name="2Y" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Bond Investment Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p><strong>Current Opportunity:</strong> 10Y at {yield10Y}% is attractive vs historical 2-3% levels. Lock in rates before Fed cuts.</p>
            <p><strong>Allocation:</strong> 20-30% bonds for balanced portfolios. Use Treasury ladders or bond ETFs (AGG, BND).</p>
            <p><strong>Strategy:</strong> Buy intermediate-term (5-10Y) treasuries now. As Fed cuts rates, bond prices will rise.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Bonds;
