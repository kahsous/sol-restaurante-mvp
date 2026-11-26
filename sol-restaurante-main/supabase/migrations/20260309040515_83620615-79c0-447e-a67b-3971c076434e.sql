
-- Add PIX validation status columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pix_validation_status text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pix_validation_confidence integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pix_fraud_signals text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pix_transaction_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pix_bank_name text DEFAULT NULL;

-- Update the validation function to also save the result
CREATE OR REPLACE FUNCTION public.save_pix_validation(
  _order_id uuid,
  _status text,
  _confidence integer,
  _fraud_signals text[],
  _transaction_id text,
  _bank_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET
    pix_validation_status = _status,
    pix_validation_confidence = _confidence,
    pix_fraud_signals = _fraud_signals,
    pix_transaction_id = _transaction_id,
    pix_bank_name = _bank_name
  WHERE id = _order_id
    AND payment_method = 'pix';

  RETURN FOUND;
END;
$$;
