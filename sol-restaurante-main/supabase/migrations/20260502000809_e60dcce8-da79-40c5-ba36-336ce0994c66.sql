-- 1. Add columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'site',
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS external_data jsonb;

-- Anti-duplication index for iFood orders
CREATE UNIQUE INDEX IF NOT EXISTS orders_external_id_ifood_uniq
  ON public.orders (external_id)
  WHERE source = 'ifood' AND external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS orders_source_idx ON public.orders (source);

-- 2. ifood_config (singleton)
CREATE TABLE IF NOT EXISTS public.ifood_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id text,
  client_id text,
  client_secret text,
  polling_enabled boolean NOT NULL DEFAULT false,
  auto_confirm boolean NOT NULL DEFAULT false,
  last_polling_at timestamptz,
  access_token text,
  token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ifood_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ifood_config"
  ON public.ifood_config
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER ifood_config_updated_at
  BEFORE UPDATE ON public.ifood_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed singleton row
INSERT INTO public.ifood_config (polling_enabled, auto_confirm)
SELECT false, false
WHERE NOT EXISTS (SELECT 1 FROM public.ifood_config);

-- 3. ifood_event_log
CREATE TABLE IF NOT EXISTS public.ifood_event_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL,
  event_type text,
  order_external_id text,
  payload jsonb,
  processed_at timestamptz NOT NULL DEFAULT now(),
  error text
);

CREATE UNIQUE INDEX IF NOT EXISTS ifood_event_log_event_id_uniq
  ON public.ifood_event_log (event_id);

CREATE INDEX IF NOT EXISTS ifood_event_log_order_idx
  ON public.ifood_event_log (order_external_id);

ALTER TABLE public.ifood_event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view ifood_event_log"
  ON public.ifood_event_log
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins insert ifood_event_log"
  ON public.ifood_event_log
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));