
-- Stock movements history table
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'entry', 'exit', 'adjustment'
  quantity integer NOT NULL,
  previous_stock integer NOT NULL DEFAULT 0,
  new_stock integer NOT NULL DEFAULT 0,
  reason text,
  reference_id text, -- order_id or tab_id
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to stock_movements" ON public.stock_movements FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Stock role can manage stock_movements" ON public.stock_movements FOR ALL USING (is_estoque(auth.uid()));
CREATE POLICY "Operators can view stock_movements" ON public.stock_movements FOR SELECT USING (has_role(auth.uid(), 'operator'::app_role));
CREATE POLICY "Operators can create stock_movements" ON public.stock_movements FOR INSERT WITH CHECK (has_role(auth.uid(), 'operator'::app_role));

-- Alert config table for sound settings
CREATE TABLE public.alert_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage alert_config" ON public.alert_config FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "PDV users can view alert_config" ON public.alert_config FOR SELECT USING (is_pdv_user(auth.uid()));

-- Seed default alert configs
INSERT INTO public.alert_config (key, enabled) VALUES 
  ('new_online_order', true),
  ('new_tab_opened', true),
  ('item_to_kitchen', true);

-- Enable realtime for stock_movements
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements;
