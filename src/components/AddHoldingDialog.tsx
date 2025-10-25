import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';

const holdingSchema = z.object({
  asset_symbol: z.string().min(1, 'Symbol is required').max(10),
  asset_name: z.string().min(1, 'Name is required').max(50),
  amount: z.string().min(1, 'Amount is required'),
});

interface Props {
  onAdded: () => void;
}

const POPULAR_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'USDT', name: 'Tether' },
  { symbol: 'USDC', name: 'USD Coin' },
];

export default function AddHoldingDialog({ onAdded }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    asset_symbol: '',
    asset_name: '',
    amount: '',
  });
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  const fetchPrice = async (symbol: string) => {
    if (!symbol) return;
    setFetchingPrice(true);
    try {
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/price?fsym=${symbol.toUpperCase()}&tsyms=USD`
      );
      const data = await response.json();
      if (data.USD) {
        setCurrentPrice(data.USD);
      } else {
        toast({
          title: 'Price Not Found',
          description: `Could not fetch price for ${symbol}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to fetch price:', error);
      toast({
        title: 'Price Fetch Failed',
        description: 'Could not fetch current price',
        variant: 'destructive',
      });
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleQuickSelect = (asset: { symbol: string; name: string }) => {
    setForm(prev => ({
      ...prev,
      asset_symbol: asset.symbol,
      asset_name: asset.name,
    }));
    fetchPrice(asset.symbol);
  };

  useEffect(() => {
    if (form.asset_symbol && form.asset_symbol.length >= 2) {
      const timer = setTimeout(() => {
        fetchPrice(form.asset_symbol);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [form.asset_symbol]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Not Authenticated',
        description: 'Please log in to add holdings',
        variant: 'destructive',
      });
      return;
    }

    try {
      const validated = holdingSchema.parse(form);
      
      if (!currentPrice) {
        toast({
          title: 'Price Required',
          description: 'Please wait for price to load or enter a valid symbol',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      const amount = parseFloat(validated.amount);
      const priceUsd = currentPrice;
      const valueUsd = amount * priceUsd;

      const { error } = await supabase.from('portfolio_holdings').insert({
        user_id: user.id,
        asset_symbol: validated.asset_symbol.toUpperCase(),
        asset_name: validated.asset_name,
        amount,
        price_usd: priceUsd,
        value_usd: valueUsd,
        connection_id: null,
      });

      if (error) throw error;

      toast({
        title: 'Holding Added',
        description: `${validated.asset_symbol} added to your portfolio`,
      });

      setForm({ asset_symbol: '', asset_name: '', amount: '' });
      setCurrentPrice(null);
      setOpen(false);
      onAdded();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to Add Holding',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Holding
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Holding</DialogTitle>
          <DialogDescription>
            Manually add crypto holdings to track in your portfolio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Select */}
          <div>
            <Label className="text-sm mb-2 block">Popular Assets</Label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_ASSETS.map(asset => (
                <Button
                  key={asset.symbol}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(asset)}
                >
                  {asset.symbol}
                </Button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="BTC"
                  value={form.asset_symbol}
                  onChange={(e) => setForm({ ...form, asset_symbol: e.target.value.toUpperCase() })}
                  maxLength={10}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Asset Name</Label>
                <Input
                  id="name"
                  placeholder="Bitcoin"
                  value={form.asset_name}
                  onChange={(e) => setForm({ ...form, asset_name: e.target.value })}
                  maxLength={50}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                placeholder="0.5"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>

            {fetchingPrice && (
              <div className="p-3 bg-muted/30 rounded-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p className="text-sm">Fetching current price...</p>
              </div>
            )}

            {currentPrice && !fetchingPrice && (
              <div className="p-3 bg-primary/10 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="font-semibold">
                    ${currentPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                {form.amount && (
                  <>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-xl font-bold">
                        ${(parseFloat(form.amount) * currentPrice).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Holding
                </>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
