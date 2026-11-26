-- Create function to check if any admin exists
CREATE OR REPLACE FUNCTION public.has_any_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'
  )
$$;

-- Allow this function to be called by anyone (for initial setup check)
GRANT EXECUTE ON FUNCTION public.has_any_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.has_any_admin() TO authenticated;