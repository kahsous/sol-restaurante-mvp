
-- =========================================
-- FASE 1: FUNDAÇÃO MULTI-TENANT
-- =========================================

-- 1. Adiciona 'super_admin' ao enum app_role (não pode ser usado nesta mesma transação)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 2. Cria tabela tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'restaurante',
  owner_user_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  plan TEXT NOT NULL DEFAULT 'free',
  logo_url TEXT,
  primary_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tenants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Seed do tenant Sol Nascente
INSERT INTO public.tenants (slug, name, business_type, owner_user_id)
SELECT 'sol-nascente', 'Sol Nascente', 'restaurante',
       (SELECT user_id FROM public.user_roles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'sol-nascente');

-- 4. Adiciona tenant_id em user_roles e backfill
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

UPDATE public.user_roles
SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'sol-nascente')
WHERE tenant_id IS NULL;

-- 5. Adiciona tenant_id em todas as tabelas operacionais
DO $$
DECLARE
  v_tenant UUID := (SELECT id FROM public.tenants WHERE slug = 'sol-nascente');
  t TEXT;
  tables TEXT[] := ARRAY[
    'products','categories','orders','customers','tabs','cash_registers','cash_movements',
    'ingredients','product_recipes','restaurant_settings','option_groups','options',
    'stock_movements','deliveries','neighborhoods','closed_dates','cancellation_reasons',
    'printer_config','scale_config','alert_config','ifood_config','waste_control',
    'delivery_expenses','addresses','print_logs','shipping_events','admin_notifications',
    'companies'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE', t);
    EXECUTE format('UPDATE public.%I SET tenant_id = %L WHERE tenant_id IS NULL', t, v_tenant);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_tenant_id ON public.%I(tenant_id)', t, t);
  END LOOP;
END $$;

-- 6. Função utilitária: tenant do usuário atual
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND tenant_id IS NOT NULL
  LIMIT 1;
$$;

-- 7. Função utilitária: verifica se é super_admin (checagem por texto p/ evitar problema de enum recém-criado)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = 'super_admin'
  );
$$;

-- 8. Função utilitária: verifica se um tenant é ativo (usada por leituras públicas de menu)
CREATE OR REPLACE FUNCTION public.is_active_tenant(_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.tenants WHERE id = _tenant_id AND is_active = true);
$$;

-- 9. RLS de tenants
DROP POLICY IF EXISTS "Public can view active tenants" ON public.tenants;
CREATE POLICY "Public can view active tenants"
ON public.tenants FOR SELECT
USING (is_active = true OR public.is_super_admin(auth.uid()) OR id = public.current_tenant_id());

DROP POLICY IF EXISTS "Super admin manages tenants" ON public.tenants;
CREATE POLICY "Super admin manages tenants"
ON public.tenants FOR ALL
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Tenant admin can update own tenant" ON public.tenants;
CREATE POLICY "Tenant admin can update own tenant"
ON public.tenants FOR UPDATE
USING (id = public.current_tenant_id() AND public.is_admin(auth.uid()))
WITH CHECK (id = public.current_tenant_id() AND public.is_admin(auth.uid()));

-- 10. Restrictive policy: isolamento de tenant nas tabelas STAFF-ONLY.
-- Restrictive policies fazem AND com todas as permissive existentes,
-- então isso IMPEDE que policies antigas vazem dados entre tenants.
DO $$
DECLARE
  t TEXT;
  staff_tables TEXT[] := ARRAY[
    'orders','customers','cash_registers','cash_movements','ingredients',
    'product_recipes','stock_movements','waste_control','delivery_expenses',
    'deliveries','print_logs','shipping_events','admin_notifications',
    'ifood_config','tabs','companies','addresses'
  ];
BEGIN
  FOREACH t IN ARRAY staff_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I AS RESTRICTIVE
       USING (tenant_id = public.current_tenant_id() OR public.is_super_admin(auth.uid()) OR tenant_id IS NULL)
       WITH CHECK (tenant_id = public.current_tenant_id() OR public.is_super_admin(auth.uid()))',
      t
    );
  END LOOP;
END $$;

-- 11. Restrictive policy para tabelas de catálogo com leitura pública:
-- Leitura livre (o cliente filtra por tenant_id na query), mas escrita só do próprio tenant.
DO $$
DECLARE
  t TEXT;
  catalog_tables TEXT[] := ARRAY[
    'products','categories','option_groups','options','neighborhoods',
    'restaurant_settings','closed_dates','cancellation_reasons',
    'printer_config','scale_config','alert_config'
  ];
BEGIN
  FOREACH t IN ARRAY catalog_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_write_isolation ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY tenant_write_isolation ON public.%I AS RESTRICTIVE
       FOR ALL
       USING (
         current_setting(''request.method'', true) = ''GET''
         OR tenant_id = public.current_tenant_id()
         OR public.is_super_admin(auth.uid())
       )
       WITH CHECK (
         tenant_id = public.current_tenant_id()
         OR public.is_super_admin(auth.uid())
       )',
      t
    );
  END LOOP;
END $$;

-- 12. Atualiza is_pdv_user e is_admin para incluir super_admin (opcional — super_admin não é operacional,
-- então NÃO é pdv_user. Mantemos como está.)

-- 13. Torna tenant_id NOT NULL onde já foi backfilled (garante integridade em novos inserts)
DO $$
DECLARE
  t TEXT;
  required_tables TEXT[] := ARRAY[
    'products','categories','orders','customers','tabs','cash_registers','cash_movements',
    'ingredients','product_recipes','restaurant_settings','option_groups','options',
    'stock_movements','deliveries','neighborhoods','closed_dates','cancellation_reasons',
    'printer_config','scale_config','alert_config','ifood_config','waste_control',
    'delivery_expenses','print_logs','shipping_events','admin_notifications','companies'
  ];
BEGIN
  FOREACH t IN ARRAY required_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tenant_id SET NOT NULL', t);
  END LOOP;
END $$;

-- addresses fica nullable (endereços de convidado podem existir antes de escolher tenant)
