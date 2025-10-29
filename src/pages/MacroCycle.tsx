import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, RefreshCw } from 'lucide-react';
import { MacroCycleMetrics } from '@/components/MacroCycleMetrics';
import { LogRegChart } from '@/components/LogRegChart';
import { RiskHeatmap } from '@/components/RiskHeatmap';
import { CycleTimeline } from '@/components/CycleTimeline';
import { TrendBandChart } from '@/components/TrendBandChart';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

export default function MacroCycle() {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleString());
  const [btcData, setBtcData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchBTCData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-btc-macro-data');
      if (error) throw error;
      setBtcData(data);
      setLastUpdate(new Date().toLocaleString());
      toast({
        title: 'Data Updated',
        description: 'Latest macro data fetched successfully',
      });
    } catch (error: any) {
      console.error('Error fetching BTC data:', error);
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBTCData();
  }, [selectedAsset]);

  const handleRefresh = () => {
    fetchBTCData();
  };

  const handleDownload = () => {
    // Export functionality
    const element = document.getElementById('macro-cycle-content');
    if (element) {
      // Simple download logic - could be enhanced with html2canvas or similar
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              MacroCycle Navigator
            </h1>
            <p className="text-xl md:text-2xl mb-3 text-muted-foreground font-medium">
              Visualizing market cycles, risk and trend structure
            </p>
            <p className="text-base text-muted-foreground">
              Inspired by Benjamin Cowen's methodology: Log-reg fair value, risk levels, cycle phase, trend alignment
            </p>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Asset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                <SelectItem value="TOTAL2">Alt Market</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Last update: {lastUpdate}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Updating...' : 'Refresh'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="macro-cycle-content" className="container mx-auto px-4 pb-12 space-y-8">
        {/* Live Price Display */}
        {btcData && (
          <Card className="p-6 border-2 border-primary/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Live {selectedAsset} Price</p>
                <p className="text-3xl font-bold text-primary">${btcData.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
                <p className="text-2xl font-bold text-foreground">${(btcData.marketCap / 1e9).toFixed(2)}B</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">24h Volume</p>
                <p className="text-2xl font-bold text-foreground">${(btcData.volume24h / 1e9).toFixed(2)}B</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Data Source</p>
                <p className="text-sm font-medium text-foreground">🟢 CoinGecko API</p>
                <p className="text-xs text-muted-foreground">Updated: {new Date(btcData.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Key Metrics Dashboard */}
        <MacroCycleMetrics asset={selectedAsset} btcData={btcData} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LogRegChart asset={selectedAsset} />
          <RiskHeatmap asset={selectedAsset} />
        </div>

        <CycleTimeline asset={selectedAsset} />
        
        <TrendBandChart asset={selectedAsset} />

        {/* Data Attribution */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div>
                <span className="font-semibold text-foreground">Live Data:</span>
                <span className="ml-2 text-muted-foreground">CoinGecko API • Alternative.me Fear & Greed</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">Charts:</span>
                <span className="ml-2 text-muted-foreground">Mock historical data for visualization</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdate}
            </span>
          </div>
        </Card>

        {/* Methodology Explanation */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Understanding the Cowen Framework</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              <strong className="text-foreground">Benjamin Cowen's methodology</strong> emphasizes understanding crypto market cycles through a long-term, probabilistic lens. Rather than day-trading or short-term predictions, the focus is on:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Time-in-Cycle:</strong> Understanding where we are in the ~4-year Bitcoin halving cycle helps contextualize price action and risk.</li>
              <li><strong className="text-foreground">Logarithmic Regression:</strong> BTC's long-term growth follows a logarithmic curve. The log-reg bands show fair value and extremes (±1σ, ±2σ, ±3σ).</li>
              <li><strong className="text-foreground">Risk Metric:</strong> A composite indicator (0-100) combining price deviation, cycle progress, and momentum. Green = lower risk accumulation zone, Red = higher risk distribution zone.</li>
              <li><strong className="text-foreground">Trend Structure:</strong> Key moving averages like the 200-week MA and the Bull Support Band (20w SMA & 21w EMA) define structural trends.</li>
              <li><strong className="text-foreground">BTC Dominance:</strong> Tracks Bitcoin's share of total crypto market cap, indicating rotation between BTC and alts.</li>
            </ul>
            <p>
              <strong className="text-foreground">How to interpret the visuals:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>When price is <strong className="text-foreground">above the top log-reg band</strong> and risk is <span className="text-red-500">high</span> → we may be in late-cycle euphoria.</li>
              <li>When risk is <span className="text-green-500">low</span>, price near the lower band, and cycle progress is early → accumulation zone.</li>
              <li>Price <strong className="text-foreground">above 200-week MA and Bull Support Band</strong> → structurally bullish trend.</li>
              <li>Price <strong className="text-foreground">below these levels</strong> → bear market or consolidation phase.</li>
            </ul>
            <div className="bg-muted/50 p-4 rounded-lg border border-border mt-4">
              <p className="text-sm">
                <strong className="text-foreground">⚠️ Important Disclaimer:</strong> This is not a prediction tool. It's a risk & context framework for educational purposes. Markets are probabilistic, not deterministic. Past cycles don't guarantee future outcomes. This is not financial advice.
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <Card className="p-6 bg-muted/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <p>Inspired by <a href="https://www.youtube.com/@intothecryptoverse" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Benjamin Cowen</a> & Into The Cryptoverse</p>
              <p className="mt-1">MacroCycle Navigator v1.0 • Not financial advice • For educational purposes only</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Data sources: Public APIs & On-chain metrics</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
