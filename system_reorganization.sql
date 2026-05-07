-- Full System Reorganization for Surya Home Service

-- 1. CLEANUP CATEGORIES
-- Rename and redefine categories
UPDATE public.service_categories SET name = 'Appliance Cleaning', description = 'Refrigerator, Fan, and Home Appliance cleaning', icon = 'Refrigerator' WHERE id = '44440000-0000-4000-8000-000000000001';
UPDATE public.service_categories SET name = 'Full Home Cleaning', description = 'Complete deep cleaning for empty or occupied homes', icon = 'Home' WHERE id = '44440000-0000-4000-8000-000000000006';
UPDATE public.service_categories SET name = 'Bathroom Cleaning', description = 'Deep cleaning for bathrooms, toilets, and basins', icon = 'Bath' WHERE id = '44440000-0000-4000-8000-000000000008';

-- Create Sofa & Furniture Category
INSERT INTO public.service_categories (id, name, description, icon, category_type) 
VALUES ('44440000-0000-4000-8000-000000000009', 'Sofa & Furniture Cleaning', 'Professional shampooing for sofas, chairs, and carpets', 'Sofa', 'standard')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, icon = EXCLUDED.icon;

-- Deactivate redundant old categories
UPDATE public.service_categories SET is_active = false WHERE id IN (
  'b1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'b3333333-3333-3333-3333-333333333333',
  'b4444444-4444-4444-4444-444444444444',
  'b5555555-5555-5555-5555-555555555555'
);

-- 2. MOVE AND RENAME SERVICES
-- Bathroom
UPDATE public.services SET name = 'Complete Bathroom Cleaning', category_id = '44440000-0000-4000-8000-000000000008', price = 149 WHERE id = '66660000-0000-4000-8000-00000000000f';

-- Sofa
UPDATE public.services SET name = 'Sofa & Upholstery Cleaning', category_id = '44440000-0000-4000-8000-000000000009', price = 125 WHERE id = '66660000-0000-4000-8000-00000000000e';

-- Appliances
UPDATE public.services SET category_id = '44440000-0000-4000-8000-000000000001' WHERE id IN ('66660000-0000-4000-8000-000000000001', '66660000-0000-4000-8000-000000000010');

-- Home Cleaning
UPDATE public.services SET category_id = '44440000-0000-4000-8000-000000000006' WHERE id IN ('66660000-0000-4000-8000-000000000009', '66660000-0000-4000-8000-000000000008', '66660000-0000-4000-8000-000000000002');

-- Kitchen
UPDATE public.services SET price = 499 WHERE id = '66660000-0000-4000-8000-000000000007';

-- 3. VARIANT CLEANUP
-- Delete redundant or confusing variants
DELETE FROM public.service_variants WHERE name = 'Badi Toilet (Large)';

-- Rename existing variants for professional look
UPDATE public.service_variants SET name = 'Classic Bathroom Cleaning' WHERE name = 'Classic' AND service_id = '66660000-0000-4000-8000-00000000000f';
UPDATE public.service_variants SET name = 'Deep Bathroom Cleaning' WHERE name = 'Deep Cleaning' AND service_id = '66660000-0000-4000-8000-00000000000f';
UPDATE public.service_variants SET name = 'Move-In / Empty Bathroom Cleaning' WHERE name = 'Move-in Intense' AND service_id = '66660000-0000-4000-8000-00000000000f';
UPDATE public.service_variants SET name = 'Classic Kitchen Cleaning' WHERE name = 'Classic' AND service_id = '66660000-0000-4000-8000-000000000007';

-- Ensure Wash Basin and WC are correctly named
UPDATE public.service_variants SET name = 'Toilet / WC Cleaning Only', price = 249 WHERE name = 'WC / Toilet Cleaning';
UPDATE public.service_variants SET name = 'Wash Basin Cleaning Only' WHERE name = 'Wash Basin Cleaning';
