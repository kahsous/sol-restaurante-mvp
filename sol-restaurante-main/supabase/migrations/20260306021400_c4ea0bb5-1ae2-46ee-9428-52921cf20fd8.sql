
-- Add availability column to products (restaurant, delivery, both)
ALTER TABLE public.products ADD COLUMN availability text NOT NULL DEFAULT 'both';

-- Add printer_config table
CREATE TABLE public.printer_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Impressora Principal',
  model text NOT NULL DEFAULT 'elgin_i8',
  connection_type text NOT NULL DEFAULT 'usb',
  address text DEFAULT NULL,
  port integer DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  print_kitchen_ticket boolean NOT NULL DEFAULT true,
  print_receipt boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on printer_config
ALTER TABLE public.printer_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage printer config
CREATE POLICY "Admins can manage printer config" ON public.printer_config FOR ALL USING (is_admin(auth.uid()));

-- Operators can view printer config
CREATE POLICY "Operators can view printer config" ON public.printer_config FOR SELECT USING (has_role(auth.uid(), 'operator'::app_role));

-- Insert default printer config
INSERT INTO public.printer_config (name, model, connection_type) VALUES ('Cozinha', 'elgin_i8', 'usb'), ('Caixa', 'elgin_i8', 'usb');

-- Add updated_at trigger for printer_config
CREATE TRIGGER update_printer_config_updated_at BEFORE UPDATE ON public.printer_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
