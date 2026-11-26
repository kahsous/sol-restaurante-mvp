-- Create cash register sessions table
CREATE TABLE public.cash_registers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    opened_at timestamp with time zone NOT NULL DEFAULT now(),
    closed_at timestamp with time zone,
    opening_balance numeric NOT NULL DEFAULT 0,
    closing_balance numeric,
    expected_balance numeric,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create cash movements table (for tracking all transactions)
CREATE TABLE public.cash_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_register_id uuid REFERENCES public.cash_registers(id) ON DELETE CASCADE NOT NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    type text NOT NULL CHECK (type IN ('sale', 'withdrawal', 'deposit', 'change')),
    payment_method text NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'pix')),
    amount numeric NOT NULL,
    description text,
    drawer_opened boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for cash_registers
CREATE POLICY "PDV users can view all cash registers"
ON public.cash_registers
FOR SELECT
USING (public.is_pdv_user(auth.uid()));

CREATE POLICY "PDV users can create cash registers"
ON public.cash_registers
FOR INSERT
WITH CHECK (public.is_pdv_user(auth.uid()));

CREATE POLICY "PDV users can update cash registers"
ON public.cash_registers
FOR UPDATE
USING (public.is_pdv_user(auth.uid()));

-- RLS policies for cash_movements
CREATE POLICY "PDV users can view all cash movements"
ON public.cash_movements
FOR SELECT
USING (public.is_pdv_user(auth.uid()));

CREATE POLICY "PDV users can create cash movements"
ON public.cash_movements
FOR INSERT
WITH CHECK (public.is_pdv_user(auth.uid()));

-- Enable realtime for cash_registers
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_registers;