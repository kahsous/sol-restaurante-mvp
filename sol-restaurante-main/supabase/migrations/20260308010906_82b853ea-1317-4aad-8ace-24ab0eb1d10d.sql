
-- Ingredients table (for recipes and stock)
CREATE TABLE public.ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'g',
  cost_per_unit numeric NOT NULL DEFAULT 0,
  stock_quantity numeric NOT NULL DEFAULT 0,
  min_stock numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access ingredients" ON public.ingredients FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Stock role manage ingredients" ON public.ingredients FOR ALL TO authenticated USING (is_estoque(auth.uid()));
CREATE POLICY "Operators view ingredients" ON public.ingredients FOR SELECT TO authenticated USING (has_role(auth.uid(), 'operator'));
CREATE POLICY "Kitchen view ingredients" ON public.ingredients FOR SELECT TO authenticated USING (is_cozinha(auth.uid()));

-- Product recipes (ficha técnica)
CREATE TABLE public.product_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'g',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access product_recipes" ON public.product_recipes FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Stock role manage product_recipes" ON public.product_recipes FOR ALL TO authenticated USING (is_estoque(auth.uid()));
CREATE POLICY "Operators view product_recipes" ON public.product_recipes FOR SELECT TO authenticated USING (has_role(auth.uid(), 'operator'));

-- Waste control
CREATE TABLE public.waste_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ingredient_id uuid REFERENCES public.ingredients(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'un',
  reason text NOT NULL DEFAULT 'other',
  notes text,
  responsible text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.waste_control ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access waste_control" ON public.waste_control FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Operators manage waste_control" ON public.waste_control FOR ALL TO authenticated USING (has_role(auth.uid(), 'operator'));
CREATE POLICY "Kitchen insert waste_control" ON public.waste_control FOR INSERT TO authenticated WITH CHECK (is_cozinha(auth.uid()));
CREATE POLICY "Kitchen view waste_control" ON public.waste_control FOR SELECT TO authenticated USING (is_cozinha(auth.uid()));

-- Customers CRM
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  address_street text,
  address_number text,
  address_complement text,
  neighborhood text,
  total_orders integer NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  last_order_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access customers" ON public.customers FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Operators manage customers" ON public.customers FOR ALL TO authenticated USING (has_role(auth.uid(), 'operator'));

-- Prep time tracking (add columns to orders)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS prep_started_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS prep_finished_at timestamp with time zone;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.ingredients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
