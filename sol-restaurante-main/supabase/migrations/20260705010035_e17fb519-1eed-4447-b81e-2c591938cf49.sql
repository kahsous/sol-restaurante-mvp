
-- 1) Server-side pricing enforcement for guest/site orders
CREATE OR REPLACE FUNCTION public.enforce_order_pricing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_items jsonb := '[]'::jsonb;
  it jsonb;
  prod_id uuid;
  prod RECORD;
  size_txt text;
  base_price numeric;
  qty int;
  opts jsonb;
  opt jsonb;
  opt_id uuid;
  opt_delta numeric;
  opt_total numeric;
  unit_price numeric;
  computed_subtotal numeric := 0;
  computed_delivery_fee numeric := 0;
  nb_fee numeric;
BEGIN
  -- Only enforce for guest/site orders. iFood/PDV/kitchen updates keep their own pricing.
  IF COALESCE(NEW.source, 'site') <> 'site' THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF jsonb_typeof(NEW.items) <> 'array' OR jsonb_array_length(NEW.items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  FOR it IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    prod_id := (it->>'id')::uuid;
    size_txt := COALESCE(it->>'size', 'media');
    qty := COALESCE((it->>'quantity')::int, 1);
    IF qty <= 0 THEN
      RAISE EXCEPTION 'Invalid item quantity';
    END IF;

    SELECT id, price_pequena, price_media, price_grande, tenant_id, is_active
      INTO prod
    FROM public.products
    WHERE id = prod_id;

    IF NOT FOUND OR prod.is_active = false THEN
      RAISE EXCEPTION 'Invalid product: %', prod_id;
    END IF;

    IF prod.tenant_id IS DISTINCT FROM NEW.tenant_id THEN
      RAISE EXCEPTION 'Product/tenant mismatch';
    END IF;

    base_price := CASE size_txt
      WHEN 'pequena' THEN prod.price_pequena
      WHEN 'grande' THEN prod.price_grande
      ELSE prod.price_media
    END;

    opt_total := 0;
    opts := COALESCE(it->'selectedOptions', '[]'::jsonb);
    IF jsonb_typeof(opts) = 'array' THEN
      FOR opt IN SELECT * FROM jsonb_array_elements(opts)
      LOOP
        opt_id := NULLIF(opt->>'optionId','')::uuid;
        IF opt_id IS NULL THEN CONTINUE; END IF;
        SELECT price_delta INTO opt_delta
        FROM public.options
        WHERE id = opt_id AND is_active = true AND tenant_id = NEW.tenant_id;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Invalid option: %', opt_id;
        END IF;
        opt_total := opt_total + COALESCE(opt_delta, 0);
      END LOOP;
    END IF;

    unit_price := base_price + opt_total;
    computed_subtotal := computed_subtotal + (unit_price * qty);

    new_items := new_items || jsonb_build_array(
      jsonb_set(
        jsonb_set(it, '{unitPrice}', to_jsonb(unit_price), true),
        '{quantity}', to_jsonb(qty), true
      )
    );
  END LOOP;

  -- Delivery fee from neighborhood
  IF NEW.delivery_type = 'delivery' AND NEW.neighborhood_id IS NOT NULL THEN
    SELECT delivery_fee INTO nb_fee
    FROM public.neighborhoods
    WHERE id = NEW.neighborhood_id AND is_active = true AND tenant_id = NEW.tenant_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid neighborhood';
    END IF;
    computed_delivery_fee := COALESCE(nb_fee, 0);
  ELSE
    computed_delivery_fee := 0;
  END IF;

  NEW.items := new_items;
  NEW.subtotal := computed_subtotal;
  NEW.delivery_fee := computed_delivery_fee;
  NEW.total := computed_subtotal + computed_delivery_fee;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_pricing ON public.orders;
CREATE TRIGGER trg_enforce_order_pricing
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_pricing();

-- 2) Tenant isolation: remove the NULL bypass from RESTRICTIVE policies
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'addresses','admin_notifications','cash_movements','cash_registers','companies',
    'customers','deliveries','delivery_expenses','ifood_config','ingredients','orders',
    'print_logs','product_recipes','shipping_events','stock_movements','tabs','waste_control'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', t);
    EXECUTE format($p$
      CREATE POLICY tenant_isolation ON public.%I
      AS RESTRICTIVE
      USING (
        tenant_id IS NOT NULL
        AND (tenant_id = current_tenant_id() OR is_super_admin(auth.uid()))
      )
      WITH CHECK (
        tenant_id IS NOT NULL
        AND (tenant_id = current_tenant_id() OR is_super_admin(auth.uid()))
      )
    $p$, t);
  END LOOP;
END $$;
