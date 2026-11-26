
-- 1. Allow PDV users to read admin notifications
CREATE POLICY "PDV users can read notifications"
ON public.admin_notifications
FOR SELECT
TO authenticated
USING (public.is_pdv_user(auth.uid()));

-- 2. Attach kitchen column-restriction trigger to orders
DROP TRIGGER IF EXISTS enforce_kitchen_update_scope_trg ON public.orders;
CREATE TRIGGER enforce_kitchen_update_scope_trg
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_kitchen_update_scope();

-- 3. Lock down realtime.messages so only PDV users receive broadcasts
--    for tables that carry sensitive/guest PII data.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PDV users receive realtime messages" ON realtime.messages;
CREATE POLICY "PDV users receive realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.is_pdv_user(auth.uid()));
