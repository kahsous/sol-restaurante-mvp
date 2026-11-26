
-- Validation function for order items JSONB structure
CREATE OR REPLACE FUNCTION public.validate_order_items(items jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  item_id text;
BEGIN
  -- Must be an array
  IF jsonb_typeof(items) != 'array' THEN
    RETURN false;
  END IF;

  -- Must have at least one item
  IF jsonb_array_length(items) = 0 THEN
    RETURN false;
  END IF;

  -- Cap at 50 items per order
  IF jsonb_array_length(items) > 50 THEN
    RETURN false;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    -- Required field: id (UUID string)
    item_id := item->>'id';
    IF item_id IS NULL OR length(item_id) != 36 THEN
      RETURN false;
    END IF;

    -- Required field: name (non-empty string, max 200 chars)
    IF item->>'name' IS NULL OR length(item->>'name') = 0 OR length(item->>'name') > 200 THEN
      RETURN false;
    END IF;

    -- Required field: quantity (positive integer, max 100)
    IF (item->>'quantity') IS NULL 
       OR (item->>'quantity')::int <= 0 
       OR (item->>'quantity')::int > 100 THEN
      RETURN false;
    END IF;

    -- Validate size if present (must be one of allowed values)
    IF item->>'size' IS NOT NULL AND item->>'size' NOT IN ('pequena', 'media', 'grande') THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

-- Trigger function to enforce validation on insert/update
CREATE OR REPLACE FUNCTION public.check_order_items()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.validate_order_items(NEW.items) THEN
    RAISE EXCEPTION 'Invalid order items structure: must be a non-empty array with valid id, name, and positive quantity for each item';
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to orders table
CREATE TRIGGER trg_validate_order_items
  BEFORE INSERT OR UPDATE OF items ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_order_items();
