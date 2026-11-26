
-- Add 'voucher' to payment_method enum
ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'voucher';

-- Add PIX gateway fields to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pix_gateway_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pix_paid_at timestamp with time zone;
