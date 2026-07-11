-- Fixes based on client feedback from WhatsApp screenshots

-- 1. Home Cleaning Service (ID: 66660000-0000-4000-8000-000000000009)
-- Ensure base price is 2698
UPDATE public.services SET price = 2698 WHERE id = '66660000-0000-4000-8000-000000000009';

-- Add/Update variants
-- Using specific IDs to prevent duplicates and allow updates
INSERT INTO public.service_variants (id, service_id, name, price) 
VALUES 
  ('77770000-0000-4000-8000-000000000011', '66660000-0000-4000-8000-000000000009', 'Single Bedroom Home Cleaning', 2698),
  ('77770000-0000-4000-8000-000000000012', '66660000-0000-4000-8000-000000000009', 'Two Bedroom Home Cleaning', 5000),
  ('77770000-0000-4000-8000-000000000013', '66660000-0000-4000-8000-000000000009', 'Three Bedroom Home Cleaning', 6500)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price;

-- 2. Complete Kitchen Cleaning Service (ID: 66660000-0000-4000-8000-000000000007)
-- Set base price to 999
UPDATE public.services SET price = 999 WHERE id = '66660000-0000-4000-8000-000000000007';

-- Add/Update 'Classic Kitchen Cleaning' variant
INSERT INTO public.service_variants (id, service_id, name, price) 
VALUES ('77770000-0000-4000-8000-000000000014', '66660000-0000-4000-8000-000000000007', 'Classic Kitchen Cleaning', 999)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price;

-- 3. Car Wash Service (ID: 66660000-0000-4000-8000-000000000004)
UPDATE public.services SET price = 499 WHERE id = '66660000-0000-4000-8000-000000000004';
