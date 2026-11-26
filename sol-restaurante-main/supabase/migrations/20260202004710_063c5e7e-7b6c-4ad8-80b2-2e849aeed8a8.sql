-- =========================================
-- 1. EXTENSIONS
-- =========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- 2. ENUM
-- =========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE public.payment_method AS ENUM (
      'pix',
      'credit_card',
      'debit_card',
      'cash'
    );
  END IF;
END$$;

-- =========================================
-- 3. TABLES
-- =========================================

-- PROFILES (COMPATÍVEL COM SEU BANCO ATUAL)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ADD EXTRA FIELDS
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- NEIGHBORHOODS
CREATE TABLE IF NOT EXISTS public.neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood_id UUID,
  city TEXT DEFAULT 'Santos',
  state TEXT DEFAULT 'SP',
  zip_code TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  address_id UUID REFERENCES public.addresses(id),
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method public.payment_method NOT NULL,
  cash_change DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- 4. RLS
-- =========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 5. FUNCTION
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========================================
-- 6. TRIGGER
-- =========================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 7. POLICIES
-- =========================================

-- PROFILES
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;

CREATE POLICY profiles_select
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY profiles_insert
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- ADDRESSES
DROP POLICY IF EXISTS addresses_select ON public.addresses;
DROP POLICY IF EXISTS addresses_insert ON public.addresses;
DROP POLICY IF EXISTS addresses_update ON public.addresses;
DROP POLICY IF EXISTS addresses_delete ON public.addresses;

CREATE POLICY addresses_select
ON public.addresses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY addresses_insert
ON public.addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY addresses_update
ON public.addresses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY addresses_delete
ON public.addresses FOR DELETE
USING (auth.uid() = user_id);

-- NEIGHBORHOODS
CREATE POLICY neighborhoods_select
ON public.neighborhoods FOR SELECT
USING (is_active = true);

-- ORDERS
DROP POLICY IF EXISTS orders_select ON public.orders;
DROP POLICY IF EXISTS orders_insert ON public.orders;

CREATE POLICY orders_select
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY orders_insert
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =========================================
-- 8. SEED
-- =========================================
INSERT INTO public.neighborhoods (name, delivery_fee)
VALUES
('Centro', 5.00),
('Gonzaga', 6.00),
('Boqueirão', 6.00),
('Embaré', 7.00),
('Aparecida', 7.00),
('Ponta da Praia', 8.00)
ON CONFLICT (name) DO NOTHING;
