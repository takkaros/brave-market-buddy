-- Add is_hidden column to portfolio_holdings table
ALTER TABLE portfolio_holdings 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_hidden 
ON portfolio_holdings(user_id, is_hidden);

-- Add a comment explaining the column
COMMENT ON COLUMN portfolio_holdings.is_hidden IS 
'When true, the holding is hidden from portfolio views and will not be updated by sync operations';
