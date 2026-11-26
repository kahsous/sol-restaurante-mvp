CREATE OR REPLACE FUNCTION public.check_product_stock(p_product_id uuid, p_quantity integer DEFAULT 1)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
DECLARE
  v_track_stock BOOLEAN;
  v_stock_quantity INTEGER;
  v_has_recipe BOOLEAN;
  v_ingredients_ok BOOLEAN;
BEGIN
  SELECT track_stock, stock_quantity
  INTO v_track_stock, v_stock_quantity
  FROM public.products
  WHERE id = p_product_id AND is_active = true;
  
  -- Product not found
  IF NOT FOUND THEN
    RETURN true;
  END IF;
  
  -- If tracking stock directly (beverages etc), check quantity
  IF v_track_stock = true THEN
    RETURN COALESCE(v_stock_quantity, 0) >= p_quantity;
  END IF;
  
  -- Check if product has a recipe (ficha técnica)
  SELECT EXISTS (
    SELECT 1 FROM public.product_recipes WHERE product_id = p_product_id
  ) INTO v_has_recipe;
  
  -- If no recipe, allow purchase (no stock control)
  IF NOT v_has_recipe THEN
    RETURN true;
  END IF;
  
  -- Check if all ingredients have sufficient stock for the recipe
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.product_recipes pr
    JOIN public.ingredients i ON i.id = pr.ingredient_id
    WHERE pr.product_id = p_product_id
      AND i.stock_quantity < (pr.quantity * p_quantity)
  ) INTO v_ingredients_ok;
  
  RETURN v_ingredients_ok;
END;
$$;