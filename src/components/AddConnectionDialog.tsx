import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const exchangeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  exchange_name: z.string().trim().min(1, 'Exchange is required'),
  api_key: z.string().trim().min(1, 'API key is required').max(500),
  api_secret: z.string().trim().min(1, 'API secret is required').max(500),
  api_passphrase: z.string().trim().max(500).optional(),
});

const walletSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  blockchain: z.string().trim().min(1, 'Blockchain is required'),
  wallet_address: z.string().trim().min(26, 'Invalid wallet address').max(100),
});

const manualHoldingSchema = z.object({
  asset_symbol: z.string().trim().min(1, 'Symbol is required').max(10),
  asset_name: z.string().trim().min(1, 'Asset name is required').max(100),
  amount: z.string().trim().min(1, 'Amount is required'),
  price_usd: z.string().trim().min(1, 'Price is required'),
});

interface Props {
  onConnectionAdded: () => void;
}

const AddConnectionDialog = ({ onConnectionAdded }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  
  // Exchange form
  const [exchangeForm, setExchangeForm] = useState({
    name: '',
    exchange_name: '',
    api_key: '',
    api_secret: '',
    api_passphrase: '',
  });

  // Wallet form
  const [walletForm, setWalletForm] = useState({
    name: '',
    blockchain: '',
    wallet_address: '',
  });

  // Manual holding form
  const [manualForm, setManualForm] = useState({
    asset_symbol: '',
    asset_name: '',
    amount: '',
    price_usd: '',
  });

  const addExchange = async () => {
    try {
      const validated = exchangeSchema.parse(exchangeForm);
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Not Authenticated',
          description: 'Please log in to add connections',
          variant: 'destructive',
        });
        window.location.href = '/login';
        return;
      }

      const { error } = await supabase.from('portfolio_connections').insert({
        user_id: user.id,
        connection_type: 'exchange' as const,
        name: validated.name,
        exchange_name: validated.exchange_name,
        api_key: validated.api_key,
        api_secret: validated.api_secret,
        api_passphrase: validated.api_passphrase || null,
      });

      if (error) throw error;

      toast({
        title: 'Exchange Added',
        description: `${validated.exchange_name} connection created successfully`,
      });

      setExchangeForm({ name: '', exchange_name: '', api_key: '', api_secret: '', api_passphrase: '' });
      setOpen(false);
      onConnectionAdded();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to Add Exchange',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const addWallet = async () => {
    try {
      const validated = walletSchema.parse(walletForm);
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Not Authenticated',
          description: 'Please log in to add connections',
          variant: 'destructive',
        });
        window.location.href = '/login';
        return;
      }

      const { data, error } = await supabase.from('portfolio_connections').insert({
        user_id: user.id,
        connection_type: 'wallet' as const,
        name: validated.name,
        blockchain: validated.blockchain,
        wallet_address: validated.wallet_address,
      }).select().single();

      if (error) throw error;

      // Trigger initial sync
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        await supabase.functions.invoke('sync-wallet-balance', {
          body: {
            connectionId: data.id,
            blockchain: validated.blockchain,
            walletAddress: validated.wallet_address,
          },
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        });
      }

      toast({
        title: 'Wallet Added',
        description: `${validated.blockchain} wallet connected successfully`,
      });

      setWalletForm({ name: '', blockchain: '', wallet_address: '' });
      setOpen(false);
      onConnectionAdded();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to Add Wallet',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const addManualHolding = async () => {
    try {
      const validated = manualHoldingSchema.parse(manualForm);
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Not Authenticated',
          description: 'Please log in to add holdings',
          variant: 'destructive',
        });
        window.location.href = '/login';
        return;
      }

      const amount = parseFloat(validated.amount);
      const priceUsd = parseFloat(validated.price_usd);
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
        description: `${validated.asset_symbol} manually added to your portfolio`,
      });

      setManualForm({ asset_symbol: '', asset_name: '', amount: '', price_usd: '' });
      setOpen(false);
      onConnectionAdded();
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

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setCsvUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Not Authenticated',
          description: 'Please log in to upload CSV',
          variant: 'destructive',
        });
        window.location.href = '/login';
        return;
      }

      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

      // Validate headers
      const requiredHeaders = ['symbol', 'amount', 'price'];
      const hasRequired = requiredHeaders.every(h => headers.includes(h));
      
      if (!hasRequired) {
        throw new Error('CSV must have columns: symbol, amount, price (optional: name)');
      }

      const symbolIdx = headers.indexOf('symbol');
      const amountIdx = headers.indexOf('amount');
      const priceIdx = headers.indexOf('price');
      const nameIdx = headers.indexOf('name');

      const holdings = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 3) continue;

        const symbol = values[symbolIdx];
        const amount = parseFloat(values[amountIdx]);
        const price = parseFloat(values[priceIdx]);
        const name = nameIdx >= 0 ? values[nameIdx] : symbol;

        if (!symbol || isNaN(amount) || isNaN(price)) continue;

        holdings.push({
          user_id: user.id,
          asset_symbol: symbol.toUpperCase(),
          asset_name: name,
          amount,
          price_usd: price,
          value_usd: amount * price,
          connection_id: null,
        });
      }

      if (holdings.length === 0) {
        throw new Error('No valid holdings found in CSV');
      }

      const { error } = await supabase.from('portfolio_holdings').insert(holdings);
      if (error) throw error;

      toast({
        title: 'CSV Imported',
        description: `Successfully imported ${holdings.length} holdings`,
      });

      setOpen(false);
      onConnectionAdded();
    } catch (error: any) {
      toast({
        title: 'CSV Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCsvUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Connection
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Connection</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv">CSV Import</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="exchange">Exchange API</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="p-3 bg-primary/5 border border-primary/20 rounded text-xs">
              Quickly add a single asset holding manually (e.g., BTC, ETH, EUR)
            </div>

            <div>
              <Label htmlFor="manual-symbol">Asset Symbol *</Label>
              <Input
                id="manual-symbol"
                placeholder="BTC"
                value={manualForm.asset_symbol}
                onChange={(e) => setManualForm({ ...manualForm, asset_symbol: e.target.value.toUpperCase() })}
                maxLength={10}
              />
            </div>

            <div>
              <Label htmlFor="manual-name">Asset Name *</Label>
              <Input
                id="manual-name"
                placeholder="Bitcoin"
                value={manualForm.asset_name}
                onChange={(e) => setManualForm({ ...manualForm, asset_name: e.target.value })}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="manual-amount">Amount *</Label>
              <Input
                id="manual-amount"
                type="number"
                step="any"
                placeholder="0.5"
                value={manualForm.amount}
                onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="manual-price">Current Price (USD) *</Label>
              <Input
                id="manual-price"
                type="number"
                step="any"
                placeholder="42000"
                value={manualForm.price_usd}
                onChange={(e) => setManualForm({ ...manualForm, price_usd: e.target.value })}
              />
            </div>

            <Button onClick={addManualHolding} disabled={loading} className="w-full">
              {loading ? 'Adding...' : 'Add Holding'}
            </Button>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <div className="p-3 bg-primary/5 border border-primary/20 rounded text-xs">
              <p className="font-semibold mb-2">CSV Format Required:</p>
              <p>symbol,amount,price,name (optional)</p>
              <p className="mt-2">Example:</p>
              <code className="text-xs">BTC,0.5,42000,Bitcoin</code><br />
              <code className="text-xs">ETH,2.5,2250,Ethereum</code>
            </div>

            <div>
              <Label htmlFor="csv-upload">Upload CSV File</Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                disabled={csvUploading}
              />
              {csvUploading && (
                <p className="text-xs text-muted-foreground mt-2">Processing CSV...</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-4">
            <div>
              <Label htmlFor="wallet-name">Connection Name</Label>
              <Input
                id="wallet-name"
                placeholder="My Bitcoin Wallet"
                value={walletForm.name}
                onChange={(e) => setWalletForm({ ...walletForm, name: e.target.value })}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="blockchain">Blockchain</Label>
              <Select
                value={walletForm.blockchain}
                onValueChange={(value) => setWalletForm({ ...walletForm, blockchain: value })}
              >
                <SelectTrigger id="blockchain">
                  <SelectValue placeholder="Select blockchain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                  <SelectItem value="Ethereum">Ethereum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="wallet-address">Wallet Address</Label>
              <Input
                id="wallet-address"
                placeholder="0x..."
                value={walletForm.wallet_address}
                onChange={(e) => setWalletForm({ ...walletForm, wallet_address: e.target.value })}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Public address only - never share private keys
              </p>
            </div>

            <Button onClick={addWallet} disabled={loading} className="w-full">
              {loading ? 'Adding...' : 'Add Wallet'}
            </Button>
          </TabsContent>

          <TabsContent value="exchange" className="space-y-4">
            <div>
              <Label htmlFor="exchange-name">Connection Name</Label>
              <Input
                id="exchange-name"
                placeholder="My Binance Account"
                value={exchangeForm.name}
                onChange={(e) => setExchangeForm({ ...exchangeForm, name: e.target.value })}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="exchange">Exchange</Label>
              <Select
                value={exchangeForm.exchange_name}
                onValueChange={(value) => setExchangeForm({ ...exchangeForm, exchange_name: value })}
              >
                <SelectTrigger id="exchange">
                  <SelectValue placeholder="Select exchange" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Binance">Binance</SelectItem>
                  <SelectItem value="Coinbase">Coinbase</SelectItem>
                  <SelectItem value="Kraken">Kraken</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter API key"
                value={exchangeForm.api_key}
                onChange={(e) => setExchangeForm({ ...exchangeForm, api_key: e.target.value })}
                maxLength={500}
              />
            </div>

            <div>
              <Label htmlFor="api-secret">API Secret</Label>
              <Input
                id="api-secret"
                type="password"
                placeholder="Enter API secret"
                value={exchangeForm.api_secret}
                onChange={(e) => setExchangeForm({ ...exchangeForm, api_secret: e.target.value })}
                maxLength={500}
              />
            </div>

            <div>
              <Label htmlFor="api-passphrase">API Passphrase (Optional)</Label>
              <Input
                id="api-passphrase"
                type="password"
                placeholder="Enter passphrase if required"
                value={exchangeForm.api_passphrase}
                onChange={(e) => setExchangeForm({ ...exchangeForm, api_passphrase: e.target.value })}
                maxLength={500}
              />
            </div>

            <div className="p-3 bg-primary/5 border border-primary/20 rounded">
              <p className="text-xs text-muted-foreground">
                ⚠️ API credentials are securely encrypted. Only use read-only API keys without withdrawal permissions.
              </p>
            </div>

            <Button onClick={addExchange} disabled={loading} className="w-full">
              {loading ? 'Adding...' : 'Add Exchange'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddConnectionDialog;
