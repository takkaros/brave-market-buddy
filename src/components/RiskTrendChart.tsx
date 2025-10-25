import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface RiskTrendChartProps {
  data: Array<{ date: Date; score: number }>;
}

const RiskTrendChart = ({ data }: RiskTrendChartProps) => {
  const chartData = data.map(d => ({
    date: format(d.date, 'MMM dd'),
    score: d.score,
  }));

  return (
    <Card className="glass-card col-span-full">
      <CardHeader>
        <CardTitle>180-Day Risk Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <ReferenceLine y={30} stroke="hsl(var(--risk-safe))" strokeDasharray="3 3" />
            <ReferenceLine y={50} stroke="hsl(var(--risk-moderate))" strokeDasharray="3 3" />
            <ReferenceLine y={70} stroke="hsl(var(--risk-elevated))" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RiskTrendChart;
