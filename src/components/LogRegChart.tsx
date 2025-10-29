import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { generateLogRegBands } from '@/utils/macroCalculations';

interface LogRegChartProps {
  asset: string;
}

export function LogRegChart({ asset }: LogRegChartProps) {
  const bands = generateLogRegBands(asset);
  
  // Generate mock historical data with log scale
  const generateData = () => {
    const data = [];
    const startDate = new Date('2020-01-01');
    const currentPrice = asset === 'BTC' ? 95000 : 3500;
    
    for (let i = 0; i < 60; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      
      // Generate price with some volatility around fair value
      const progress = i / 60;
      const noise = Math.sin(i * 0.5) * 0.3 + (Math.random() - 0.5) * 0.2;
      const price = bands.fair * (0.5 + progress + noise);
      
      data.push({
        date: date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' }),
        price: Math.round(price),
        fair: Math.round(bands.fair),
        upper1: Math.round(bands.upper1),
        upper2: Math.round(bands.upper2),
        lower1: Math.round(bands.lower1),
        lower2: Math.round(bands.lower2),
      });
    }
    
    // Update last value to current
    data[data.length - 1].price = currentPrice;
    
    return data;
  };

  const data = generateData();

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground mb-1">Logarithmic Regression Channel</h3>
        <p className="text-sm text-muted-foreground">
          Fair value bands (±1σ, ±2σ) showing historical price extremes
        </p>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            scale="log"
            domain={['auto', 'auto']}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))'
            }}
            formatter={(value: any) => `$${value.toLocaleString()}`}
          />
          <Legend />
          <Line type="monotone" dataKey="upper2" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" dot={false} name="+2σ (High)" />
          <Line type="monotone" dataKey="upper1" stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" dot={false} name="+1σ (Moderate)" />
          <Line type="monotone" dataKey="fair" stroke="#3b82f6" strokeWidth={2} dot={false} name="Fair Value" />
          <Line type="monotone" dataKey="lower1" stroke="#10b981" strokeWidth={1} strokeDasharray="3 3" dot={false} name="-1σ (Moderate)" />
          <Line type="monotone" dataKey="lower2" stroke="#059669" strokeWidth={1} strokeDasharray="5 5" dot={false} name="-2σ (High)" />
          <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} name="Price" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
