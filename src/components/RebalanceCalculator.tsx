import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scale, Plus, Minus } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  currentValue: number;
  targetAllocation: number;
}

export default function RebalanceCalculator() {
  const [assets, setAssets] = useState<Asset[]>([
    { id: '1', name: 'BTC', currentValue: 10000, targetAllocation: 50 },
    { id: '2', name: 'ETH', currentValue: 5000, targetAllocation: 30 },
    { id: '3', name: 'Stables', currentValue: 3000, targetAllocation: 20 },
  ]);

  const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);

  const calculateRebalance = () => {
    return assets.map(asset => {
      const currentAllocation = (asset.currentValue / totalValue) * 100;
      const targetValue = (totalValue * asset.targetAllocation) / 100;
      const difference = targetValue - asset.currentValue;
      return {
        ...asset,
        currentAllocation: currentAllocation.toFixed(2),
        targetValue,
        difference,
        action: difference > 0 ? 'Buy' : 'Sell',
      };
    });
  };

  const rebalanceData = calculateRebalance();

  const updateAsset = (id: string, field: string, value: any) => {
    setAssets(assets.map(asset => 
      asset.id === id ? { ...asset, [field]: parseFloat(value) || 0 } : asset
    ));
  };

  const addAsset = () => {
    const newId = (Math.max(...assets.map(a => parseInt(a.id))) + 1).toString();
    setAssets([...assets, { id: newId, name: 'New Asset', currentValue: 0, targetAllocation: 0 }]);
  };

  const removeAsset = (id: string) => {
    if (assets.length > 1) {
      setAssets(assets.filter(asset => asset.id !== id));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Portfolio Rebalance Calculator
        </CardTitle>
        <CardDescription>
          Calculate how to rebalance your portfolio to target allocations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 p-4 rounded-lg mb-4">
          <p className="text-sm font-semibold mb-2">Total Portfolio Value</p>
          <p className="text-3xl font-bold text-foreground">${totalValue.toLocaleString()}</p>
        </div>

        <div className="space-y-4">
          {assets.map((asset) => (
            <div key={asset.id} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-3">
                <Label className="text-xs">Asset</Label>
                <Input
                  value={asset.name}
                  onChange={(e) => updateAsset(asset.id, 'name', e.target.value)}
                  placeholder="Asset name"
                />
              </div>
              <div className="col-span-4">
                <Label className="text-xs">Current Value ($)</Label>
                <Input
                  type="number"
                  value={asset.currentValue}
                  onChange={(e) => updateAsset(asset.id, 'currentValue', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="col-span-3">
                <Label className="text-xs">Target (%)</Label>
                <Input
                  type="number"
                  value={asset.targetAllocation}
                  onChange={(e) => updateAsset(asset.id, 'targetAllocation', e.target.value)}
                  placeholder="0"
                  max="100"
                />
              </div>
              <div className="col-span-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAsset(asset.id)}
                  disabled={assets.length === 1}
                  className="w-full"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addAsset} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>

        <div className="border-t border-border pt-4">
          <h3 className="text-lg font-semibold mb-4">Rebalancing Actions</h3>
          <div className="space-y-3">
            {rebalanceData.map((data) => (
              <div
                key={data.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{data.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Current: {data.currentAllocation}% → Target: {data.targetAllocation}%
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${data.difference > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {data.action} ${Math.abs(data.difference).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Target: ${data.targetValue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
          <p><strong className="text-foreground">Note:</strong> Total target allocation should equal 100%. 
          Currently: {assets.reduce((sum, a) => sum + a.targetAllocation, 0).toFixed(0)}%</p>
        </div>
      </CardContent>
    </Card>
  );
}
