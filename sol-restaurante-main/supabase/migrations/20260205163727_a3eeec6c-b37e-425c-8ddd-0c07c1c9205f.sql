-- Allow guest orders (user_id can be null)
-- Update the INSERT policy to allow guests
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Guest orders need guest info, so let's add columns for that
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS guest_name TEXT,
ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- Update addresses to allow guest addresses (temporary, not saved)
-- We'll store address info directly in orders for guests
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS guest_address_street TEXT,
ADD COLUMN IF NOT EXISTS guest_address_number TEXT,
ADD COLUMN IF NOT EXISTS guest_address_complement TEXT,
ADD COLUMN IF NOT EXISTS guest_neighborhood_name TEXT;