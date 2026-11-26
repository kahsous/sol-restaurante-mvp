
-- 1) deliveries
CREATE TABLE IF NOT EXISTS public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  merchant_id text NOT NULL,
  store_id text,
  shipping_id text,
  status text NOT NULL DEFAULT 'PENDING',
  pickup_code text,
  tracking_url text,
  delivery_fee numeric,
  estimated_time integer,
  quote_id text,
  correlation_id text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS deliveries_order_merchant_uniq
  ON public.deliveries(order_id, merchant_id)
  WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS deliveries_shipping_uniq
  ON public.deliveries(shipping_id)
  WHERE shipping_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS deliveries_merchant_idx ON public.deliveries(merchant_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliveries TO authenticated;
GRANT ALL ON public.deliveries TO service_role;

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access deliveries"
  ON public.deliveries FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Operators view deliveries"
  ON public.deliveries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "Operators update deliveries"
  ON public.deliveries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "Kitchen view deliveries"
  ON public.deliveries FOR SELECT TO authenticated
  USING (public.is_cozinha(auth.uid()));

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) shipping_events
CREATE TABLE IF NOT EXISTS public.shipping_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  order_id text,
  merchant_id text,
  store_id text,
  shipping_id text,
  event_type text NOT NULL,
  payload jsonb,
  correlation_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shipping_events_merchant_idx
  ON public.shipping_events(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS shipping_events_order_idx
  ON public.shipping_events(order_id);

GRANT SELECT ON public.shipping_events TO authenticated;
GRANT ALL ON public.shipping_events TO service_role;

ALTER TABLE public.shipping_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view shipping_events"
  ON public.shipping_events FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Operators view shipping_events"
  ON public.shipping_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'operator'::app_role));

-- 3) cancellation_reasons (cache)
CREATE TABLE IF NOT EXISTS public.cancellation_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id text,
  order_external_id text,
  reason_code text NOT NULL,
  description text NOT NULL,
  cached_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cancellation_reasons_lookup_idx
  ON public.cancellation_reasons(merchant_id, order_external_id);
CREATE UNIQUE INDEX IF NOT EXISTS cancellation_reasons_uniq
  ON public.cancellation_reasons(
    COALESCE(merchant_id, ''), COALESCE(order_external_id, ''), reason_code
  );

GRANT SELECT ON public.cancellation_reasons TO authenticated;
GRANT ALL ON public.cancellation_reasons TO service_role;

ALTER TABLE public.cancellation_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PDV users view cancellation_reasons"
  ON public.cancellation_reasons FOR SELECT TO authenticated
  USING (public.is_pdv_user(auth.uid()));

-- 4) ifood_config: store_id
ALTER TABLE public.ifood_config
  ADD COLUMN IF NOT EXISTS store_id text;

-- 5) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipping_events;
