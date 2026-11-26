-- Allow anonymous users to view tabs by tab_number (for QR code comanda access)
CREATE POLICY "Public can view tabs by tab_number"
ON public.tabs
FOR SELECT
TO anon
USING (true);
