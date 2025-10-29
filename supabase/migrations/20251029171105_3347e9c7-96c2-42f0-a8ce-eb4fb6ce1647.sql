-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Test that encryption functions are available
DO $$
BEGIN
  PERFORM pgp_sym_encrypt('test', 'test_key');
  RAISE NOTICE 'pgcrypto extension enabled successfully';
END
$$;