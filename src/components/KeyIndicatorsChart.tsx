import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InfoTooltip from './InfoTooltip';

interface KeyIndicatorsChartProps {
  indicators: {
    vix: number;
    yieldCurve10y2y: number;
    unemploymentRate: number;
    fearGreedIndex: number;
  };
}

const KeyIndicatorsChart = ({ indicators }: KeyIndicatorsChartProps) => {
  const navigate = useNavigate();

  const data = [
    { 
      name: 'VIX', 
      value: indicators.vix,
      normal: 15,
      info: 'Volatility Index - measures market fear. Above 20 = elevated fear.'
    },
    { 
      name: 'Yield Curve', 
      value: indicators.yieldCurve10y2y * 10 + 10,
      normal: 10,
      info: '10Y-2Y spread. Negative = recession warning.'
    },
    { 
      name: 'Unemployment', 
      value: indicators.unemploymentRate,
      normal: 4,
      info: 'Unemployment rate. Rising = economic weakness.'
    },
    { 
      name: 'Fear/Greed', 
      value: indicators.fearGreedIndex,
      normal: 50,
      info: 'Market sentiment. Low = buy opportunity, High = take profits.'
    },
  ];

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            Key Market Indicators
            <InfoTooltip 
              content="Quick snapshot of the most important economic signals. Green bars = favorable, red bars = warning signs. Click 'View All' for detailed analysis."
            />
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/indicators')}
            className="gap-1"
          >
            <TrendingUp className="w-4 h-4" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass-card p-3 text-sm">
                      <p className="font-semibold mb-1">{data.name}</p>
                      <p className="text-muted-foreground mb-2">{data.info}</p>
                      <p>Value: <strong>{payload[0].value}</strong></p>
                      <p>Normal: {data.normal}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={20} stroke="hsl(var(--muted))" strokeDasharray="3 3" />
            <Bar 
              dataKey="value" 
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default KeyIndicatorsChart;
