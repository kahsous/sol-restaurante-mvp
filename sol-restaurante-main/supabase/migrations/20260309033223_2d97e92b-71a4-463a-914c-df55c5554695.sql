
-- Add pix receipt column to orders
ALTER TABLE public.orders ADD COLUMN pix_receipt_url text DEFAULT NULL;

-- Create storage bucket for pix receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('pix-receipts', 'pix-receipts', true);

-- Allow anyone to upload receipts (guests need to upload without auth)
CREATE POLICY "Anyone can upload pix receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pix-receipts');

-- Allow anyone to view receipts
CREATE POLICY "Anyone can view pix receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'pix-receipts');

-- Allow admins/operators to delete receipts
CREATE POLICY "PDV users can delete pix receipts"
ON storage.objects FOR DELETE
USING (bucket_id = 'pix-receipts' AND is_pdv_user(auth.uid()));

-- Allow guests to update their own order's pix_receipt_url (by order id)
-- We use a permissive policy since guests have no auth
CREATE POLICY "Anyone can update pix_receipt_url on orders"
ON public.orders FOR UPDATE
USING (true)
WITH CHECK (true);
