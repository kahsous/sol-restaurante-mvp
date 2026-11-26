ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ifood_pickup_code text,
  ADD COLUMN IF NOT EXISTS ifood_pickup_code_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ifood_address_change_request jsonb,
  ADD COLUMN IF NOT EXISTS ifood_cancel_request jsonb,
  ADD COLUMN IF NOT EXISTS ifood_event_type text;

CREATE INDEX IF NOT EXISTS idx_ifood_event_log_order_external_id
  ON public.ifood_event_log(order_external_id);