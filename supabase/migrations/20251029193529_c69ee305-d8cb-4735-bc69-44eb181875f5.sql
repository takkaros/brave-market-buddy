-- Create tables for storing market data

-- BTC Macro Data
CREATE TABLE IF NOT EXISTS public.btc_macro_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price DECIMAL NOT NULL,
  dominance DECIMAL NOT NULL,
  market_cap DECIMAL NOT NULL,
  volume_24h DECIMAL NOT NULL,
  fear_greed_index INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX idx_btc_macro_timestamp ON public.btc_macro_data(timestamp DESC);

-- Crypto Prices
CREATE TABLE IF NOT EXISTS public.crypto_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  price DECIMAL NOT NULL,
  volume_24h DECIMAL,
  market_cap DECIMAL,
  change_24h DECIMAL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crypto_prices_symbol_timestamp ON public.crypto_prices(symbol, timestamp DESC);

-- Stock Prices
CREATE TABLE IF NOT EXISTS public.stock_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  price DECIMAL NOT NULL,
  volume DECIMAL,
  change_percent DECIMAL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_prices_symbol_timestamp ON public.stock_prices(symbol, timestamp DESC);

-- Metal Prices
CREATE TABLE IF NOT EXISTS public.metal_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metal TEXT NOT NULL,
  price DECIMAL NOT NULL,
  change_24h DECIMAL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_metal_prices_metal_timestamp ON public.metal_prices(metal, timestamp DESC);

-- Bond Data
CREATE TABLE IF NOT EXISTS public.bond_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bond_type TEXT NOT NULL,
  yield DECIMAL NOT NULL,
  price DECIMAL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bond_data_type_timestamp ON public.bond_data(bond_type, timestamp DESC);

-- Economic Indicators (already exists, but let's ensure it's properly set up)
-- This table should already exist based on the fetch-economic-indicators function

-- Enable Row Level Security
ALTER TABLE public.btc_macro_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metal_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bond_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (market data should be readable by all authenticated users)
CREATE POLICY "Allow authenticated users to read BTC macro data"
  ON public.btc_macro_data
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read crypto prices"
  ON public.crypto_prices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read stock prices"
  ON public.stock_prices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read metal prices"
  ON public.metal_prices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read bond data"
  ON public.bond_data
  FOR SELECT
  TO authenticated
  USING (true);

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.btc_macro_data;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crypto_prices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_prices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.metal_prices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bond_data;