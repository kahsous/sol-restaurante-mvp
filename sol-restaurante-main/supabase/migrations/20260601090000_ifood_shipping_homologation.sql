-- iFood Shipping homologation support: real deliveries, webhook events, cancellation reasons and Realtime.

ALTER TABLE public.ifood_config
  ADD COLUMN IF NOT EXISTS store_id text,
  ADD COLUMN IF NOT EXISTS webhook_secret text,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'production';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS pickup_code text;

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  merchant_id text NOT NULL,
  store_id text,
  shipping_id text,
  quote_id text,
  tracking_url text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_TRANSIT', 'PICKED_UP', 'DELIVERED', 'CANCELLED')),
  pickup_code text,
  delivery_fee numeric(10,2) DEFAULT 0,
  estimated_time text,
  correlation_id text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, merchant_id),
  UNIQUE (shipping_id)
);

DROP TRIGGER IF EXISTS deliveries_updated_at ON public.deliveries;
CREATE TRIGGER deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS deliveries_merchant_store_idx ON public.deliveries (merchant_id, store_id);
CREATE INDEX IF NOT EXISTS deliveries_status_idx ON public.deliveries (status);

CREATE TABLE IF NOT EXISTS public.shipping_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  order_id text,
  merchant_id text,
  store_id text,
  shipping_id text,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  correlation_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id)
);

CREATE INDEX IF NOT EXISTS shipping_events_order_idx ON public.shipping_events (order_id);
CREATE INDEX IF NOT EXISTS shipping_events_merchant_store_idx ON public.shipping_events (merchant_id, store_id);
CREATE INDEX IF NOT EXISTS shipping_events_type_idx ON public.shipping_events (event_type);

CREATE TABLE IF NOT EXISTS public.cancellation_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id text NOT NULL,
  store_id text,
  reason_code text NOT NULL,
  description text NOT NULL,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id, reason_code)
);

DROP TRIGGER IF EXISTS cancellation_reasons_updated_at ON public.cancellation_reasons;
CREATE TRIGGER cancellation_reasons_updated_at
  BEFORE UPDATE ON public.cancellation_reasons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_reasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Operators view deliveries" ON public.deliveries;
CREATE POLICY "Operators view deliveries" ON public.deliveries
  FOR SELECT USING (public.is_admin(auth.uid()) OR public.is_operator_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Operators manage deliveries" ON public.deliveries;
CREATE POLICY "Operators manage deliveries" ON public.deliveries
  FOR ALL USING (public.is_admin(auth.uid()) OR public.is_operator_or_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_operator_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Operators view shipping_events" ON public.shipping_events;
CREATE POLICY "Operators view shipping_events" ON public.shipping_events
  FOR SELECT USING (public.is_admin(auth.uid()) OR public.is_operator_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Service inserts shipping_events" ON public.shipping_events;
CREATE POLICY "Service inserts shipping_events" ON public.shipping_events
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()) OR public.is_operator_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Operators view cancellation_reasons" ON public.cancellation_reasons;
CREATE POLICY "Operators view cancellation_reasons" ON public.cancellation_reasons
  FOR SELECT USING (public.is_admin(auth.uid()) OR public.is_operator_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Operators manage cancellation_reasons" ON public.cancellation_reasons;
CREATE POLICY "Operators manage cancellation_reasons" ON public.cancellation_reasons
  FOR ALL USING (public.is_admin(auth.uid()) OR public.is_operator_or_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_operator_or_admin(auth.uid()));

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.shipping_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
