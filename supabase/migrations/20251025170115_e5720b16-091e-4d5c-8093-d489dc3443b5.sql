-- Add asset_type column to portfolio_holdings for multi-asset support
ALTER TABLE public.portfolio_holdings 
ADD COLUMN asset_type text NOT NULL DEFAULT 'crypto';

-- Add purchase_date and purchase_price for tax calculations
ALTER TABLE public.portfolio_holdings
ADD COLUMN purchase_date timestamp with time zone,
ADD COLUMN purchase_price_usd numeric;

-- Create economic_indicators table for caching
CREATE TABLE public.economic_indicators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indicator_code text NOT NULL,
  indicator_name text NOT NULL,
  value numeric,
  date timestamp with time zone,
  region text NOT NULL DEFAULT 'global',
  source text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(indicator_code, date, region)
);

ALTER TABLE public.economic_indicators ENABLE ROW LEVEL SECURITY;

-- Public read access for economic indicators
CREATE POLICY "Economic indicators are viewable by everyone" 
ON public.economic_indicators 
FOR SELECT 
USING (true);

-- Create tax_calculations table
CREATE TABLE public.tax_calculations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tax_year integer NOT NULL,
  asset_type text NOT NULL,
  total_gains numeric DEFAULT 0,
  total_losses numeric DEFAULT 0,
  net_gains numeric DEFAULT 0,
  tax_owed numeric DEFAULT 0,
  jurisdiction text NOT NULL DEFAULT 'cyprus',
  calculation_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tax calculations" 
ON public.tax_calculations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax calculations" 
ON public.tax_calculations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax calculations" 
ON public.tax_calculations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_economic_indicators_updated_at
BEFORE UPDATE ON public.economic_indicators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tax_calculations_updated_at
BEFORE UPDATE ON public.tax_calculations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();