
-- Add last_event_at + indexes to deliveries
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS last_event_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_deliveries_merchant_status ON public.deliveries (merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_shipping_events_order_created ON public.shipping_events (order_id, created_at DESC);

-- Trigger updated_at on deliveries
DROP TRIGGER IF EXISTS trg_deliveries_updated_at ON public.deliveries;
CREATE TRIGGER trg_deliveries_updated_at
BEFORE UPDATE ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Idempotency table for polling acks
CREATE TABLE IF NOT EXISTS public.ifood_polling_acks (
  event_id text PRIMARY KEY,
  acked_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ifood_polling_acks TO authenticated;
GRANT ALL ON public.ifood_polling_acks TO service_role;
ALTER TABLE public.ifood_polling_acks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view ifood_polling_acks" ON public.ifood_polling_acks;
CREATE POLICY "Admins view ifood_polling_acks"
ON public.ifood_polling_acks FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

-- service_role insert/delete on cancellation_reasons (used by edge functions)
GRANT INSERT, DELETE, UPDATE ON public.cancellation_reasons TO service_role;
