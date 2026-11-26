-- Drop the overly permissive upload policy
DROP POLICY IF EXISTS "Anyone can upload pix receipts" ON storage.objects;

-- Create a more restrictive upload policy (still allows unauthenticated uploads since guests need to upload receipts,
-- but restricts to image file extensions only)
CREATE POLICY "Upload pix receipts with restrictions"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pix-receipts'
  AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp'))
  AND (octet_length(name) <= 200)
);

-- Replace the public view policy with PDV-only access
-- Guest uploads use the URL via edge function (service role), so public read is not needed
DROP POLICY IF EXISTS "Anyone can view pix receipts" ON storage.objects;

CREATE POLICY "PDV users can view pix receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'pix-receipts'
  AND is_pdv_user(auth.uid())
);