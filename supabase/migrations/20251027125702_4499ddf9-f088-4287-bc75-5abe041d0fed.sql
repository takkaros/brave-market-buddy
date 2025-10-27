-- Add notes column to portfolio_holdings table
ALTER TABLE public.portfolio_holdings 
ADD COLUMN IF NOT EXISTS notes TEXT;