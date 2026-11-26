
-- ÁGUA E ENERGÉTICOS
UPDATE products SET price_media = 4.00, price_grande = 4.00, price_pequena = 4.00
WHERE name = 'Água sem gás 500ml' AND category_id = '11111111-0001-0001-0001-000000000004';

UPDATE products SET price_media = 7.50, price_grande = 7.50, price_pequena = 7.50
WHERE name = 'Água tônica Schweppes' AND category_id = '11111111-0001-0001-0001-000000000004';

UPDATE products SET name = 'Flying', price_media = 8.00, price_grande = 8.00, price_pequena = 8.00
WHERE name = 'Flying energético' AND category_id = '11111111-0001-0001-0001-000000000004';

INSERT INTO products (name, category_id, price_pequena, price_media, price_grande, availability, is_active)
VALUES ('Monster', '11111111-0001-0001-0001-000000000004', 10.00, 10.00, 10.00, 'both', true);

-- CERVEJAS
UPDATE products SET price_media = 5.00, price_grande = 5.00, price_pequena = 5.00
WHERE name = 'Amstel 269ml' AND category_id = '11111111-0001-0001-0001-000000000005';

-- REFRIGERANTES
UPDATE products SET price_media = 7.00, price_grande = 7.00, price_pequena = 7.00
WHERE name = 'Coca-Cola 350ml' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 7.00, price_grande = 7.00, price_pequena = 7.00
WHERE name = 'Coca-Cola 600ml' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 10.00, price_grande = 10.00, price_pequena = 10.00
WHERE name = 'Coca-Cola 1L' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 15.00, price_grande = 15.00, price_pequena = 15.00
WHERE name = 'Coca-Cola 2L' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET name = 'Coca-Cola Zero', price_media = 7.00, price_grande = 7.00, price_pequena = 7.00
WHERE name = 'Coca-Cola Zero 350ml' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET is_active = false
WHERE name IN ('Coca-Cola Zero 600ml', 'Coca-Cola Zero 1L', 'Coca-Cola Zero 2L')
AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 7.00, price_grande = 7.00, price_pequena = 7.00
WHERE name = 'Fanta 350ml' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 7.00, price_grande = 7.00, price_pequena = 7.00
WHERE name = 'Fanta 600ml' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 10.00, price_grande = 10.00, price_pequena = 10.00
WHERE name = 'Fanta 1L' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 15.00, price_grande = 15.00, price_pequena = 15.00
WHERE name = 'Fanta 2L' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 7.00, price_grande = 7.00, price_pequena = 7.00
WHERE name = 'Guaraná Antarctica 350ml' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 7.00, price_grande = 7.00, price_pequena = 7.00
WHERE name = 'Guaraná Antarctica 600ml' AND category_id = '11111111-0001-0001-0001-000000000006';

INSERT INTO products (name, category_id, price_pequena, price_media, price_grande, availability, is_active)
VALUES ('Guaraná Antarctica 1L', '11111111-0001-0001-0001-000000000006', 10.00, 10.00, 10.00, 'both', true);

UPDATE products SET price_media = 7.00, price_grande = 7.00, price_pequena = 7.00
WHERE name = 'Guaraná Zero 350ml' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 7.00, price_grande = 7.00, price_pequena = 7.00
WHERE name = 'Guaraná Zero 600ml' AND category_id = '11111111-0001-0001-0001-000000000006';

INSERT INTO products (name, category_id, price_pequena, price_media, price_grande, availability, is_active)
VALUES ('Guaraná Zero 1L', '11111111-0001-0001-0001-000000000006', 10.00, 10.00, 10.00, 'both', true);

UPDATE products SET name = 'KS (Coca/Fanta) 290ml', price_media = 7.00, price_grande = 7.00, price_pequena = 7.00
WHERE name = 'KS Coca 290ml' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET is_active = false
WHERE name = 'KS Fanta 290ml' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 7.00, price_grande = 7.00, price_pequena = 7.00
WHERE name = 'Itubaína Original 355ml' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 7.00, price_grande = 7.00, price_pequena = 7.00
WHERE name = 'Sprite 350ml' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 8.00, price_grande = 8.00, price_pequena = 8.00
WHERE name = 'Sprite 600ml' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 10.00, price_grande = 10.00, price_pequena = 10.00
WHERE name = 'Sprite 1L' AND category_id = '11111111-0001-0001-0001-000000000006';

UPDATE products SET price_media = 15.00, price_grande = 15.00, price_pequena = 15.00
WHERE name = 'Sprite 2L' AND category_id = '11111111-0001-0001-0001-000000000006';
