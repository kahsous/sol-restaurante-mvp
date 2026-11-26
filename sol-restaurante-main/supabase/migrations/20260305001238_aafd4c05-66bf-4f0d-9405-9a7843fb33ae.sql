
-- Add delivery_type to orders (own = entrega própria, third_party = terceirizada)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT NULL;

-- Add delivery status values - update orders status to allow new delivery statuses
-- We'll use: pending, preparing, ready, out_for_delivery, delivered, completed

-- Create delivery_expenses table for tracking third-party delivery costs
CREATE TABLE public.delivery_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  cash_register_id uuid REFERENCES public.cash_registers(id),
  amount numeric NOT NULL,
  description text DEFAULT 'Pagamento de Entregador',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to delivery_expenses"
  ON public.delivery_expenses FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Operators can view delivery_expenses"
  ON public.delivery_expenses FOR SELECT
  USING (has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "Operators can create delivery_expenses"
  ON public.delivery_expenses FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'operator'::app_role));
