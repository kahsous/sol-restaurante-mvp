
-- Drop existing check constraints
ALTER TABLE public.tabs DROP CONSTRAINT IF EXISTS tabs_status_check;
ALTER TABLE public.tabs DROP CONSTRAINT IF EXISTS tabs_type_check;

-- Add new status check with all valid statuses
ALTER TABLE public.tabs ADD CONSTRAINT tabs_status_check 
  CHECK (status = ANY (ARRAY['free', 'open', 'consuming', 'awaiting_payment', 'finalized']));

-- Add tab_number column
ALTER TABLE public.tabs ADD COLUMN IF NOT EXISTS tab_number integer;

-- Delete all existing tabs
DELETE FROM public.tabs;

-- Add unique constraint on tab_number
ALTER TABLE public.tabs ADD CONSTRAINT tabs_tab_number_unique UNIQUE (tab_number);

-- Pre-populate 100 fixed comandas (001-100)
INSERT INTO public.tabs (tab_number, code, status, type, items, subtotal)
SELECT 
  n,
  LPAD(n::text, 3, '0'),
  'free',
  'internal',
  '[]'::jsonb,
  0
FROM generate_series(1, 100) AS n;

-- Update the tabs_kitchen view to include tab_number
DROP VIEW IF EXISTS public.tabs_kitchen;
CREATE VIEW public.tabs_kitchen WITH (security_invoker = on) AS
SELECT 
  t.id,
  t.tab_number,
  t.code,
  t.type,
  t.status,
  t.customer_name,
  t.notes,
  t.updated_at,
  t.created_at,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', item->>'name',
        'quantity', item->>'quantity',
        'size', item->>'size'
      )
    )
    FROM jsonb_array_elements(t.items) AS item
  ) AS items_display
FROM public.tabs t
WHERE t.status IN ('open', 'consuming');
