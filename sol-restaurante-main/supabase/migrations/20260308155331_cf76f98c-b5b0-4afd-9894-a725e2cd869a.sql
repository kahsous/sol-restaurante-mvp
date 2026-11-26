
-- Add price_pequena column to products
ALTER TABLE products ADD COLUMN price_pequena numeric NOT NULL DEFAULT 0;

-- Set P price (R$20) for standard weekly dishes (those with M=24, G=30)
UPDATE products SET price_pequena = 20 
WHERE category_id = '11111111-0001-0001-0001-000000000001' 
AND price_media = 24 AND price_grande = 30;

-- Hide from site: Comida por quilo, Buffet com mistura controlada, Prato feito, Mistura por quilo
UPDATE products SET availability = 'restaurant' 
WHERE name IN ('Comida por quilo', 'Buffet com mistura controlada', 'Prato feito', 'Mistura por quilo');
