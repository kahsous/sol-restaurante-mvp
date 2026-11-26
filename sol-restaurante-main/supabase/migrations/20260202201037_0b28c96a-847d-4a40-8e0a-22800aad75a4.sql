-- Add stock control columns to products
ALTER TABLE public.products
ADD COLUMN stock_quantity integer DEFAULT NULL,
ADD COLUMN track_stock boolean NOT NULL DEFAULT false;

-- Create function to reduce stock when order is completed
CREATE OR REPLACE FUNCTION public.reduce_stock_on_order_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  product_id UUID;
  item_quantity INTEGER;
  current_stock INTEGER;
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Loop through order items
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      product_id := (item->>'id')::UUID;
      item_quantity := COALESCE((item->>'quantity')::INTEGER, 1);
      
      -- Get current stock and check if tracking is enabled
      SELECT stock_quantity INTO current_stock
      FROM public.products
      WHERE id = product_id AND track_stock = true;
      
      -- If product tracks stock, reduce it
      IF FOUND AND current_stock IS NOT NULL THEN
        UPDATE public.products
        SET stock_quantity = GREATEST(0, stock_quantity - item_quantity)
        WHERE id = product_id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for stock reduction
CREATE TRIGGER trigger_reduce_stock_on_order_complete
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.reduce_stock_on_order_complete();

-- Also trigger on insert if order is created with completed status
CREATE TRIGGER trigger_reduce_stock_on_order_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.reduce_stock_on_order_complete();

-- Create function to check stock availability
CREATE OR REPLACE FUNCTION public.check_product_stock(p_product_id UUID, p_quantity INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_track_stock BOOLEAN;
  v_stock_quantity INTEGER;
BEGIN
  SELECT track_stock, stock_quantity
  INTO v_track_stock, v_stock_quantity
  FROM public.products
  WHERE id = p_product_id AND is_active = true;
  
  -- If product not found or doesn't track stock, allow purchase
  IF NOT FOUND OR v_track_stock = false THEN
    RETURN true;
  END IF;
  
  -- If tracking stock, check quantity
  RETURN COALESCE(v_stock_quantity, 0) >= p_quantity;
END;
$$;