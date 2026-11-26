
-- 1) Remove PII / internal tables from Realtime publication so authenticated
--    end-users (customers signed in via Auth) cannot subscribe and receive
--    live customer PII, cash register state, or stock movements.
ALTER PUBLICATION supabase_realtime DROP TABLE public.customers;
ALTER PUBLICATION supabase_realtime DROP TABLE public.cash_registers;
ALTER PUBLICATION supabase_realtime DROP TABLE public.stock_movements;
ALTER PUBLICATION supabase_realtime DROP TABLE public.ingredients;

-- 2) Restrict kitchen UPDATE on orders to status/notes only via trigger.
CREATE OR REPLACE FUNCTION public.enforce_kitchen_update_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce when the caller is a kitchen user without admin/operator.
  IF public.is_cozinha(auth.uid())
     AND NOT public.is_admin(auth.uid())
     AND NOT public.has_role(auth.uid(), 'operator'::app_role) THEN
    IF NEW.total IS DISTINCT FROM OLD.total
       OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
       OR NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
       OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
       OR NEW.pix_gateway_id IS DISTINCT FROM OLD.pix_gateway_id
       OR NEW.pix_validation_status IS DISTINCT FROM OLD.pix_validation_status
       OR NEW.pix_human_verified IS DISTINCT FROM OLD.pix_human_verified
       OR NEW.pix_validation_confidence IS DISTINCT FROM OLD.pix_validation_confidence
       OR NEW.pix_fraud_signals IS DISTINCT FROM OLD.pix_fraud_signals
       OR NEW.pix_transaction_id IS DISTINCT FROM OLD.pix_transaction_id
       OR NEW.pix_bank_name IS DISTINCT FROM OLD.pix_bank_name
       OR NEW.pix_receipt_url IS DISTINCT FROM OLD.pix_receipt_url
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.items IS DISTINCT FROM OLD.items
       OR NEW.external_id IS DISTINCT FROM OLD.external_id
       OR NEW.source IS DISTINCT FROM OLD.source
       OR NEW.guest_name IS DISTINCT FROM OLD.guest_name
       OR NEW.guest_phone IS DISTINCT FROM OLD.guest_phone THEN
      RAISE EXCEPTION 'Kitchen role can only update status/notes on orders';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_kitchen_update_scope_trg ON public.orders;
CREATE TRIGGER enforce_kitchen_update_scope_trg
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_kitchen_update_scope();

-- 3) Lock down SECURITY DEFINER helper functions: revoke broad EXECUTE
--    and grant only to authenticated. (anon should never call role checks.)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_cozinha(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_estoque(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_operator_or_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_pdv_user(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_any_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_open_register(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_tab_by_number(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_pix_validation(uuid, text, integer, text[], text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_product_stock(uuid, integer) FROM PUBLIC, anon;
