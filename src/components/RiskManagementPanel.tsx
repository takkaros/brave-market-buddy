import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Shield, AlertTriangle, TrendingUp, Target } from 'lucide-react';

export default function RiskManagementPanel() {
  const [accountSize, setAccountSize] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(2);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [takeProfit, setTakeProfit] = useState<number>(0);

  // Calculate position sizing
  const riskAmount = (accountSize * riskPercent) / 100;
  const priceDistance = Math.abs(entryPrice - stopLoss);
  const positionSize = priceDistance > 0 ? riskAmount / priceDistance : 0;
  const positionValue = positionSize * entryPrice;
  const potentialLoss = positionSize * priceDistance;
  const potentialGain = takeProfit > 0 ? positionSize * Math.abs(takeProfit - entryPrice) : 0;
  const riskRewardRatio = potentialLoss > 0 ? potentialGain / potentialLoss : 0;

  // Risk assessment
  const getRiskAssessment = () => {
    if (riskPercent > 5) return { level: 'High Risk', color: 'text-red-500', variant: 'destructive' as const };
    if (riskPercent > 3) return { level: 'Moderate-High', color: 'text-orange-500', variant: 'default' as const };
    if (riskPercent > 1) return { level: 'Conservative', color: 'text-green-500', variant: 'outline' as const };
    return { level: 'Very Conservative', color: 'text-blue-500', variant: 'secondary' as const };
  };

  const getRRRAssessment = () => {
    if (riskRewardRatio >= 3) return { label: 'Excellent', color: 'text-green-500', variant: 'default' as const };
    if (riskRewardRatio >= 2) return { label: 'Good', color: 'text-blue-500', variant: 'secondary' as const };
    if (riskRewardRatio >= 1) return { label: 'Acceptable', color: 'text-yellow-500', variant: 'outline' as const };
    return { label: 'Poor', color: 'text-red-500', variant: 'destructive' as const };
  };

  const riskAssessment = getRiskAssessment();
  const rrrAssessment = getRRRAssessment();

  // Kelly Criterion calculation
  const [winRate, setWinRate] = useState<number>(55);
  const [avgWin, setAvgWin] = useState<number>(150);
  const [avgLoss, setAvgLoss] = useState<number>(100);
  
  const winProbability = winRate / 100;
  const lossProbability = 1 - winProbability;
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
  const kellyPercent = winProbability - (lossProbability / winLossRatio);
  const halfKelly = kellyPercent / 2; // Conservative Kelly
  const kellyPositionSize = halfKelly > 0 ? (accountSize * halfKelly) : 0;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="position" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="position">Position Sizing</TabsTrigger>
          <TabsTrigger value="kelly">Kelly Criterion</TabsTrigger>
        </TabsList>

        <TabsContent value="position" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Position Size Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountSize">Account Size ($)</Label>
                  <Input
                    id="accountSize"
                    type="number"
                    value={accountSize}
                    onChange={(e) => setAccountSize(Number(e.target.value))}
                    min="0"
                    step="1000"
                  />
                </div>

                <div>
                  <Label htmlFor="riskPercent">Risk Per Trade (%)</Label>
                  <Input
                    id="riskPercent"
                    type="number"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(Number(e.target.value))}
                    min="0.1"
                    max="10"
                    step="0.1"
                  />
                  <Badge {...riskAssessment} className="mt-2">
                    {riskAssessment.level}
                  </Badge>
                </div>

                <div>
                  <Label htmlFor="entryPrice">Entry Price ($)</Label>
                  <Input
                    id="entryPrice"
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="stopLoss">Stop Loss ($)</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="takeProfit">Take Profit ($)</Label>
                  <Input
                    id="takeProfit"
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Results Section */}
              {entryPrice > 0 && stopLoss > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-primary/5">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <Shield className="w-6 h-6 mx-auto text-primary" />
                          <p className="text-sm text-muted-foreground">Position Size</p>
                          <p className="text-2xl font-bold">
                            {positionSize.toFixed(4)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            units (${positionValue.toFixed(2)})
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-red-500/5">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <AlertTriangle className="w-6 h-6 mx-auto text-red-500" />
                          <p className="text-sm text-muted-foreground">Max Risk</p>
                          <p className="text-2xl font-bold text-red-500">
                            ${potentialLoss.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {riskPercent}% of account
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-500/5">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <TrendingUp className="w-6 h-6 mx-auto text-green-500" />
                          <p className="text-sm text-muted-foreground">Potential Gain</p>
                          <p className="text-2xl font-bold text-green-500">
                            ${potentialGain.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            If target hit
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Risk/Reward Ratio */}
                  {takeProfit > 0 && (
                    <Card className="glass-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Target className="w-6 h-6 text-primary" />
                            <div>
                              <p className="text-sm font-medium">Risk/Reward Ratio</p>
                              <p className="text-xs text-muted-foreground">
                                Your trade setup quality
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-3xl font-bold ${rrrAssessment.color}`}>
                              1:{riskRewardRatio.toFixed(2)}
                            </p>
                            <Badge {...rrrAssessment}>
                              {rrrAssessment.label}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Trade Quality Assessment */}
                  <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-sm flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-500" />
                          Trade Quality Check
                        </p>
                        <div className="space-y-1 text-xs">
                          {riskPercent <= 2 ? (
                            <p className="text-green-500">✓ Conservative risk per trade</p>
                          ) : (
                            <p className="text-yellow-500">⚠ Consider reducing risk per trade to ≤2%</p>
                          )}
                          {riskRewardRatio >= 2 ? (
                            <p className="text-green-500">✓ Favorable risk/reward ratio</p>
                          ) : (
                            <p className="text-yellow-500">⚠ Aim for risk/reward ≥2:1</p>
                          )}
                          {priceDistance / entryPrice > 0.02 ? (
                            <p className="text-yellow-500">⚠ Stop loss is {((priceDistance / entryPrice) * 100).toFixed(1)}% away - consider tighter stops</p>
                          ) : (
                            <p className="text-green-500">✓ Tight stop loss placement</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kelly" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Kelly Criterion Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="winRate">Win Rate (%)</Label>
                  <Input
                    id="winRate"
                    type="number"
                    value={winRate}
                    onChange={(e) => setWinRate(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="1"
                  />
                </div>

                <div>
                  <Label htmlFor="avgWin">Average Win ($)</Label>
                  <Input
                    id="avgWin"
                    type="number"
                    value={avgWin}
                    onChange={(e) => setAvgWin(Number(e.target.value))}
                    min="0"
                    step="10"
                  />
                </div>

                <div>
                  <Label htmlFor="avgLoss">Average Loss ($)</Label>
                  <Input
                    id="avgLoss"
                    type="number"
                    value={avgLoss}
                    onChange={(e) => setAvgLoss(Number(e.target.value))}
                    min="0"
                    step="10"
                  />
                </div>
              </div>

              {kellyPercent > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <Card className="bg-primary/5">
                    <CardContent className="pt-6 space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Optimal Kelly %</p>
                        <p className="text-4xl font-bold text-primary">
                          {(kellyPercent * 100).toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Full Kelly formula result
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-background rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Half Kelly (Recommended)</p>
                          <p className="text-2xl font-bold text-green-500">
                            {(halfKelly * 100).toFixed(2)}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            ${kellyPositionSize.toFixed(2)} position size
                          </p>
                        </div>

                        <div className="text-center p-4 bg-background rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Win/Loss Ratio</p>
                          <p className="text-2xl font-bold">
                            {winLossRatio.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Average win vs loss
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-yellow-500/5 border-yellow-500/20">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          Kelly Criterion Guidelines
                        </p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>• <strong>Half Kelly</strong> is recommended for practical trading (reduces volatility)</p>
                          <p>• Kelly assumes your win rate and R:R are accurate (use conservative estimates)</p>
                          <p>• Never risk more than 5% per trade, even if Kelly suggests it</p>
                          <p>• This is a theoretical model - always account for real-world constraints</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {kellyPercent <= 0 && (
                <Card className="bg-red-500/5 border-red-500/20">
                  <CardContent className="pt-6 text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-3" />
                    <p className="font-semibold text-red-500 mb-2">Negative Edge Detected</p>
                    <p className="text-sm text-muted-foreground">
                      Your current win rate and win/loss ratio suggest a negative expected value. 
                      Improve your strategy before risking capital.
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
