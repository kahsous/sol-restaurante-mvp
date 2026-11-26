
-- Drop the overly permissive update policy
DROP POLICY "Anyone can update pix_receipt_url on orders" ON public.orders;

-- Create a secure function to update pix receipt URL
CREATE OR REPLACE FUNCTION public.update_pix_receipt(
  _order_id uuid,
  _receipt_url text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET pix_receipt_url = _receipt_url
  WHERE id = _order_id
    AND payment_method = 'pix'
    AND pix_receipt_url IS NULL;
  
  RETURN FOUND;
END;
$$;
