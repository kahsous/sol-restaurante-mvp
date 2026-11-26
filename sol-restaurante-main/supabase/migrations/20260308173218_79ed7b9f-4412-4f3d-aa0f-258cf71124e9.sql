CREATE OR REPLACE FUNCTION public.reduce_stock_on_order_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  item JSONB;
  product_id UUID;
  item_quantity INTEGER;
  current_stock INTEGER;
  v_track_stock BOOLEAN;
  recipe_row RECORD;
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      product_id := (item->>'id')::UUID;
      item_quantity := COALESCE((item->>'quantity')::INTEGER, 1);
      
      -- Check if product tracks stock directly
      SELECT track_stock, stock_quantity INTO v_track_stock, current_stock
      FROM public.products
      WHERE id = product_id;
      
      IF NOT FOUND THEN
        CONTINUE;
      END IF;
      
      -- Direct stock tracking (beverages, etc)
      IF v_track_stock = true AND current_stock IS NOT NULL THEN
        UPDATE public.products
        SET stock_quantity = GREATEST(0, stock_quantity - item_quantity)
        WHERE id = product_id;
        
        -- Record stock movement
        INSERT INTO public.stock_movements (product_id, type, quantity, previous_stock, new_stock, reason, reference_id)
        VALUES (product_id, 'exit', item_quantity, current_stock, GREATEST(0, current_stock - item_quantity), 'Venda (pedido)', NEW.id::text);
      END IF;
      
      -- Recipe-based stock deduction (ingredients)
      FOR recipe_row IN
        SELECT pr.ingredient_id, pr.quantity as recipe_qty, i.stock_quantity as ing_stock
        FROM public.product_recipes pr
        JOIN public.ingredients i ON i.id = pr.ingredient_id
        WHERE pr.product_id = product_id
      LOOP
        UPDATE public.ingredients
        SET stock_quantity = GREATEST(0, stock_quantity - (recipe_row.recipe_qty * item_quantity)),
            updated_at = now()
        WHERE id = recipe_row.ingredient_id;
      END LOOP;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;