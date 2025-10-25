import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, AlertCircle, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface ForecastPoint {
  day: number;
  score: number;
  confidence80Lower: number;
  confidence80Upper: number;
  confidence95Lower: number;
  confidence95Upper: number;
}

interface Scenario {
  description: string;
  day7Score: number;
  probability: string;
}

interface RiskForecastData {
  forecast: ForecastPoint[];
  scenarios: {
    bull: Scenario;
    base: Scenario;
    bear: Scenario;
  };
  interpretation: string;
  keyRiskFactors: string[];
  catalysts: {
    upside: string[];
    downside: string[];
  };
}

interface Props {
  forecast: RiskForecastData | null;
  loading: boolean;
}

const RiskForecast = ({ forecast, loading }: Props) => {
  if (loading) {
    return (
      <Card className="glass-card col-span-full">
        <CardHeader>
          <CardTitle>7-Day Risk Forecast</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!forecast) {
    return (
      <Card className="glass-card col-span-full">
        <CardHeader>
          <CardTitle>7-Day Risk Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No forecast available. Refresh to load data.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = forecast.forecast.map(f => ({
    day: `Day ${f.day}`,
    score: f.score,
    lower80: f.confidence80Lower,
    upper80: f.confidence80Upper,
    lower95: f.confidence95Lower,
    upper95: f.confidence95Upper,
  }));

  return (
    <Card className="glass-card col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">AI-Powered 7-Day Risk Forecast</CardTitle>
          <Badge variant="outline">
            <Shield className="w-3 h-3 mr-1" />
            Predictive Model
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Interpretation */}
        <div className="bg-primary/5 border-l-4 border-primary p-4 rounded">
          <p className="text-sm font-semibold mb-2">Forecast Analysis:</p>
          <p className="text-muted-foreground">{forecast.interpretation}</p>
        </div>

        {/* Forecast Chart */}
        <Tabs defaultValue="80" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="80">80% Confidence Band</TabsTrigger>
            <TabsTrigger value="95">95% Confidence Band</TabsTrigger>
          </TabsList>
          
          <TabsContent value="80">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="upper80"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                />
                <Area
                  type="monotone"
                  dataKey="lower80"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="95">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="upper95"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.15)"
                />
                <Area
                  type="monotone"
                  dataKey="lower95"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.15)"
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        {/* Scenarios */}
        <div>
          <h4 className="font-semibold text-base mb-3">Scenario Analysis</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-risk-low/10 border border-risk-low rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-risk-low">Bull Case</h5>
                <Badge className="bg-risk-low text-white">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {forecast.scenarios.bull.probability}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{forecast.scenarios.bull.description}</p>
              <p className="text-sm">Day 7: <span className="font-bold">{forecast.scenarios.bull.day7Score}</span></p>
            </div>

            <div className="p-4 bg-primary/5 border border-primary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold">Base Case</h5>
                <Badge variant="default">{forecast.scenarios.base.probability}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{forecast.scenarios.base.description}</p>
              <p className="text-sm">Day 7: <span className="font-bold">{forecast.scenarios.base.day7Score}</span></p>
            </div>

            <div className="p-4 bg-risk-elevated/10 border border-risk-elevated rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-risk-elevated">Bear Case</h5>
                <Badge className="bg-risk-elevated text-white">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  {forecast.scenarios.bear.probability}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{forecast.scenarios.bear.description}</p>
              <p className="text-sm">Day 7: <span className="font-bold">{forecast.scenarios.bear.day7Score}</span></p>
            </div>
          </div>
        </div>

        {/* Risk Factors and Catalysts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-base mb-2 flex items-center gap-2 text-risk-elevated">
              <AlertCircle className="w-4 h-4" />
              Key Risk Factors
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {forecast.keyRiskFactors.map((factor, i) => (
                <li key={i}>• {factor}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <div>
              <h5 className="font-semibold text-sm mb-1 text-risk-low">Upside Catalysts</h5>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {forecast.catalysts.upside.map((cat, i) => (
                  <li key={i}>+ {cat}</li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-sm mb-1 text-risk-elevated">Downside Catalysts</h5>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {forecast.catalysts.downside.map((cat, i) => (
                  <li key={i}>− {cat}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskForecast;
