import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, Target, Clock, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface OverallAnalysis {
  overallSignal: string;
  overallScore: number;
  marketRegime: string;
  assetClassRankings: {
    mostAttractive: string[];
    leastAttractive: string[];
  };
  portfolioAllocation: {
    stocks: string;
    bonds: string;
    crypto: string;
    metals: string;
    cash: string;
    realEstate: string;
  };
  keyOpportunities: string[];
  majorRisks: string[];
  tacticalMoves: string[];
  timeHorizon: string;
  confidenceLevel: string;
  bottomLine: string;
}

interface Props {
  analysis: OverallAnalysis | null;
  loading: boolean;
}

const OverallMarketAnalysis = ({ analysis, loading }: Props) => {
  if (loading) {
    return (
      <Card className="glass-card col-span-full">
        <CardHeader>
          <CardTitle>Overall Market Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="glass-card col-span-full">
        <CardHeader>
          <CardTitle>Overall Market Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No analysis available. Refresh to load data.</p>
        </CardContent>
      </Card>
    );
  }

  const signalColor = 
    analysis.overallSignal === 'RISK ON' ? 'hsl(142, 76%, 36%)' :
    analysis.overallSignal === 'BALANCED' ? 'hsl(45, 93%, 47%)' :
    analysis.overallSignal === 'RISK OFF' ? 'hsl(30, 80%, 55%)' :
    'hsl(0, 84%, 60%)';

  return (
    <Card className="glass-card col-span-full border-l-4" style={{ borderLeftColor: signalColor }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">AI-Powered Overall Market Analysis</CardTitle>
          <Badge variant="outline" className="text-sm">
            <Shield className="w-3 h-3 mr-1" />
            {analysis.confidenceLevel} Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Signal */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: signalColor }}>
              {analysis.overallSignal}
            </h3>
            <p className="text-sm text-muted-foreground">
              Market Score: {analysis.overallScore}/10
            </p>
          </div>
          <div className="text-right">
            <Badge className="text-sm" style={{ backgroundColor: signalColor }}>
              <Clock className="w-3 h-3 mr-1" />
              {analysis.timeHorizon.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Market Regime */}
        <div>
          <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Current Market Environment
          </h4>
          <p className="text-muted-foreground leading-relaxed">{analysis.marketRegime}</p>
        </div>

        {/* Portfolio Allocation */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Recommended Portfolio Allocation
            </h4>
            <div className="space-y-2">
              {Object.entries(analysis.portfolioAllocation).map(([asset, percent]) => (
                <div key={asset} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{asset}:</span>
                  <span className="font-semibold">{percent}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-base mb-3">Asset Class Rankings</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Most Attractive:</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.assetClassRankings.mostAttractive.map((asset) => (
                    <Badge key={asset} variant="default" className="text-xs">
                      {asset}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Least Attractive:</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.assetClassRankings.leastAttractive.map((asset) => (
                    <Badge key={asset} variant="destructive" className="text-xs">
                      {asset}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Opportunities and Risks */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-base mb-2 text-risk-low">Key Opportunities</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {analysis.keyOpportunities.map((opp, i) => (
                <li key={i}>• {opp}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-base mb-2 text-risk-elevated flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Major Risks
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {analysis.majorRisks.map((risk, i) => (
                <li key={i}>• {risk}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tactical Moves */}
        <div>
          <h4 className="font-semibold text-base mb-2">Tactical Actions to Consider</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {analysis.tacticalMoves.map((move, i) => (
              <li key={i}>✓ {move}</li>
            ))}
          </ul>
        </div>

        {/* Bottom Line */}
        <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
          <p className="font-semibold mb-2">Bottom Line:</p>
          <p className="text-muted-foreground">{analysis.bottomLine}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverallMarketAnalysis;
