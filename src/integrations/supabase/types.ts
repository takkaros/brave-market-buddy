export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_key_access_log: {
        Row: {
          access_type: string
          accessed_at: string
          connection_id: string
          error_message: string | null
          id: string
          ip_address: unknown
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          accessed_at?: string
          connection_id: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          accessed_at?: string
          connection_id?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_access_log_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "portfolio_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      economic_indicators: {
        Row: {
          created_at: string
          date: string | null
          id: string
          indicator_code: string
          indicator_name: string
          region: string
          source: string | null
          updated_at: string
          value: number | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          id?: string
          indicator_code: string
          indicator_name: string
          region?: string
          source?: string | null
          updated_at?: string
          value?: number | null
        }
        Update: {
          created_at?: string
          date?: string | null
          id?: string
          indicator_code?: string
          indicator_name?: string
          region?: string
          source?: string | null
          updated_at?: string
          value?: number | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          asset_type: string
          average_fill_price: number | null
          cancelled_at: string | null
          commission_usd: number | null
          connection_id: string | null
          created_at: string
          exchange: string
          expires_at: string | null
          external_order_id: string | null
          filled_at: string | null
          filled_quantity: number | null
          id: string
          limit_price: number | null
          max_slippage_percent: number | null
          notes: string | null
          order_type: string
          price: number | null
          quantity: number
          side: string
          slippage_usd: number | null
          status: string
          stop_loss_price: number | null
          stop_price: number | null
          symbol: string
          take_profit_price: number | null
          time_in_force: string | null
          trail_amount: number | null
          trail_percent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type: string
          average_fill_price?: number | null
          cancelled_at?: string | null
          commission_usd?: number | null
          connection_id?: string | null
          created_at?: string
          exchange: string
          expires_at?: string | null
          external_order_id?: string | null
          filled_at?: string | null
          filled_quantity?: number | null
          id?: string
          limit_price?: number | null
          max_slippage_percent?: number | null
          notes?: string | null
          order_type: string
          price?: number | null
          quantity: number
          side: string
          slippage_usd?: number | null
          status?: string
          stop_loss_price?: number | null
          stop_price?: number | null
          symbol: string
          take_profit_price?: number | null
          time_in_force?: string | null
          trail_amount?: number | null
          trail_percent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          average_fill_price?: number | null
          cancelled_at?: string | null
          commission_usd?: number | null
          connection_id?: string | null
          created_at?: string
          exchange?: string
          expires_at?: string | null
          external_order_id?: string | null
          filled_at?: string | null
          filled_quantity?: number | null
          id?: string
          limit_price?: number | null
          max_slippage_percent?: number | null
          notes?: string | null
          order_type?: string
          price?: number | null
          quantity?: number
          side?: string
          slippage_usd?: number | null
          status?: string
          stop_loss_price?: number | null
          stop_price?: number | null
          symbol?: string
          take_profit_price?: number | null
          time_in_force?: string | null
          trail_amount?: number | null
          trail_percent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "portfolio_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          annualized_return_percent: number | null
          average_loss_usd: number | null
          average_win_usd: number | null
          calmar_ratio: number | null
          created_at: string
          expectancy: number | null
          id: string
          largest_loss_usd: number | null
          largest_win_usd: number | null
          longest_losing_streak: number | null
          longest_winning_streak: number | null
          losing_trades: number | null
          max_drawdown_percent: number | null
          max_drawdown_usd: number | null
          period_end: string
          period_start: string
          period_type: string
          profit_factor: number | null
          sharpe_ratio: number | null
          sortino_ratio: number | null
          total_return_percent: number | null
          total_return_usd: number | null
          total_trades: number | null
          updated_at: string
          user_id: string
          volatility: number | null
          win_rate_percent: number | null
          winning_trades: number | null
        }
        Insert: {
          annualized_return_percent?: number | null
          average_loss_usd?: number | null
          average_win_usd?: number | null
          calmar_ratio?: number | null
          created_at?: string
          expectancy?: number | null
          id?: string
          largest_loss_usd?: number | null
          largest_win_usd?: number | null
          longest_losing_streak?: number | null
          longest_winning_streak?: number | null
          losing_trades?: number | null
          max_drawdown_percent?: number | null
          max_drawdown_usd?: number | null
          period_end: string
          period_start: string
          period_type: string
          profit_factor?: number | null
          sharpe_ratio?: number | null
          sortino_ratio?: number | null
          total_return_percent?: number | null
          total_return_usd?: number | null
          total_trades?: number | null
          updated_at?: string
          user_id: string
          volatility?: number | null
          win_rate_percent?: number | null
          winning_trades?: number | null
        }
        Update: {
          annualized_return_percent?: number | null
          average_loss_usd?: number | null
          average_win_usd?: number | null
          calmar_ratio?: number | null
          created_at?: string
          expectancy?: number | null
          id?: string
          largest_loss_usd?: number | null
          largest_win_usd?: number | null
          longest_losing_streak?: number | null
          longest_winning_streak?: number | null
          losing_trades?: number | null
          max_drawdown_percent?: number | null
          max_drawdown_usd?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          profit_factor?: number | null
          sharpe_ratio?: number | null
          sortino_ratio?: number | null
          total_return_percent?: number | null
          total_return_usd?: number | null
          total_trades?: number | null
          updated_at?: string
          user_id?: string
          volatility?: number | null
          win_rate_percent?: number | null
          winning_trades?: number | null
        }
        Relationships: []
      }
      portfolio_connections: {
        Row: {
          api_key: string | null
          api_key_encrypted: string | null
          api_passphrase: string | null
          api_passphrase_encrypted: string | null
          api_secret: string | null
          api_secret_encrypted: string | null
          blockchain: string | null
          connection_type: string
          created_at: string
          exchange_name: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          api_key?: string | null
          api_key_encrypted?: string | null
          api_passphrase?: string | null
          api_passphrase_encrypted?: string | null
          api_secret?: string | null
          api_secret_encrypted?: string | null
          blockchain?: string | null
          connection_type: string
          created_at?: string
          exchange_name?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name: string
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          api_key?: string | null
          api_key_encrypted?: string | null
          api_passphrase?: string | null
          api_passphrase_encrypted?: string | null
          api_secret?: string | null
          api_secret_encrypted?: string | null
          blockchain?: string | null
          connection_type?: string
          created_at?: string
          exchange_name?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      portfolio_holdings: {
        Row: {
          amount: number
          asset_name: string | null
          asset_symbol: string
          asset_type: string
          connection_id: string | null
          created_at: string
          id: string
          is_hidden: boolean | null
          last_updated_at: string
          notes: string | null
          price_usd: number | null
          purchase_date: string | null
          purchase_price_usd: number | null
          user_id: string
          value_usd: number | null
        }
        Insert: {
          amount?: number
          asset_name?: string | null
          asset_symbol: string
          asset_type?: string
          connection_id?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          last_updated_at?: string
          notes?: string | null
          price_usd?: number | null
          purchase_date?: string | null
          purchase_price_usd?: number | null
          user_id: string
          value_usd?: number | null
        }
        Update: {
          amount?: number
          asset_name?: string | null
          asset_symbol?: string
          asset_type?: string
          connection_id?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean | null
          last_updated_at?: string
          notes?: string | null
          price_usd?: number | null
          purchase_date?: string | null
          purchase_price_usd?: number | null
          user_id?: string
          value_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_holdings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "portfolio_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          asset_type: string
          average_entry_price: number
          current_price_usd: number | null
          current_value_usd: number | null
          id: string
          opened_at: string
          position_size_percent: number | null
          quantity: number
          risk_amount_usd: number | null
          stop_loss_price: number | null
          symbol: string
          take_profit_price: number | null
          total_cost_usd: number
          unrealized_pnl_percent: number | null
          unrealized_pnl_usd: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type: string
          average_entry_price: number
          current_price_usd?: number | null
          current_value_usd?: number | null
          id?: string
          opened_at?: string
          position_size_percent?: number | null
          quantity: number
          risk_amount_usd?: number | null
          stop_loss_price?: number | null
          symbol: string
          take_profit_price?: number | null
          total_cost_usd: number
          unrealized_pnl_percent?: number | null
          unrealized_pnl_usd?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          average_entry_price?: number
          current_price_usd?: number | null
          current_value_usd?: number | null
          id?: string
          opened_at?: string
          position_size_percent?: number | null
          quantity?: number
          risk_amount_usd?: number | null
          stop_loss_price?: number | null
          symbol?: string
          take_profit_price?: number | null
          total_cost_usd?: number
          unrealized_pnl_percent?: number | null
          unrealized_pnl_usd?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      risk_limits: {
        Row: {
          allow_overnight_positions: boolean | null
          allow_weekend_trading: boolean | null
          circuit_breaker_cool_down_minutes: number | null
          circuit_breaker_enabled: boolean | null
          circuit_breaker_loss_percent: number | null
          created_at: string
          id: string
          last_circuit_breaker_at: string | null
          max_correlated_positions: number | null
          max_daily_loss_percent: number | null
          max_daily_loss_usd: number | null
          max_drawdown_percent: number | null
          max_leverage: number | null
          max_open_positions: number | null
          max_order_size_usd: number | null
          max_portfolio_risk_percent: number | null
          max_position_size_percent: number | null
          max_slippage_percent: number | null
          require_stop_loss: boolean | null
          require_trade_confirmation: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_overnight_positions?: boolean | null
          allow_weekend_trading?: boolean | null
          circuit_breaker_cool_down_minutes?: number | null
          circuit_breaker_enabled?: boolean | null
          circuit_breaker_loss_percent?: number | null
          created_at?: string
          id?: string
          last_circuit_breaker_at?: string | null
          max_correlated_positions?: number | null
          max_daily_loss_percent?: number | null
          max_daily_loss_usd?: number | null
          max_drawdown_percent?: number | null
          max_leverage?: number | null
          max_open_positions?: number | null
          max_order_size_usd?: number | null
          max_portfolio_risk_percent?: number | null
          max_position_size_percent?: number | null
          max_slippage_percent?: number | null
          require_stop_loss?: boolean | null
          require_trade_confirmation?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_overnight_positions?: boolean | null
          allow_weekend_trading?: boolean | null
          circuit_breaker_cool_down_minutes?: number | null
          circuit_breaker_enabled?: boolean | null
          circuit_breaker_loss_percent?: number | null
          created_at?: string
          id?: string
          last_circuit_breaker_at?: string | null
          max_correlated_positions?: number | null
          max_daily_loss_percent?: number | null
          max_daily_loss_usd?: number | null
          max_drawdown_percent?: number | null
          max_leverage?: number | null
          max_open_positions?: number | null
          max_order_size_usd?: number | null
          max_portfolio_risk_percent?: number | null
          max_position_size_percent?: number | null
          max_slippage_percent?: number | null
          require_stop_loss?: boolean | null
          require_trade_confirmation?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_calculations: {
        Row: {
          asset_type: string
          calculation_data: Json | null
          created_at: string
          id: string
          jurisdiction: string
          net_gains: number | null
          tax_owed: number | null
          tax_year: number
          total_gains: number | null
          total_losses: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type: string
          calculation_data?: Json | null
          created_at?: string
          id?: string
          jurisdiction?: string
          net_gains?: number | null
          tax_owed?: number | null
          tax_year: number
          total_gains?: number | null
          total_losses?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          calculation_data?: Json | null
          created_at?: string
          id?: string
          jurisdiction?: string
          net_gains?: number | null
          tax_owed?: number | null
          tax_year?: number
          total_gains?: number | null
          total_losses?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_journal: {
        Row: {
          confidence_level: number | null
          created_at: string
          emotional_state: string | null
          id: string
          lessons_learned: string | null
          mistakes_made: string | null
          order_id: string | null
          planned_entry: number | null
          planned_stop: number | null
          planned_target: number | null
          risk_reward_ratio: number | null
          setup_type: string | null
          tags: string[] | null
          thesis: string | null
          trade_id: string | null
          updated_at: string
          user_id: string
          what_failed: string | null
          what_worked: string | null
          would_take_again: boolean | null
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string
          emotional_state?: string | null
          id?: string
          lessons_learned?: string | null
          mistakes_made?: string | null
          order_id?: string | null
          planned_entry?: number | null
          planned_stop?: number | null
          planned_target?: number | null
          risk_reward_ratio?: number | null
          setup_type?: string | null
          tags?: string[] | null
          thesis?: string | null
          trade_id?: string | null
          updated_at?: string
          user_id: string
          what_failed?: string | null
          what_worked?: string | null
          would_take_again?: boolean | null
        }
        Update: {
          confidence_level?: number | null
          created_at?: string
          emotional_state?: string | null
          id?: string
          lessons_learned?: string | null
          mistakes_made?: string | null
          order_id?: string | null
          planned_entry?: number | null
          planned_stop?: number | null
          planned_target?: number | null
          risk_reward_ratio?: number | null
          setup_type?: string | null
          tags?: string[] | null
          thesis?: string | null
          trade_id?: string | null
          updated_at?: string
          user_id?: string
          what_failed?: string | null
          what_worked?: string | null
          would_take_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_journal_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_journal_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          asset_type: string
          commission_usd: number | null
          created_at: string
          exchange: string
          executed_at: string
          external_trade_id: string | null
          id: string
          order_id: string | null
          price: number
          quantity: number
          realized_pnl_usd: number | null
          side: string
          slippage_usd: number | null
          symbol: string
          total_usd: number
          user_id: string
        }
        Insert: {
          asset_type: string
          commission_usd?: number | null
          created_at?: string
          exchange: string
          executed_at?: string
          external_trade_id?: string | null
          id?: string
          order_id?: string | null
          price: number
          quantity: number
          realized_pnl_usd?: number | null
          side: string
          slippage_usd?: number | null
          symbol: string
          total_usd: number
          user_id: string
        }
        Update: {
          asset_type?: string
          commission_usd?: number | null
          created_at?: string
          exchange?: string
          executed_at?: string
          external_trade_id?: string | null
          id?: string
          order_id?: string | null
          price?: number
          quantity?: number
          realized_pnl_usd?: number | null
          side?: string
          slippage_usd?: number | null
          symbol?: string
          total_usd?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          api_key_encrypted: string
          created_at: string | null
          id: string
          provider: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string | null
          id?: string
          provider: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string | null
          id?: string
          provider?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrypt_secret: { Args: { encrypted_text: string }; Returns: string }
      encrypt_secret: { Args: { secret_text: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
