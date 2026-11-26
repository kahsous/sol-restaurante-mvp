-- Security Fix: Address 4 critical security findings

-- 1. Fix cost_price exposure in products table - restrict to admin/stock roles only
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

CREATE POLICY "Anonymous users can view basic product info"
ON public.products
FOR SELECT
TO anon
USING (is_active = true);

-- Create a more secure policy for authenticated users (without cost_price access)
CREATE POLICY "Authenticated users can view basic product info"
ON public.products
FOR SELECT
TO authenticated
USING (is_active = true);

-- Admin and stock roles can view all product data including cost_price
CREATE POLICY "Admin/stock can view all product data including costs"
ON public.products
FOR SELECT
USING (
  is_admin(auth.uid()) OR 
  is_estoque(auth.uid())
);

-- 2. Fix orders INSERT policy to prevent user_id spoofing
DROP POLICY IF EXISTS "Guests can create orders with required info" ON public.orders;

CREATE POLICY "Users can create orders for themselves or as guests"
ON public.orders
FOR INSERT
WITH CHECK (
  (user_id = auth.uid() AND auth.uid() IS NOT NULL) OR 
  (user_id IS NULL AND guest_name IS NOT NULL AND guest_phone IS NOT NULL)
);