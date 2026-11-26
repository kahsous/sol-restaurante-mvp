
-- Function to cancel a recent order (within 10 minutes, only pending orders)
CREATE OR REPLACE FUNCTION public.cancel_guest_order(_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.orders
  WHERE id = _order_id
    AND status = 'pending'
    AND user_id IS NULL
    AND created_at > now() - interval '10 minutes';
  
  RETURN FOUND;
END;
$$;
