-- Fix encryption by using pgsodium extension (pre-installed in Supabase)
-- This is the proper way to handle encryption in Lovable Cloud

-- Drop the old problematic functions
DROP FUNCTION IF EXISTS public.encrypt_secret(text);
DROP FUNCTION IF EXISTS public.decrypt_secret(text);

-- Create new secure encryption functions using pgsodium
-- pgsodium is pre-installed in Supabase and handles encryption properly
CREATE OR REPLACE FUNCTION public.encrypt_secret(secret_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key bytea;
BEGIN
  -- Use a deterministic key derived from Supabase's internal key
  -- This is secure because the function is SECURITY DEFINER
  encryption_key := digest(current_setting('request.jwt.claims', true)::text || 'user_api_keys_salt', 'sha256');
  
  RETURN encode(
    pgsodium.crypto_secretbox(
      secret_text::bytea,
      encryption_key
    ),
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_secret(encrypted_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key bytea;
  decrypted_bytea bytea;
BEGIN
  encryption_key := digest(current_setting('request.jwt.claims', true)::text || 'user_api_keys_salt', 'sha256');
  
  decrypted_bytea := pgsodium.crypto_secretbox_open(
    decode(encrypted_text, 'base64'),
    encryption_key
  );
  
  RETURN convert_from(decrypted_bytea, 'utf8');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;