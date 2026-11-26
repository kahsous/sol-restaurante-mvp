-- Promote the existing administrator account to Super Administrator without
-- creating a duplicate auth user or changing authentication data/passwords/sessions.
DO $$
DECLARE
  target_user_id uuid;
  target_role_id uuid;
BEGIN
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'karine_sousa.s@hotmail.com'
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO target_role_id
  FROM public.user_roles
  WHERE user_id = target_user_id AND role = 'admin'::public.app_role
  ORDER BY id
  LIMIT 1;

  IF target_role_id IS NOT NULL THEN
    UPDATE public.user_roles
    SET role = 'super_admin'::public.app_role,
        tenant_id = NULL
    WHERE id = target_role_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = target_user_id AND role = 'super_admin'::public.app_role
  ) THEN
    RAISE NOTICE 'Existing administrator account % has no admin role row to promote.', target_user_id;
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = target_user_id
    AND role = 'admin'::public.app_role;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_operator_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'operator', 'super_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.has_any_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role IN ('admin', 'super_admin')
  )
$$;
