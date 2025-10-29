import { Card } from '@/components/ui/card';
import { getCycleProgress } from '@/utils/macroCalculations';

interface CycleTimelineProps {
  asset: string;
}

export function CycleTimeline({ asset }: CycleTimelineProps) {
  const cycleInfo = getCycleProgress();
  
  const halvingEvents = [
    { date: '2012-11-28', block: 210000, reward: '25 BTC' },
    { date: '2016-07-09', block: 420000, reward: '12.5 BTC' },
    { date: '2020-05-11', block: 630000, reward: '6.25 BTC' },
    { date: '2024-04-20', block: 840000, reward: '3.125 BTC' },
    { date: '2028-04-15', block: 1050000, reward: '1.5625 BTC', future: true },
  ];

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-1">Bitcoin Halving Cycle Timeline</h3>
        <p className="text-sm text-muted-foreground">
          ~4-year cycles marked by block reward reductions • Current progress: {cycleInfo.percentComplete}%
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="relative w-full h-8 bg-muted rounded-lg overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-500"
            style={{ width: `${cycleInfo.percentComplete}%` }}
          />
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <span className="text-sm font-bold text-foreground mix-blend-difference">
              {cycleInfo.daysSinceHalving} days / ~1,460 days
            </span>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Halving</span>
          <span>Mid-Cycle</span>
          <span>Next Halving</span>
        </div>
      </div>

      {/* Halving Events Timeline */}
      <div className="space-y-4">
        {halvingEvents.map((event, idx) => {
          const isPast = new Date(event.date) < new Date();
          const isCurrent = idx === cycleInfo.currentCycle;
          
          return (
            <div 
              key={idx} 
              className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                isCurrent 
                  ? 'border-primary bg-primary/5' 
                  : isPast 
                    ? 'border-border bg-muted/30' 
                    : 'border-dashed border-border bg-background'
              }`}
            >
              <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${
                isCurrent 
                  ? 'bg-primary animate-pulse' 
                  : isPast 
                    ? 'bg-muted-foreground' 
                    : 'bg-border'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">
                    Halving #{idx + 1}
                    {isCurrent && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Current</span>}
                    {event.future && <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Projected</span>}
                  </h4>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>📅 {event.date}</span>
                  <span>🔗 Block {event.block.toLocaleString()}</span>
                  <span>💰 Reward: {event.reward}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">ℹ️ About Halvings:</strong> Every ~210,000 blocks (~4 years), 
          the Bitcoin mining reward is cut in half, reducing new supply. Historically, this has preceded 
          major bull runs as demand outpaces the reduced supply flow.
        </p>
      </div>
    </Card>
  );
}
