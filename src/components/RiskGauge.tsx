import { useEffect, useState } from 'react';
import { getRiskLevel, getRiskColor } from '@/utils/riskCalculator';
import { getRiskColorValue } from '@/utils/riskColors';

interface RiskGaugeProps {
  score: number;
  previousScore?: number;
}

const RiskGauge = ({ score, previousScore }: RiskGaugeProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const level = getRiskLevel(score);
  const colorClass = getRiskColor(score);
  const colorValue = getRiskColorValue(score);
  const rotation = (score / 100) * 180 - 90;
  const trend = previousScore ? score - previousScore : 0;

  return (
    <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Economic Risk Score</h2>
          {previousScore && (
            <div className={`flex items-center gap-2 text-sm ${trend > 0 ? 'text-risk-elevated' : 'text-risk-low'}`}>
              <span>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)} pts</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="relative w-64 h-64">
            {/* Background arc */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
                strokeDasharray="125.6 251.2"
                strokeLinecap="round"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={colorValue}
                strokeWidth="8"
                strokeDasharray={`${(animatedScore / 100) * 125.6} 251.2`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Center display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-6xl font-bold transition-smooth" style={{ color: colorValue }}>
                {animatedScore}
              </div>
              <div className="text-sm text-muted-foreground mt-2">out of 100</div>
              <div 
                className="mt-4 px-4 py-1 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: `${colorValue}20`,
                  color: colorValue
                }}
              >
                {level} RISK
              </div>
            </div>

            {/* Needle */}
            <div
              className="absolute top-1/2 left-1/2 w-1 h-24 bg-foreground origin-bottom transition-transform duration-1000 ease-out"
              style={{
                transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
              }}
            >
              <div className="absolute top-0 left-1/2 w-3 h-3 rounded-full bg-foreground -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-risk-safe" />
            <span>Safe (0-30)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-risk-moderate" />
            <span>Moderate (30-50)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-risk-elevated" />
            <span>Elevated (50-70)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-risk-critical" />
            <span>High (70+)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskGauge;
