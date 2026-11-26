
ALTER TABLE public.products
ADD COLUMN cost_price numeric DEFAULT NULL,
ADD COLUMN price_multiplier numeric DEFAULT NULL;

COMMENT ON COLUMN public.products.cost_price IS 'Preço de custo do produto';
COMMENT ON COLUMN public.products.price_multiplier IS 'Multiplicador para calcular preço de venda a partir do custo';
