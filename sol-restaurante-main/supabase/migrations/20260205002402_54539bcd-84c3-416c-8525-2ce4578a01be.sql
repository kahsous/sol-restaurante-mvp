-- Create tabs (comandas) table
CREATE TABLE public.tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'internal' CHECK (type IN ('marmitex', 'internal')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  customer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.tabs ENABLE ROW LEVEL SECURITY;

-- RLS policies - only PDV users can manage tabs
CREATE POLICY "PDV users can view all tabs"
ON public.tabs
FOR SELECT
USING (is_pdv_user(auth.uid()));

CREATE POLICY "PDV users can create tabs"
ON public.tabs
FOR INSERT
WITH CHECK (is_pdv_user(auth.uid()));

CREATE POLICY "PDV users can update tabs"
ON public.tabs
FOR UPDATE
USING (is_pdv_user(auth.uid()));

CREATE POLICY "PDV users can delete tabs"
ON public.tabs
FOR DELETE
USING (is_pdv_user(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_tabs_updated_at
BEFORE UPDATE ON public.tabs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast code lookup (barcode/QR scanning)
CREATE INDEX idx_tabs_code ON public.tabs(code);
CREATE INDEX idx_tabs_status ON public.tabs(status);