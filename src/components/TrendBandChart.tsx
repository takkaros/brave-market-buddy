import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateMA, calculateEMA } from '@/utils/macroCalculations';

interface TrendBandChartProps {
  asset: string;
  historicalData?: Array<{ time: number; price: number }>;
  currentPrice?: number;
}

export function TrendBandChart({ asset, historicalData, currentPrice }: TrendBandChartProps) {
  // Use real historical data to calculate moving averages
  const generateData = () => {
    if (!historicalData || historicalData.length === 0) {
      return [];
    }

    const prices = historicalData.map(p => p.price);
    
    // Calculate moving averages - need enough data points
    const ma200 = calculateMA(prices, Math.min(200, prices.length));
    const ma20 = calculateMA(prices, Math.min(20, prices.length));
    const ema21 = calculateEMA(prices, Math.min(21, prices.length));
    
    return historicalData.map((point, i) => {
      const date = new Date(point.time);
      return {
        date: date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' }),
        price: Math.round(point.price),
        ma200: Math.round(ma200[i] || point.price),
        ma20: Math.round(ma20[i] || point.price),
        ema21: Math.round(ema21[i] || point.price),
      };
    });
  };

  const data = generateData();

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground mb-1">Trend Band Analysis</h3>
        <p className="text-sm text-muted-foreground">
          200-Week MA (structural trend) & Bull Support Band (20w SMA + 21w EMA) • Real data from Binance
        </p>
      </div>
      {data.length === 0 ? (
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          Loading historical data...
        </div>
      ) : (
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
      )}
      
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
