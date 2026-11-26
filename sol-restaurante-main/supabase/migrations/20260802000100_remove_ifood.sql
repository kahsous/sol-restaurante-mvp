-- Remove all iFood related tables and columns

-- Drop iFood-specific tables
DROP TABLE IF EXISTS public.ifood_polling_acks CASCADE;
DROP TABLE IF EXISTS public.ifood_event_log CASCADE;
DROP TABLE IF EXISTS public.cancellation_reasons CASCADE;
DROP TABLE IF EXISTS public.shipping_events CASCADE;
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.ifood_config CASCADE;

-- Remove iFood columns from orders table
ALTER TABLE public.orders
  DROP COLUMN IF EXISTS external_id,
  DROP COLUMN IF EXISTS ifood_event_type,
  DROP COLUMN IF EXISTS ifood_pickup_code,
  DROP COLUMN IF EXISTS ifood_cancel_request,
  DROP COLUMN IF EXISTS ifood_address_change_request,
  DROP COLUMN IF EXISTS ifood_pickup_code_required,
  DROP COLUMN IF EXISTS external_data;

-- Simplify source column (only: pdv, online, whatsapp)
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_source_check,
  ADD CONSTRAINT orders_source_check CHECK (source IN ('pdv', 'online', 'whatsapp'));
