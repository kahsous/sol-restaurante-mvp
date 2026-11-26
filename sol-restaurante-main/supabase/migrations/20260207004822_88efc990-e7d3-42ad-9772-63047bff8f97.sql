-- 1. Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  contact_person TEXT,
  phone TEXT,
  monthly_limit NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins have full access to companies"
ON public.companies
FOR ALL
USING (public.is_admin(auth.uid()));

-- Operators can view companies (to link orders)
CREATE POLICY "Operators can view companies"
ON public.companies
FOR SELECT
USING (public.has_role(auth.uid(), 'operator'));

-- Trigger for updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add company_id to orders table
ALTER TABLE public.orders
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- 3. Add company_id to tabs table
ALTER TABLE public.tabs
ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- 4. Create company consumption view (admin only)
CREATE OR REPLACE VIEW public.company_consumption
WITH (security_invoker = on)
AS SELECT 
  c.id AS company_id,
  c.name AS company_name,
  c.cnpj,
  c.monthly_limit,
  DATE_TRUNC('month', o.created_at) AS month,
  COUNT(o.id) AS order_count,
  COALESCE(SUM(o.total), 0) AS total_consumed
FROM public.companies c
LEFT JOIN public.orders o ON o.company_id = c.id AND o.status = 'completed'
GROUP BY c.id, c.name, c.cnpj, c.monthly_limit, DATE_TRUNC('month', o.created_at);

COMMENT ON VIEW public.company_consumption IS 'Monthly consumption report per company - admin only';