
ALTER TABLE public.products 
ADD COLUMN availability_pequena text NOT NULL DEFAULT 'both',
ADD COLUMN availability_media text NOT NULL DEFAULT 'both',
ADD COLUMN availability_grande text NOT NULL DEFAULT 'both';
