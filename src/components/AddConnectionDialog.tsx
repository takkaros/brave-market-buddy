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

interface Props {
  onConnectionAdded: () => void;
}

const AddConnectionDialog = ({ onConnectionAdded }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
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

  const addExchange = async () => {
    try {
      const validated = exchangeSchema.parse(exchangeForm);
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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
      if (!user) throw new Error('Not authenticated');

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

        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wallet">Wallet Address</TabsTrigger>
            <TabsTrigger value="exchange">Exchange API</TabsTrigger>
          </TabsList>

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
