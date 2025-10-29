import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Flame, TrendingUp, Calendar, DollarSign, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface FIREResult {
  targetAmount: number;
  monthsToFIRE: number;
  yearsToFIRE: number;
  retirementDate: Date;
  projectionData: any[];
  safeWithdrawalRate: number;
}

export default function FIRECalculator() {
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [monthlyIncome, setMonthlyIncome] = useState(5000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(3000);
  const [annualReturn, setAnnualReturn] = useState(8);
  const [withdrawalRate, setWithdrawalRate] = useState(4);
  const [result, setResult] = useState<FIREResult | null>(null);

  const calculateFIRE = () => {
    // Calculate annual expenses
    const annualExpenses = monthlyExpenses * 12;
    
    // Calculate FIRE number (25x or 30x annual expenses based on withdrawal rate)
    const fireMultiplier = 100 / withdrawalRate;
    const targetAmount = annualExpenses * fireMultiplier;
    
    // Calculate monthly savings
    const monthlySavings = monthlyIncome - monthlyExpenses;
    
    // Project portfolio growth with monthly contributions
    const monthlyReturnRate = Math.pow(1 + annualReturn / 100, 1/12) - 1;
    
    let portfolioValue = currentSavings;
    let months = 0;
    const projectionData = [];
    const maxMonths = 600; // 50 years max
    
    while (portfolioValue < targetAmount && months < maxMonths) {
      // Add this month's savings
      portfolioValue += monthlySavings;
      
      // Apply compound interest
      portfolioValue *= (1 + monthlyReturnRate);
      
      // Track progress every 12 months
      if (months % 12 === 0) {
        projectionData.push({
          year: months / 12,
          portfolio: portfolioValue,
          target: targetAmount,
        });
      }
      
      months++;
    }
    
    const years = months / 12;
    const retirementDate = new Date();
    retirementDate.setMonth(retirementDate.getMonth() + months);
    
    setResult({
      targetAmount,
      monthsToFIRE: months,
      yearsToFIRE: years,
      retirementDate,
      projectionData,
      safeWithdrawalRate: withdrawalRate,
    });
  };

  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0;
  const fireType = withdrawalRate <= 3.5 ? 'Fat FIRE' : withdrawalRate <= 4 ? 'Traditional FIRE' : 'Lean FIRE';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          FIRE Calculator
        </CardTitle>
        <CardDescription>
          Calculate your path to Financial Independence & Early Retirement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="current-savings">Current Portfolio Value (€)</Label>
            <Input
              id="current-savings"
              type="number"
              value={currentSavings}
              onChange={(e) => setCurrentSavings(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly-income">Monthly Income (€)</Label>
            <Input
              id="monthly-income"
              type="number"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly-expenses">Monthly Expenses (€)</Label>
            <Input
              id="monthly-expenses"
              type="number"
              value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Savings Rate</Label>
            <div className="flex items-center gap-2">
              <Badge variant={savingsRate >= 50 ? "default" : savingsRate >= 20 ? "secondary" : "outline"}>
                {savingsRate.toFixed(1)}%
              </Badge>
              <span className="text-xs text-muted-foreground">
                €{(monthlyIncome - monthlyExpenses).toLocaleString()}/month
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="annual-return">Expected Annual Return: {annualReturn}%</Label>
            <Slider
              id="annual-return"
              min={0}
              max={15}
              step={0.5}
              value={[annualReturn]}
              onValueChange={(values) => setAnnualReturn(values[0])}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="withdrawal-rate">Safe Withdrawal Rate: {withdrawalRate}%</Label>
            <Slider
              id="withdrawal-rate"
              min={2}
              max={6}
              step={0.25}
              value={[withdrawalRate]}
              onValueChange={(values) => setWithdrawalRate(values[0])}
            />
            <p className="text-xs text-muted-foreground">{fireType}</p>
          </div>
        </div>

        <Button onClick={calculateFIRE} className="w-full" size="lg">
          <Target className="w-4 h-4 mr-2" />
          Calculate FIRE Number
        </Button>

        {/* Results Section */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">FIRE Number</p>
                </div>
                <p className="text-2xl font-bold">
                  €{result.targetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <p className="text-xs text-muted-foreground">Years to FIRE</p>
                </div>
                <p className="text-2xl font-bold">
                  {result.yearsToFIRE.toFixed(1)}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-muted-foreground">Monthly Passive Income</p>
                </div>
                <p className="text-2xl font-bold">
                  €{(result.targetAmount * result.safeWithdrawalRate / 100 / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <p className="text-xs text-muted-foreground">Retirement Date</p>
                </div>
                <p className="text-lg font-bold">
                  {result.retirementDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </Card>
            </div>

            {/* Projection Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="year" 
                    stroke="hsl(var(--muted-foreground))"
                    label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => `€${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="portfolio" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Portfolio Value"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="FIRE Target"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-semibold">FIRE Strategy: {fireType}</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Target Portfolio: €{result.targetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</li>
                <li>• Safe Withdrawal: {result.safeWithdrawalRate}% annually (€{(result.targetAmount * result.safeWithdrawalRate / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}/year)</li>
                <li>• Expected Return: {annualReturn}% per year</li>
                <li>• Current Savings Rate: {savingsRate.toFixed(1)}%</li>
                <li>• Time to Financial Independence: {result.yearsToFIRE.toFixed(1)} years</li>
              </ul>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This calculator uses the {withdrawalRate}% rule and assumes {annualReturn}% annual returns.
              Past performance doesn't guarantee future results. Consider inflation and taxes in your planning.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
