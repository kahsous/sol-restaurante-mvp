
CREATE TABLE public.closed_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_start date NOT NULL,
  date_end date NOT NULL,
  reason text DEFAULT 'Fechado',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.closed_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access closed_dates" ON public.closed_dates FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view closed_dates" ON public.closed_dates FOR SELECT TO anon, authenticated USING (true);
