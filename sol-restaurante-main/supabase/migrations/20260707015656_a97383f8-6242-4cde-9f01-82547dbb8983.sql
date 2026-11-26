CREATE POLICY "user_roles_tenant_isolation"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (tenant_id = current_tenant_id() OR is_super_admin(auth.uid()))
WITH CHECK (tenant_id = current_tenant_id() OR is_super_admin(auth.uid()));