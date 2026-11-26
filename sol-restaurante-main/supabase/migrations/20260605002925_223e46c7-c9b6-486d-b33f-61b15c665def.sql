
-- 1. Reorganizar categorias no padrão iFood
UPDATE public.categories SET name = 'Pratos do Dia', display_order = 2 WHERE id = '11111111-0001-0001-0001-000000000001';
UPDATE public.categories SET name = 'Buffet', display_order = 3 WHERE id = '11111111-0001-0001-0001-000000000008';
UPDATE public.categories SET name = 'Comida por Kilo', display_order = 4 WHERE id = '11111111-0001-0001-0001-000000000009';
UPDATE public.categories SET name = 'Sobremesas', display_order = 9 WHERE id = '11111111-0001-0001-0001-000000000003';
UPDATE public.categories SET name = 'Águas e Energéticos', display_order = 6 WHERE id = '11111111-0001-0001-0001-000000000004';
UPDATE public.categories SET name = 'Cervejas', display_order = 7 WHERE id = '11111111-0001-0001-0001-000000000005';
UPDATE public.categories SET name = 'Refrigerantes', display_order = 8 WHERE id = '11111111-0001-0001-0001-000000000006';
UPDATE public.categories SET name = 'Sucos', display_order = 5 WHERE id = '11111111-0001-0001-0001-000000000007';

-- Categoria "Destaques" (virtual: alimentada por products.is_featured, mas registrada para nav)
INSERT INTO public.categories (id, name, icon, display_order, is_active)
VALUES ('11111111-0001-0001-0001-000000000099', 'Destaques', '⭐', 1, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Coluna is_featured
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = true;

-- 3. Tabela option_groups
CREATE TABLE IF NOT EXISTS public.option_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  required boolean NOT NULL DEFAULT false,
  min_select integer NOT NULL DEFAULT 0,
  max_select integer NOT NULL DEFAULT 1,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.option_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.option_groups TO authenticated;
GRANT ALL ON public.option_groups TO service_role;

ALTER TABLE public.option_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view option groups"
  ON public.option_groups FOR SELECT
  USING (true);

CREATE POLICY "Admin/operator can manage option groups"
  ON public.option_groups FOR ALL
  TO authenticated
  USING (public.is_operator_or_admin(auth.uid()))
  WITH CHECK (public.is_operator_or_admin(auth.uid()));

CREATE TRIGGER update_option_groups_updated_at
  BEFORE UPDATE ON public.option_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Tabela options
CREATE TABLE IF NOT EXISTS public.options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.option_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_delta numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.options TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.options TO authenticated;
GRANT ALL ON public.options TO service_role;

ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view options"
  ON public.options FOR SELECT
  USING (true);

CREATE POLICY "Admin/operator can manage options"
  ON public.options FOR ALL
  TO authenticated
  USING (public.is_operator_or_admin(auth.uid()))
  WITH CHECK (public.is_operator_or_admin(auth.uid()));

CREATE TRIGGER update_options_updated_at
  BEFORE UPDATE ON public.options
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_option_groups_product ON public.option_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_options_group ON public.options(group_id);
