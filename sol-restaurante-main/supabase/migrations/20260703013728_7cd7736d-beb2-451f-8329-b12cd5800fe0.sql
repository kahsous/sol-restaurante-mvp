
DO $$
DECLARE
  t TEXT;
  all_tables TEXT[] := ARRAY[
    'products','categories','orders','customers','tabs','cash_registers','cash_movements',
    'ingredients','product_recipes','restaurant_settings','option_groups','options',
    'stock_movements','deliveries','neighborhoods','closed_dates','cancellation_reasons',
    'printer_config','scale_config','alert_config','ifood_config','waste_control',
    'delivery_expenses','addresses','print_logs','shipping_events','admin_notifications',
    'companies','user_roles'
  ];
BEGIN
  FOREACH t IN ARRAY all_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN tenant_id SET DEFAULT public.current_tenant_id()', t);
  END LOOP;
END $$;
