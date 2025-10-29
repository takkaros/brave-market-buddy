-- Ensure pgcrypto extension is enabled for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify encryption functions exist and recreate if needed
CREATE OR REPLACE FUNCTION public.encrypt_secret(secret_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(
      secret_text::text,
      current_setting('app.settings.encryption_key', true)
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
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted_text, 'base64'),
    current_setting('app.settings.encryption_key', true)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;