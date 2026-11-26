
CREATE TABLE public.print_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_type text NOT NULL, -- 'tab_item', 'order_kitchen', 'tab_receipt', 'order_receipt', 'cash_close'
  reference_id text NOT NULL,
  item_key text, -- unique key for anti-duplication (e.g. tab_id + item_id + size + timestamp)
  printer_type text NOT NULL DEFAULT 'kitchen', -- 'kitchen' or 'cashier'
  tab_number integer,
  order_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.print_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PDV users can view print_logs" ON public.print_logs FOR SELECT TO authenticated USING (public.is_pdv_user(auth.uid()));
CREATE POLICY "PDV users can insert print_logs" ON public.print_logs FOR INSERT TO authenticated WITH CHECK (public.is_pdv_user(auth.uid()));
CREATE POLICY "Admins full access print_logs" ON public.print_logs FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE INDEX idx_print_logs_item_key ON public.print_logs(item_key);
CREATE INDEX idx_print_logs_reference ON public.print_logs(reference_type, reference_id);
