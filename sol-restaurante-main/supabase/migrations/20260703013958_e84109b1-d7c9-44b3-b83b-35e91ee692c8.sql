
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
    -- Restrict INSERT
    EXECUTE format(
      'CREATE POLICY tenant_insert_isolation ON public.%I AS RESTRICTIVE
       FOR INSERT
       WITH CHECK (tenant_id = public.current_tenant_id() OR public.is_super_admin(auth.uid()))',
      t
    );
    -- Restrict UPDATE
    EXECUTE format(
      'CREATE POLICY tenant_update_isolation ON public.%I AS RESTRICTIVE
       FOR UPDATE
       USING (tenant_id = public.current_tenant_id() OR public.is_super_admin(auth.uid()))
       WITH CHECK (tenant_id = public.current_tenant_id() OR public.is_super_admin(auth.uid()))',
      t
    );
    -- Restrict DELETE
    EXECUTE format(
      'CREATE POLICY tenant_delete_isolation ON public.%I AS RESTRICTIVE
       FOR DELETE
       USING (tenant_id = public.current_tenant_id() OR public.is_super_admin(auth.uid()))',
      t
    );
  END LOOP;
END $$;
