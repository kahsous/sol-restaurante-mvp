-- Add WhatsApp and Online order support

-- Create whatsapp_events table
CREATE TABLE IF NOT EXISTS public.whatsapp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_events_processed_idx ON public.whatsapp_events (processed);
CREATE INDEX IF NOT EXISTS whatsapp_events_created_at_idx ON public.whatsapp_events (created_at DESC);

-- Update orders table to support multiple sources
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'pdv' CHECK (source IN ('pdv', 'ifood', 'online', 'whatsapp')),
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_phone text;

CREATE INDEX IF NOT EXISTS orders_source_idx ON public.orders (source);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders (created_at DESC);

-- Enable RLS
ALTER TABLE public.whatsapp_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_events
DROP POLICY IF EXISTS "Operators view whatsapp events" ON public.whatsapp_events;
CREATE POLICY "Operators view whatsapp events" ON public.whatsapp_events
  FOR SELECT USING (auth.jwt() ->> 'role' = ANY(ARRAY['admin', 'operator']));

DROP POLICY IF EXISTS "Service updates whatsapp events" ON public.whatsapp_events;
CREATE POLICY "Service updates whatsapp events" ON public.whatsapp_events
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service');
