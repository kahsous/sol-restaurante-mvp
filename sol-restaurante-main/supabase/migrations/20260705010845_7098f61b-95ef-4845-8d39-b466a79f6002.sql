INSERT INTO public.user_roles (user_id, role, tenant_id)
SELECT id, 'super_admin'::app_role, NULL
FROM auth.users
WHERE email = 'karine_sousa.s@hotmail.com'
ON CONFLICT DO NOTHING;