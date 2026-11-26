-- Fix kitchen views and company_consumption to enforce RLS via security_invoker

-- Recreate orders_kitchen with security_invoker so base table RLS is enforced
CREATE OR REPLACE VIEW public.orders_kitchen
WITH (security_invoker = on) AS
SELECT id,
    status,
    created_at,
    notes,
    ( SELECT jsonb_agg(jsonb_build_object('name', (item.value ->> 'name'::text), 'quantity', (item.value ->> 'quantity'::text), 'size', (item.value ->> 'size'::text), 'description', (item.value ->> 'description'::text))) AS jsonb_agg
           FROM jsonb_array_elements(orders.items) item(value)) AS items_display,
    guest_name,
    guest_neighborhood_name
   FROM orders;

-- Recreate tabs_kitchen with security_invoker so base table RLS is enforced
CREATE OR REPLACE VIEW public.tabs_kitchen
WITH (security_invoker = on) AS
SELECT id,
    tab_number,
    code,
    type,
    status,
    customer_name,
    notes,
    updated_at,
    created_at,
    ( SELECT jsonb_agg(jsonb_build_object('name', (item.value ->> 'name'::text), 'quantity', (item.value ->> 'quantity'::text), 'size', (item.value ->> 'size'::text))) AS jsonb_agg
           FROM jsonb_array_elements(t.items) item(value)) AS items_display
   FROM tabs t
  WHERE (status = ANY (ARRAY['open'::text, 'consuming'::text]));

-- Recreate company_consumption with security_invoker so base table RLS is enforced
CREATE OR REPLACE VIEW public.company_consumption
WITH (security_invoker = on) AS
SELECT c.id AS company_id,
    c.name AS company_name,
    c.cnpj,
    c.monthly_limit,
    date_trunc('month'::text, o.created_at) AS month,
    count(o.id) AS order_count,
    COALESCE(sum(o.total), (0)::numeric) AS total_consumed
   FROM (companies c
     LEFT JOIN orders o ON (((o.company_id = c.id) AND (o.status = 'completed'::text))))
  GROUP BY c.id, c.name, c.cnpj, c.monthly_limit, (date_trunc('month'::text, o.created_at));