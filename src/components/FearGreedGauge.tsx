import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InfoTooltip from './InfoTooltip';

interface FearGreedGaugeProps {
  value: number;
}

const FearGreedGauge = ({ value }: FearGreedGaugeProps) => {
  const getLabel = (val: number) => {
    if (val < 25) return 'Extreme Fear';
    if (val < 45) return 'Fear';
    if (val < 55) return 'Neutral';
    if (val < 75) return 'Greed';
    return 'Extreme Greed';
  };

  const getColor = (val: number) => {
    if (val < 25) return 'hsl(0, 84%, 60%)';
    if (val < 45) return 'hsl(25, 95%, 53%)';
    if (val < 55) return 'hsl(45, 93%, 47%)';
    if (val < 75) return 'hsl(142, 69%, 58%)';
    return 'hsl(142, 76%, 36%)';
  };

  const rotation = (value / 100) * 180 - 90;
  const label = getLabel(value);
  const color = getColor(value);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          Fear & Greed Index
          <InfoTooltip 
            title="Fear & Greed Index"
            content="Measures market sentiment from 0 (Extreme Fear) to 100 (Extreme Greed). When everyone is fearful, it may be time to buy. When everyone is greedy, consider taking profits. Based on volatility, momentum, safe haven demand, and other factors."
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-40 flex items-center justify-center">
          <svg className="w-48 h-24" viewBox="0 0 200 100">
            {/* Background arc */}
            <path
              d="M 20 90 A 80 80 0 0 1 180 90"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Colored segments */}
            <path
              d="M 20 90 A 80 80 0 0 1 52 20"
              fill="none"
              stroke="hsl(0, 84%, 60%)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 52 20 A 80 80 0 0 1 100 10"
              fill="none"
              stroke="hsl(25, 95%, 53%)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 100 10 A 80 80 0 0 1 148 20"
              fill="none"
              stroke="hsl(142, 69%, 58%)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 148 20 A 80 80 0 0 1 180 90"
              fill="none"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            
            {/* Needle */}
            <g transform={`rotate(${rotation} 100 90)`}>
              <line
                x1="100"
                y1="90"
                x2="100"
                y2="30"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="90" r="5" fill={color} />
            </g>
          </svg>
        </div>
        
        <div className="text-center mt-4">
          <div className="text-3xl font-bold mb-1" style={{ color }}>
            {value}
          </div>
          <div className="text-sm font-medium" style={{ color }}>
            {label}
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Extreme Fear (0-25)</span>
            <span className="text-risk-critical">Buy Signal</span>
          </div>
          <div className="flex justify-between">
            <span>Extreme Greed (75-100)</span>
            <span className="text-risk-low">Sell Signal</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FearGreedGauge;
