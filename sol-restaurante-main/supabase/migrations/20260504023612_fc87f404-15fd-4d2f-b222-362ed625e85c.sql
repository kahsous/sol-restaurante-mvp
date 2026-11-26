ALTER TABLE public.ifood_config
  ADD COLUMN IF NOT EXISTS refresh_token text,
  ADD COLUMN IF NOT EXISTS user_code text,
  ADD COLUMN IF NOT EXISTS user_code_verifier text,
  ADD COLUMN IF NOT EXISTS verification_url text,
  ADD COLUMN IF NOT EXISTS user_code_expires_at timestamptz;