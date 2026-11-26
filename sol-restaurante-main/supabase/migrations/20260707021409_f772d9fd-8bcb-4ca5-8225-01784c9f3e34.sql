ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_combo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS serves int,
  ADD COLUMN IF NOT EXISTS sale_start time,
  ADD COLUMN IF NOT EXISTS sale_end time,
  ADD COLUMN IF NOT EXISTS combo_items jsonb NOT NULL DEFAULT '[]'::jsonb;