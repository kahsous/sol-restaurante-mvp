
-- Single-row restaurant settings table
CREATE TABLE public.restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Restaurante Sol',
  slogan text DEFAULT 'Comida caseira no fogão a lenha',
  phone text DEFAULT '(13) 98115-9622',
  whatsapp text DEFAULT '5513981159622',
  address_street text DEFAULT 'Av. Santos Dumont, 952',
  address_full text DEFAULT 'Av. Santos Dumont, 952 - Sítio Paecara (Vicente de Carvalho), Guarujá - SP, 11460-002',
  city text DEFAULT 'Guarujá',
  state text DEFAULT 'SP',
  maps_url text DEFAULT 'https://maps.google.com/?q=Av.+Santos+Dumont,+952+-+Sítio+Paecara,+Guarujá+-+SP',
  instagram_url text DEFAULT 'https://www.instagram.com/restauranteconfeitariasol',
  working_hours text DEFAULT 'Segunda a Sexta: 11:00 às 15:30',
  delivery_time text DEFAULT '30-45 min',
  primary_color text DEFAULT NULL,
  accent_color text DEFAULT NULL,
  logo_url text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure single row
CREATE UNIQUE INDEX restaurant_settings_singleton ON public.restaurant_settings ((true));

-- Insert default row
INSERT INTO public.restaurant_settings (id) VALUES (gen_random_uuid());

-- RLS
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view restaurant settings"
  ON public.restaurant_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update restaurant settings"
  ON public.restaurant_settings FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert restaurant settings"
  ON public.restaurant_settings FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_restaurant_settings_updated_at
  BEFORE UPDATE ON public.restaurant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
