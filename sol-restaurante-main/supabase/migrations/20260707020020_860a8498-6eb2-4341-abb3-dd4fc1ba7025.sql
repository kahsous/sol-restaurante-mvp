-- 1) Restrict tenants SELECT policy: no more "is_active = true" broad exposure of owner/plan/etc.
DROP POLICY IF EXISTS "Public can view active tenants" ON public.tenants;

CREATE POLICY "Tenants visible to own members or super admin"
ON public.tenants
FOR SELECT
TO public
USING (
  is_super_admin(auth.uid())
  OR id = current_tenant_id()
);

-- 2) Safe public view for the storefront picker (only non-sensitive columns).
CREATE OR REPLACE VIEW public.public_tenants
WITH (security_invoker = true)
AS
SELECT id, slug, name, business_type, logo_url, primary_color
FROM public.tenants
WHERE is_active = true;

GRANT SELECT ON public.public_tenants TO anon, authenticated;