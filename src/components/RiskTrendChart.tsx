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
                borderRadius: '12px',
                padding: '12px',
                backdropFilter: 'blur(12px)',
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const score = payload[0].value as number;
                const getRiskLevel = (s: number) => {
                  if (s < 30) return { level: 'LOW', color: 'hsl(var(--risk-safe))' };
                  if (s < 50) return { level: 'MODERATE', color: 'hsl(var(--risk-moderate))' };
                  if (s < 70) return { level: 'ELEVATED', color: 'hsl(var(--risk-elevated))' };
                  return { level: 'HIGH', color: 'hsl(var(--risk-high))' };
                };
                const risk = getRiskLevel(score);
                return (
                  <div className="glass-card p-3">
                    <p className="font-semibold text-xs text-muted-foreground mb-1">
                      {payload[0].payload.date}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: risk.color }}>
                      {score.toFixed(1)}
                    </p>
                    <p className="text-xs font-medium mt-1" style={{ color: risk.color }}>
                      {risk.level} RISK
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {score < 30 && 'Market conditions favorable for growth'}
                      {score >= 30 && score < 50 && 'Balanced risk-reward environment'}
                      {score >= 50 && score < 70 && 'Elevated risk - consider defensive positioning'}
                      {score >= 70 && 'High risk - prioritize capital preservation'}
                    </p>
                  </div>
                );
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
