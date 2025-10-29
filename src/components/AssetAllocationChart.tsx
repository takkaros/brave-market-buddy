import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InfoTooltip from './InfoTooltip';

interface AssetAllocationChartProps {
  riskScore: number;
}

const AssetAllocationChart = ({ riskScore }: AssetAllocationChartProps) => {
  // Adjust allocation based on risk score
  const getAllocation = (score: number) => {
    if (score < 40) {
      // Low risk - aggressive
      return [
        { name: 'Stocks', value: 70, color: 'hsl(var(--chart-1))' },
        { name: 'Bonds', value: 15, color: 'hsl(var(--chart-2))' },
        { name: 'Cash', value: 10, color: 'hsl(var(--chart-3))' },
        { name: 'Crypto', value: 5, color: 'hsl(var(--chart-4))' },
      ];
    } else if (score < 60) {
      // Moderate risk - balanced
      return [
        { name: 'Stocks', value: 50, color: 'hsl(var(--chart-1))' },
        { name: 'Bonds', value: 30, color: 'hsl(var(--chart-2))' },
        { name: 'Cash', value: 15, color: 'hsl(var(--chart-3))' },
        { name: 'Crypto', value: 5, color: 'hsl(var(--chart-4))' },
      ];
    } else {
      // High risk - defensive
      return [
        { name: 'Stocks', value: 30, color: 'hsl(var(--chart-1))' },
        { name: 'Bonds', value: 30, color: 'hsl(var(--chart-2))' },
        { name: 'Cash', value: 30, color: 'hsl(var(--chart-3))' },
        { name: 'Gold', value: 10, color: 'hsl(var(--chart-5))' },
      ];
    }
  };

  const data = getAllocation(riskScore);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          Recommended Allocation
          <InfoTooltip 
            title="Asset Allocation"
            content="Suggested portfolio mix based on current risk levels. Lower risk scores favor stocks (growth), higher scores favor defensive assets (bonds, cash, gold). This is a starting point - adjust based on your age, goals, and risk tolerance."
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
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
                const asset = payload[0];
                return (
                  <div className="glass-card p-3">
                    <p className="font-semibold mb-1">{asset.name}</p>
                    <p className="text-2xl font-bold" style={{ color: asset.payload.color }}>
                      {asset.value}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {asset.name === 'Stocks' && 'Growth-oriented equities for long-term appreciation'}
                      {asset.name === 'Bonds' && 'Fixed income for stability and income'}
                      {asset.name === 'Cash' && 'Liquidity and capital preservation'}
                      {asset.name === 'Crypto' && 'High-risk, high-reward digital assets'}
                      {asset.name === 'Gold' && 'Inflation hedge and safe haven asset'}
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-4 space-y-2 text-sm">
          {data.map((asset) => (
            <div key={asset.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: asset.color }}
                />
                <span>{asset.name}</span>
              </div>
              <span className="font-medium">{asset.value}%</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
          <p>
            <strong>Risk Score: {riskScore}</strong> - {
              riskScore < 40 ? 'Market conditions favor growth assets' :
              riskScore < 60 ? 'Balanced approach recommended' :
              'Defensive positioning suggested'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetAllocationChart;
