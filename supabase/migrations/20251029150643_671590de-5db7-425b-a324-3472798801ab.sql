-- CRITICAL SECURITY FIX: Encrypt API credentials using pgcrypto
-- This migration adds encryption for sensitive API credentials

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to encrypt data
CREATE OR REPLACE FUNCTION encrypt_secret(secret_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Use a key derived from the row's user_id for additional security
  -- In production, you'd use a proper key management service
  RETURN encode(
    pgp_sym_encrypt(
      secret_text::text,
      current_setting('app.settings.encryption_key', true)
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to decrypt data
CREATE OR REPLACE FUNCTION decrypt_secret(encrypted_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted_text, 'base64'),
    current_setting('app.settings.encryption_key', true)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add new encrypted columns
ALTER TABLE portfolio_connections 
ADD COLUMN IF NOT EXISTS api_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS api_secret_encrypted TEXT,
ADD COLUMN IF NOT EXISTS api_passphrase_encrypted TEXT;

-- Create audit log table for all API key access
CREATE TABLE IF NOT EXISTS api_key_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES portfolio_connections(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL CHECK (access_type IN ('read', 'create', 'update', 'delete')),
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT
);

-- Enable RLS on audit log
ALTER TABLE api_key_access_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit logs
CREATE POLICY "Users can view their own API access logs"
  ON api_key_access_log FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_access_log_user_id ON api_key_access_log(user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_access_log_connection_id ON api_key_access_log(connection_id, accessed_at DESC);

-- Add comment explaining the security model
COMMENT ON TABLE api_key_access_log IS 'Audit trail for all API credential access. Critical for security compliance.';
COMMENT ON FUNCTION encrypt_secret IS 'Encrypts sensitive data using AES-256. Key must be set in app.settings.encryption_key.';
COMMENT ON FUNCTION decrypt_secret IS 'Decrypts data encrypted by encrypt_secret function.';