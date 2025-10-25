import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navigation from '@/components/Navigation';
import InfoTooltip from '@/components/InfoTooltip';
import { Coins } from 'lucide-react';

const Metals = () => {
  const goldPrice = 2050;
  const silverPrice = 24.5;
  
  const history = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    gold: goldPrice + (Math.random() - 0.5) * 100,
    silver: silverPrice + (Math.random() - 0.5) * 2,
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Precious Metals Analysis</h1>
          <p className="text-muted-foreground">Gold, silver, and inflation hedge analysis</p>
        </div>

        <Navigation />

        <Card className="glass-card border-l-4 border-risk-moderate">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2 text-risk-moderate">REDUCE / NEUTRAL</h3>
                <p className="text-sm text-muted-foreground">Gold at ${goldPrice} - defensive positioning less needed as risk declines</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Score</p>
                <p className="text-4xl font-bold text-risk-moderate">5.0/10</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Gold Price
                <InfoTooltip content="Gold is a hedge against inflation and crisis. Buy when real yields are negative. Below $1800 = buy, above $2200 = sell." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${goldPrice}</p>
              <p className="text-sm text-muted-foreground mt-1">Near recent highs</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Silver Price
                <InfoTooltip content="Silver is more volatile than gold. Industrial use makes it cyclical. Gold/Silver ratio above 80 = silver undervalued." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${silverPrice}</p>
              <p className="text-sm text-muted-foreground mt-1">Lagging gold</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                Gold/Silver Ratio
                <InfoTooltip content="How many ounces of silver to buy 1 oz gold. Above 80 = silver cheap. Below 60 = silver expensive." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{(goldPrice / silverPrice).toFixed(0)}</p>
              <p className="text-sm text-risk-low mt-1">Silver undervalued</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              Price History (30 Days)
              <InfoTooltip content="Gold and silver price trends. Precious metals shine during crises and inflation." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="gold" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Gold" />
                <Line type="monotone" dataKey="silver" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Silver" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Precious Metals Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p><strong>When to Buy:</strong> Real yields negative, inflation rising, geopolitical crisis, stock market crash</p>
            <p><strong>When to Sell:</strong> Real yields above 2%, Fed pivoting dovish, risk assets rallying</p>
            <p><strong>Allocation:</strong> 5-10% in normal times, 15-20% in crisis. Physical gold coins/bars or GLD/SLV ETFs.</p>
            <p className="text-foreground"><strong>Current Recommendation:</strong> Trim gold from 15% → 8%. Risk declining, stocks more attractive.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Metals;
