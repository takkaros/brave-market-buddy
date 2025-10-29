import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { calculateRiskMetric } from '@/utils/macroCalculations';

interface RiskHeatmapProps {
  asset: string;
  historicalData?: Array<{ time: number; price: number }>;
}

export function RiskHeatmap({ asset, historicalData }: RiskHeatmapProps) {
  // Calculate risk from real historical data
  const generateRiskData = () => {
    if (!historicalData || historicalData.length === 0) {
      return [];
    }

    return historicalData.map(point => {
      const date = new Date(point.time);
      const risk = calculateRiskMetric(asset, point.price);
      
      return {
        date: date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' }),
        risk: risk,
      };
    });
  };

  const data = generateRiskData();

  const getRiskColor = (risk: number) => {
    if (risk < 30) return '#10b981'; // green
    if (risk < 50) return '#f59e0b'; // yellow
    if (risk < 70) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground mb-1">Risk Metric History</h3>
        <p className="text-sm text-muted-foreground">
          Time-series visualization: 🟢 Low → 🟡 Moderate → 🟠 Elevated → 🔴 High • Real data from Binance
        </p>
      </div>
      {data.length === 0 ? (
        <div className="h-[350px] flex items-center justify-center text-muted-foreground">
          Loading historical data...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="30%" stopColor="#f97316" stopOpacity={0.6} />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            domain={[0, 100]}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))'
            }}
            formatter={(value: any) => {
              const risk = Number(value);
              let label = '';
              if (risk < 30) label = '🟢 Low Risk';
              else if (risk < 50) label = '🟡 Moderate Risk';
              else if (risk < 70) label = '🟠 Elevated Risk';
              else label = '🔴 High Risk';
              return [`${value}/100 - ${label}`, 'Risk'];
            }}
          />
          <Area 
            type="monotone" 
            dataKey="risk" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            fill="url(#riskGradient)"
          />
          {/* Reference lines for risk zones */}
          <Line y={30} stroke="#10b981" strokeDasharray="5 5" />
          <Line y={50} stroke="#f59e0b" strokeDasharray="5 5" />
          <Line y={70} stroke="#ef4444" strokeDasharray="5 5" />
        </AreaChart>
      </ResponsiveContainer>
      )}
      <div className="flex justify-around mt-4 text-xs text-muted-foreground">
        <span>🟢 0-30: Low Risk</span>
        <span>🟡 30-50: Moderate</span>
        <span>🟠 50-70: Elevated</span>
        <span>🔴 70-100: High</span>
      </div>
    </Card>
  );
}
