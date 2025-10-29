-- Fix security linter warnings from previous migration
-- Add proper search_path to encryption functions

-- Update encrypt_secret function with proper search_path
CREATE OR REPLACE FUNCTION encrypt_secret(secret_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(
      secret_text::text,
      current_setting('app.settings.encryption_key', true)
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update decrypt_secret function with proper search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;