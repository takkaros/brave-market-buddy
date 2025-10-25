-- Create portfolio_connections table for exchanges and wallets
CREATE TABLE IF NOT EXISTS public.portfolio_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('exchange', 'wallet')),
  name TEXT NOT NULL,
  
  -- For exchanges
  exchange_name TEXT,
  api_key TEXT,
  api_secret TEXT,
  api_passphrase TEXT,
  
  -- For wallets
  blockchain TEXT,
  wallet_address TEXT,
  
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolio_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own connections"
  ON public.portfolio_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections"
  ON public.portfolio_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
  ON public.portfolio_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
  ON public.portfolio_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create portfolio_holdings table for tracked assets
CREATE TABLE IF NOT EXISTS public.portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  connection_id UUID REFERENCES public.portfolio_connections(id) ON DELETE CASCADE,
  
  asset_symbol TEXT NOT NULL,
  asset_name TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  price_usd NUMERIC,
  value_usd NUMERIC,
  
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own holdings"
  ON public.portfolio_holdings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own holdings"
  ON public.portfolio_holdings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own holdings"
  ON public.portfolio_holdings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own holdings"
  ON public.portfolio_holdings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolio_connections_updated_at
  BEFORE UPDATE ON public.portfolio_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_portfolio_connections_user_id ON public.portfolio_connections(user_id);
CREATE INDEX idx_portfolio_holdings_user_id ON public.portfolio_holdings(user_id);
CREATE INDEX idx_portfolio_holdings_connection_id ON public.portfolio_holdings(connection_id);