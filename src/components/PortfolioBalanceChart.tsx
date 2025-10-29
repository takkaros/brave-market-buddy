import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';

interface PortfolioBalanceChartProps {
  holdings: Array<{
    value_usd: number;
    last_updated_at: string;
    purchase_price_usd?: number;
    amount: number;
  }>;
  totalValue: number;
  totalCost: number;
}

type TimePeriod = '1D' | '1W' | '1M' | '1Y' | 'ALL';

const PortfolioBalanceChart = ({ holdings, totalValue, totalCost }: PortfolioBalanceChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1Y');

  // Calculate P&L
  const pnl = totalValue - totalCost;
  const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

  // Generate mock historical data (in real app, this would come from your database)
  const generateHistoricalData = (period: TimePeriod) => {
    const now = new Date();
    const dataPoints: Array<{ date: Date; value: number }> = [];
    
    let days: number;
    switch (period) {
      case '1D':
        days = 1;
        break;
      case '1W':
        days = 7;
        break;
      case '1M':
        days = 30;
        break;
      case '1Y':
        days = 365;
        break;
      case 'ALL':
        days = 730; // 2 years
        break;
      default:
        days = 365;
    }

    const startValue = totalCost || totalValue * 0.7;
    const endValue = totalValue;
    
    for (let i = 0; i <= days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - i));
      
      // Generate a growth curve with some volatility
      const progress = i / days;
      const baseValue = startValue + (endValue - startValue) * progress;
      const volatility = baseValue * 0.1 * Math.sin(i * 0.3) * Math.random();
      const value = baseValue + volatility;
      
      dataPoints.push({
        date,
        value: Math.max(value, startValue * 0.8)
      });
    }
    
    return dataPoints;
  };

  const chartData = generateHistoricalData(selectedPeriod);

  const formatXAxis = (date: Date) => {
    switch (selectedPeriod) {
      case '1D':
        return format(date, 'HH:mm');
      case '1W':
        return format(date, 'EEE');
      case '1M':
        return format(date, 'MMM d');
      case '1Y':
      case 'ALL':
        return format(date, 'MMM yy');
      default:
        return format(date, 'MMM d');
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm text-muted-foreground font-normal mb-2">
              Portfolio balance
            </CardTitle>
            <p className="text-4xl font-bold">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className={`flex items-center gap-1 mt-2 ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <span className="text-sm">
                {pnl >= 0 ? '↗' : '↘'} {pnlPercent.toFixed(1)}%
              </span>
              <span className="text-sm">
                ({pnl >= 0 ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            {(['1D', '1W', '1M', '1Y', 'ALL'] as TimePeriod[]).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className={selectedPeriod === period ? 'bg-primary/20' : ''}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                padding: '12px',
                backdropFilter: 'blur(12px)',
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      ${Number(data.value).toLocaleString(undefined, { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(data.date, 'M/d/yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(data.date, 'h:mm a')}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PortfolioBalanceChart;
