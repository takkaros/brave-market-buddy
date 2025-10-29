import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DCACalculator() {
  const [amount, setAmount] = useState('100');
  const [frequency, setFrequency] = useState('weekly');
  const [duration, setDuration] = useState('12');
  const [avgPrice, setAvgPrice] = useState('50000');
  const [currentPrice, setCurrentPrice] = useState('95000');

  const calculateDCA = () => {
    const monthlyAmount = parseFloat(amount);
    const months = parseFloat(duration);
    const avg = parseFloat(avgPrice);
    const current = parseFloat(currentPrice);
    
    const multiplier = frequency === 'weekly' ? 4.33 : frequency === 'daily' ? 30 : 1;
    const totalInvested = monthlyAmount * multiplier * months;
    const totalCoins = totalInvested / avg;
    const currentValue = totalCoins * current;
    const profit = currentValue - totalInvested;
    const profitPercent = ((profit / totalInvested) * 100).toFixed(2);
    
    return {
      totalInvested,
      totalCoins: totalCoins.toFixed(4),
      currentValue,
      profit,
      profitPercent,
    };
  };

  const generateChart = () => {
    const months = parseInt(duration);
    const data = [];
    for (let i = 0; i <= months; i++) {
      const invested = (parseFloat(amount) * (frequency === 'weekly' ? 4.33 : frequency === 'daily' ? 30 : 1)) * i;
      data.push({
        month: i,
        invested: invested,
        value: invested * (parseFloat(currentPrice) / parseFloat(avgPrice)),
      });
    }
    return data;
  };

  const results = calculateDCA();
  const chartData = generateChart();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Dollar-Cost Averaging (DCA) Calculator
        </CardTitle>
        <CardDescription>
          Calculate returns from consistent periodic investments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Investment Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (months)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avgPrice">Avg Purchase Price ($)</Label>
            <Input
              id="avgPrice"
              type="number"
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              placeholder="50000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentPrice">Current Price ($)</Label>
            <Input
              id="currentPrice"
              type="number"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              placeholder="95000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
            <p className="text-xl font-bold text-foreground">
              ${results.totalInvested.toLocaleString()}
            </p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Coins Acquired</p>
            <p className="text-xl font-bold text-foreground">{results.totalCoins}</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Current Value</p>
            <p className="text-xl font-bold text-foreground">
              ${results.currentValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Profit</p>
            <p className={`text-xl font-bold ${results.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${results.profit.toLocaleString()} ({results.profitPercent}%)
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any) => `$${value.toLocaleString()}`}
            />
            <Line type="monotone" dataKey="invested" stroke="#3b82f6" strokeWidth={2} name="Invested" />
            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} name="Value" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
