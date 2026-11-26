-- Add weight-based sales columns to products
ALTER TABLE public.products
ADD COLUMN sold_by_weight boolean NOT NULL DEFAULT false,
ADD COLUMN price_per_kg numeric DEFAULT NULL;

-- Modify orders items to support weight-based items
-- The items JSONB already stores items, we just need to ensure the structure supports weight
-- Items with weight will have: { id, name, quantity, size, weight_kg, price_per_kg, is_weight_item }

-- Create a table to store scale configurations
CREATE TABLE IF NOT EXISTS public.scale_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Balança Principal',
  port text NOT NULL DEFAULT 'COM1',
  baud_rate integer NOT NULL DEFAULT 9600,
  protocol text NOT NULL DEFAULT 'toledo',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scale_config ENABLE ROW LEVEL SECURITY;

-- PDV users can manage scale config
CREATE POLICY "PDV users can manage scale config"
  ON public.scale_config
  FOR ALL
  USING (is_pdv_user(auth.uid()));

-- Insert default config
INSERT INTO public.scale_config (name, port, baud_rate, protocol)
VALUES ('Balança Principal', 'COM1', 9600, 'toledo');

-- Create trigger for updated_at
CREATE TRIGGER update_scale_config_updated_at
  BEFORE UPDATE ON public.scale_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();