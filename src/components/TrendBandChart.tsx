import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateMA, calculateEMA } from '@/utils/macroCalculations';

interface TrendBandChartProps {
  asset: string;
}

export function TrendBandChart({ asset }: TrendBandChartProps) {
  // Generate mock weekly price data (last 5 years to current)
  const generateData = () => {
    const data = [];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 5);
    const basePrice = asset === 'BTC' ? 20000 : 1000;
    const currentPrice = asset === 'BTC' ? 95000 : 3500;
    
    // Generate weekly data points
    const weeks = 260; // ~5 years
    const prices: number[] = [];
    
    for (let i = 0; i < weeks; i++) {
      const progress = i / weeks;
      const trend = basePrice + (currentPrice - basePrice) * progress;
      const volatility = trend * 0.15 * Math.sin(i * 0.1) + (Math.random() - 0.5) * trend * 0.1;
      prices.push(trend + volatility);
    }
    
    // Calculate moving averages
    const ma200 = calculateMA(prices, 200);
    const ma20 = calculateMA(prices, 20);
    const ema21 = calculateEMA(prices, 21);
    
    for (let i = 0; i < weeks; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i * 7));
      
      // Bull Support Band is the area between 20-week SMA and 21-week EMA
      const bullSupportUpper = ma20[i];
      const bullSupportLower = ema21[i];
      
      data.push({
        date: date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' }),
        price: Math.round(prices[i]),
        ma200: Math.round(ma200[i]),
        ma20: Math.round(ma20[i]),
        ema21: Math.round(ema21[i]),
      });
    }
    
    // Update last value to current with today's date
    const today = new Date();
    data[data.length - 1].date = today.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
    data[data.length - 1].price = currentPrice;
    
    return data;
  };

  const data = generateData();

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground mb-1">Trend Band Analysis</h3>
        <p className="text-sm text-muted-foreground">
          200-Week MA (structural trend) & Bull Support Band (20w SMA + 21w EMA) • Mock historical data
        </p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
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
          <Line 
            type="monotone" 
            dataKey="ma200" 
            stroke="#8b5cf6" 
            strokeWidth={3} 
            dot={false} 
            name="200-Week MA"
          />
          <Line 
            type="monotone" 
            dataKey="ma20" 
            stroke="#10b981" 
            strokeWidth={2} 
            strokeDasharray="5 5"
            dot={false} 
            name="20w SMA (Bull Support Upper)"
          />
          <Line 
            type="monotone" 
            dataKey="ema21" 
            stroke="#059669" 
            strokeWidth={2} 
            strokeDasharray="5 5"
            dot={false} 
            name="21w EMA (Bull Support Lower)"
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3} 
            dot={false} 
            name="Price"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Legend Explanation */}
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">🟣 200-Week MA:</strong> Primary structural trend indicator. 
          Price above = bull market, below = bear market.
        </p>
        <p>
          <strong className="text-foreground">🟢 Bull Support Band:</strong> Zone between 20w SMA (upper) and 21w EMA (lower). 
          Historically, price tends to bounce from this zone during bull markets.
        </p>
      </div>
    </Card>
  );
}
