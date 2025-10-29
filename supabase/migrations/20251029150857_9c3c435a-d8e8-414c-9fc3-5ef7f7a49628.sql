-- PHASE 1: Core Trading Infrastructure
-- Create comprehensive trading, order management, and performance tracking tables

-- ======================
-- ORDERS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Order Details
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('crypto', 'stock', 'bond', 'metal', 'other')),
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit', 'trailing_stop', 'oco', 'bracket')),
  
  -- Quantities & Prices
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  price NUMERIC, -- NULL for market orders
  stop_price NUMERIC, -- For stop orders
  limit_price NUMERIC, -- For stop-limit orders
  trail_amount NUMERIC, -- For trailing stops
  trail_percent NUMERIC, -- For trailing stops %
  
  -- Order Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'partially_filled', 'filled', 'cancelled', 'rejected', 'expired')),
  filled_quantity NUMERIC DEFAULT 0,
  average_fill_price NUMERIC,
  
  -- Time in Force
  time_in_force TEXT DEFAULT 'gtc' CHECK (time_in_force IN ('gtc', 'ioc', 'fok', 'day')),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Execution Details
  exchange TEXT NOT NULL, -- Which exchange/broker
  connection_id UUID REFERENCES portfolio_connections(id) ON DELETE SET NULL,
  external_order_id TEXT, -- Exchange's order ID
  commission_usd NUMERIC DEFAULT 0,
  slippage_usd NUMERIC,
  
  -- Risk Management
  stop_loss_price NUMERIC,
  take_profit_price NUMERIC,
  max_slippage_percent NUMERIC DEFAULT 1, -- Reject if slippage > this
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  filled_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders"
  ON public.orders FOR DELETE
  USING (auth.uid() = user_id);

-- ======================
-- TRADES TABLE (Executed fills)
-- ======================
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- Trade Details
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  
  -- Execution
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL CHECK (price > 0),
  total_usd NUMERIC NOT NULL,
  commission_usd NUMERIC DEFAULT 0,
  slippage_usd NUMERIC DEFAULT 0,
  
  -- Exchange Details
  exchange TEXT NOT NULL,
  external_trade_id TEXT,
  
  -- P&L Tracking
  realized_pnl_usd NUMERIC, -- Calculated for sells
  
  -- Metadata
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trades"
  ON public.trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
  ON public.trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ======================
-- POSITIONS TABLE (Current positions)
-- ======================
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Position Details
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  
  -- Cost Basis
  average_entry_price NUMERIC NOT NULL CHECK (average_entry_price > 0),
  total_cost_usd NUMERIC NOT NULL,
  
  -- Current Values
  current_price_usd NUMERIC,
  current_value_usd NUMERIC,
  unrealized_pnl_usd NUMERIC,
  unrealized_pnl_percent NUMERIC,
  
  -- Risk Management
  stop_loss_price NUMERIC,
  take_profit_price NUMERIC,
  risk_amount_usd NUMERIC, -- How much user is risking
  position_size_percent NUMERIC, -- % of portfolio
  
  -- Metadata
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one position per symbol per user
  UNIQUE(user_id, symbol)
);

-- Enable RLS
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own positions"
  ON public.positions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own positions"
  ON public.positions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ======================
-- RISK LIMITS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.risk_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Portfolio-Level Limits
  max_portfolio_risk_percent NUMERIC DEFAULT 2 CHECK (max_portfolio_risk_percent > 0 AND max_portfolio_risk_percent <= 100),
  max_position_size_percent NUMERIC DEFAULT 10 CHECK (max_position_size_percent > 0 AND max_position_size_percent <= 100),
  max_daily_loss_usd NUMERIC,
  max_daily_loss_percent NUMERIC,
  max_drawdown_percent NUMERIC DEFAULT 20,
  
  -- Position-Level Limits
  max_leverage NUMERIC DEFAULT 1 CHECK (max_leverage >= 1),
  max_open_positions INTEGER DEFAULT 10,
  max_correlated_positions INTEGER DEFAULT 5,
  
  -- Order-Level Limits
  max_order_size_usd NUMERIC,
  max_slippage_percent NUMERIC DEFAULT 1,
  require_stop_loss BOOLEAN DEFAULT true,
  
  -- Circuit Breakers
  circuit_breaker_enabled BOOLEAN DEFAULT true,
  circuit_breaker_loss_percent NUMERIC DEFAULT 5,
  circuit_breaker_cool_down_minutes INTEGER DEFAULT 60,
  last_circuit_breaker_at TIMESTAMP WITH TIME ZONE,
  
  -- Trading Rules
  allow_overnight_positions BOOLEAN DEFAULT true,
  allow_weekend_trading BOOLEAN DEFAULT false,
  require_trade_confirmation BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One risk limit profile per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.risk_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own risk limits"
  ON public.risk_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own risk limits"
  ON public.risk_limits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ======================
-- PERFORMANCE METRICS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Date Range
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly', 'all_time')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Returns
  total_return_usd NUMERIC DEFAULT 0,
  total_return_percent NUMERIC DEFAULT 0,
  annualized_return_percent NUMERIC,
  
  -- Risk Metrics
  max_drawdown_percent NUMERIC DEFAULT 0,
  max_drawdown_usd NUMERIC DEFAULT 0,
  volatility NUMERIC, -- Standard deviation of returns
  sharpe_ratio NUMERIC,
  sortino_ratio NUMERIC,
  calmar_ratio NUMERIC,
  
  -- Trading Stats
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate_percent NUMERIC DEFAULT 0,
  average_win_usd NUMERIC DEFAULT 0,
  average_loss_usd NUMERIC DEFAULT 0,
  profit_factor NUMERIC, -- Gross profit / Gross loss
  expectancy NUMERIC, -- Average profit per trade
  
  -- Largest Moves
  largest_win_usd NUMERIC DEFAULT 0,
  largest_loss_usd NUMERIC DEFAULT 0,
  longest_winning_streak INTEGER DEFAULT 0,
  longest_losing_streak INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, period_type, period_start)
);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metrics"
  ON public.performance_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own metrics"
  ON public.performance_metrics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ======================
-- TRADE JOURNAL TABLE
-- ======================
CREATE TABLE IF NOT EXISTS public.trade_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES public.trades(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- Pre-Trade Planning
  setup_type TEXT, -- 'breakout', 'pullback', 'reversal', etc
  thesis TEXT, -- Why entering this trade
  risk_reward_ratio NUMERIC,
  planned_entry NUMERIC,
  planned_stop NUMERIC,
  planned_target NUMERIC,
  
  -- Psychology
  emotional_state TEXT CHECK (emotional_state IN ('calm', 'confident', 'anxious', 'fearful', 'greedy', 'frustrated', 'vengeful')),
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),
  
  -- Post-Trade Review
  what_worked TEXT,
  what_failed TEXT,
  lessons_learned TEXT,
  mistakes_made TEXT,
  would_take_again BOOLEAN,
  
  -- Tags for filtering
  tags TEXT[], -- ['momentum', 'news', 'technical', etc]
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trade_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journal"
  ON public.trade_journal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own journal"
  ON public.trade_journal FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ======================
-- INDEXES FOR PERFORMANCE
-- ======================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON public.orders(user_id, symbol);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON public.trades(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_trades_order_id ON public.trades(order_id);

CREATE INDEX IF NOT EXISTS idx_positions_user_id ON public.positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON public.positions(user_id, symbol);

CREATE INDEX IF NOT EXISTS idx_performance_user_period ON public.performance_metrics(user_id, period_type, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_journal_user_id ON public.trade_journal(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_tags ON public.trade_journal USING GIN(tags);

-- ======================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ======================
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_limits_updated_at
  BEFORE UPDATE ON public.risk_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_updated_at
  BEFORE UPDATE ON public.performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_updated_at
  BEFORE UPDATE ON public.trade_journal
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ======================
-- COMMENTS
-- ======================
COMMENT ON TABLE public.orders IS 'All order placement and management data';
COMMENT ON TABLE public.trades IS 'Executed trade history for P&L calculation';
COMMENT ON TABLE public.positions IS 'Current open positions with real-time P&L';
COMMENT ON TABLE public.risk_limits IS 'User-defined risk management parameters';
COMMENT ON TABLE public.performance_metrics IS 'Calculated performance statistics by period';
COMMENT ON TABLE public.trade_journal IS 'Trade planning, execution, and review notes';