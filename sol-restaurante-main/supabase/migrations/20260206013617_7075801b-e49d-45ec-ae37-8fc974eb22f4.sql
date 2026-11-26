-- 1. Create helper functions for role checks
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_cozinha(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'cozinha'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_estoque(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'estoque'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_operator_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'operator')
  )
$$;

-- 2. Create function to check if user has an open cash register (for shift-based access)
CREATE OR REPLACE FUNCTION public.get_user_open_register(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.cash_registers 
  WHERE user_id = _user_id AND status = 'open'
  ORDER BY opened_at DESC
  LIMIT 1
$$;

-- 3. Create a secure view for kitchen (hides financial data)
CREATE OR REPLACE VIEW public.orders_kitchen 
WITH (security_invoker = on)
AS SELECT 
  id,
  status,
  created_at,
  notes,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', item->>'name',
        'quantity', item->>'quantity',
        'size', item->>'size',
        'description', item->>'description'
      )
    )
    FROM jsonb_array_elements(items) AS item
  ) AS items_display,
  guest_name,
  guest_neighborhood_name
FROM public.orders;

-- 4. Create a secure view for tabs (kitchen view without values)
CREATE OR REPLACE VIEW public.tabs_kitchen
WITH (security_invoker = on)
AS SELECT 
  id,
  code,
  type,
  status,
  customer_name,
  created_at,
  updated_at,
  notes,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', item->>'name',
        'quantity', item->>'quantity',
        'size', item->>'size'
      )
    )
    FROM jsonb_array_elements(items) AS item
  ) AS items_display
FROM public.tabs;

COMMENT ON VIEW public.orders_kitchen IS 'View for kitchen staff - hides financial data';
COMMENT ON VIEW public.tabs_kitchen IS 'View for kitchen staff - hides financial data';

-- 5. ORDERS TABLE: Replace permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

CREATE POLICY "Guests can create orders with required info"
ON public.orders
FOR INSERT
WITH CHECK (
  (user_id IS NOT NULL) OR 
  (guest_name IS NOT NULL AND guest_phone IS NOT NULL)
);

-- Drop and replace PDV view policies with role-specific ones
DROP POLICY IF EXISTS "PDV users can view all orders" ON public.orders;

CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Operators can view orders during shift"
ON public.orders
FOR SELECT
USING (
  has_role(auth.uid(), 'operator') AND
  (
    get_user_open_register(auth.uid()) IS NOT NULL AND
    created_at >= (
      SELECT opened_at FROM public.cash_registers 
      WHERE user_id = auth.uid() AND status = 'open'
      ORDER BY opened_at DESC LIMIT 1
    )
  )
);

CREATE POLICY "Kitchen can view orders for preparation"
ON public.orders
FOR SELECT
USING (is_cozinha(auth.uid()));

-- Update policies for orders
DROP POLICY IF EXISTS "PDV users can update order status" ON public.orders;

CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Operators can update orders during shift"
ON public.orders
FOR UPDATE
USING (
  has_role(auth.uid(), 'operator') AND
  get_user_open_register(auth.uid()) IS NOT NULL
);

CREATE POLICY "Kitchen can update order status only"
ON public.orders
FOR UPDATE
USING (is_cozinha(auth.uid()))
WITH CHECK (is_cozinha(auth.uid()));

-- 6. CASH_REGISTERS TABLE: Restrict to admin and operators only
DROP POLICY IF EXISTS "PDV users can view all cash registers" ON public.cash_registers;
DROP POLICY IF EXISTS "PDV users can create cash registers" ON public.cash_registers;
DROP POLICY IF EXISTS "PDV users can update cash registers" ON public.cash_registers;

CREATE POLICY "Admins have full access to cash registers"
ON public.cash_registers
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Operators can view own cash registers"
ON public.cash_registers
FOR SELECT
USING (has_role(auth.uid(), 'operator') AND user_id = auth.uid());

CREATE POLICY "Operators can create own cash registers"
ON public.cash_registers
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'operator') AND user_id = auth.uid());

CREATE POLICY "Operators can update own cash registers"
ON public.cash_registers
FOR UPDATE
USING (has_role(auth.uid(), 'operator') AND user_id = auth.uid());

-- 7. CASH_MOVEMENTS TABLE: Restrict to admin and operators with shift constraint
DROP POLICY IF EXISTS "PDV users can view all cash movements" ON public.cash_movements;
DROP POLICY IF EXISTS "PDV users can create cash movements" ON public.cash_movements;

CREATE POLICY "Admins have full access to cash movements"
ON public.cash_movements
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Operators can view own shift movements"
ON public.cash_movements
FOR SELECT
USING (
  has_role(auth.uid(), 'operator') AND
  cash_register_id IN (
    SELECT id FROM public.cash_registers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Operators can create movements on own register"
ON public.cash_movements
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'operator') AND
  cash_register_id IN (
    SELECT id FROM public.cash_registers WHERE user_id = auth.uid() AND status = 'open'
  )
);

-- 8. PRODUCTS TABLE: Allow stock role to manage products
DROP POLICY IF EXISTS "PDV users can manage products" ON public.products;

CREATE POLICY "Admins have full access to products"
ON public.products
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Stock role can manage products"
ON public.products
FOR ALL
USING (is_estoque(auth.uid()));

CREATE POLICY "Operators can view products"
ON public.products
FOR SELECT
USING (has_role(auth.uid(), 'operator'));

CREATE POLICY "Kitchen can view products"
ON public.products
FOR SELECT
USING (is_cozinha(auth.uid()));

-- 9. CATEGORIES TABLE: Granular access
DROP POLICY IF EXISTS "PDV users can manage categories" ON public.categories;

CREATE POLICY "Admins have full access to categories"
ON public.categories
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Stock role can manage categories"
ON public.categories
FOR ALL
USING (is_estoque(auth.uid()));

-- 10. TABS TABLE: Restrict access
DROP POLICY IF EXISTS "PDV users can view all tabs" ON public.tabs;
DROP POLICY IF EXISTS "PDV users can create tabs" ON public.tabs;
DROP POLICY IF EXISTS "PDV users can update tabs" ON public.tabs;
DROP POLICY IF EXISTS "PDV users can delete tabs" ON public.tabs;

CREATE POLICY "Admins have full access to tabs"
ON public.tabs
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Operators have full access to tabs"
ON public.tabs
FOR ALL
USING (has_role(auth.uid(), 'operator'));

CREATE POLICY "Kitchen can view tabs"
ON public.tabs
FOR SELECT
USING (is_cozinha(auth.uid()));

-- 11. SCALE_CONFIG TABLE: Admin and stock only
DROP POLICY IF EXISTS "PDV users can manage scale config" ON public.scale_config;

CREATE POLICY "Admins can manage scale config"
ON public.scale_config
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Stock can manage scale config"
ON public.scale_config
FOR ALL
USING (is_estoque(auth.uid()));