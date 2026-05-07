-- Pricing Updates and New Variants for Surya Home Service

-- 1. Bathroom Cleaning (WC / Toilet Cleaning)
UPDATE public.service_variants SET price = 349 WHERE id = '77770000-0000-4000-8000-000000000001'; -- Classic
UPDATE public.service_variants SET price = 449 WHERE id = '77770000-0000-4000-8000-000000000002'; -- Deep Cleaning
UPDATE public.service_variants SET price = 589 WHERE id = '77770000-0000-4000-8000-000000000004'; -- Move-in Intense
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-00000000000f', 'Wash Basin Cleaning', 149);

-- 2. Kitchen Cleaning
UPDATE public.services SET price = 699 WHERE id = '66660000-0000-4000-8000-000000000006'; -- Kitchen Accessories (Cabinet)
UPDATE public.service_variants SET price = 499 WHERE id = '77770000-0000-4000-8000-000000000005'; -- Chimney Only
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-000000000006', 'Kitchen Cabinet Cleaning', 699);
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-000000000007', 'Deep Kitchen Cleaning', 1399);

-- 3. Home Cleaning
UPDATE public.services SET price = 2698 WHERE id = '66660000-0000-4000-8000-000000000009'; -- Home Cleaning Service
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-000000000009', 'Two Bedroom Home Cleaning', 5000);
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-000000000009', 'Three Bedroom Home Cleaning', 6500);

-- 4. Car Wash
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-000000000004', 'Premium Car Wash (SUV/Large)', 599);
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-000000000004', 'Luxury Car Wash', 699);

-- 5. Fridge Cleaning
UPDATE public.services SET price = 499 WHERE id = '66660000-0000-4000-8000-000000000001'; -- Fridge Cleaning
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-000000000001', 'Double Door Fridge Cleaning', 649);

-- 6. Painting Services
-- Furniture & Fixture
UPDATE public.services SET price = 1640 WHERE id = '66660000-0000-4000-8000-00000000000a'; -- Cabinet price
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-00000000000a', 'Grill Painting', 1350);
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-00000000000a', 'Door Painting', 1349);

-- Outdoor & Utility
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-00000000000b', 'Store Room Painting', 2349);
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-00000000000b', 'Balcony Painting', 3250);
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-00000000000b', 'Terrace Painting', 3149);

-- Single Room
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-00000000000c', 'Kitchen Cabinet Painting', 3340);
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-00000000000c', 'Kitchen Painting', 3340);

-- House Packages
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-00000000000d', '2 Bedroom 1 Bathroom Painting', 11000);
INSERT INTO public.service_variants (service_id, name, price) VALUES ('66660000-0000-4000-8000-00000000000d', '3 Bedroom 1 Bathroom Painting', 14000);
