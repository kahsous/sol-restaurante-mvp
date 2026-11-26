-- Remove the overly permissive public tabs policy
DROP POLICY IF EXISTS "Public can view tabs by tab_number" ON public.tabs;

-- Create a secure RPC function that returns only the specific tab by number
CREATE OR REPLACE FUNCTION public.get_tab_by_number(_tab_number integer)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_jsonb(t.*) FROM public.tabs t
  WHERE t.tab_number = _tab_number
    AND t.status IN ('open', 'consuming')
  LIMIT 1
$$;