-- ============================================================================
-- Add service images (hot-linked from external sites — temporary, replace with
-- Supabase Storage uploads before going live) + Chimney Only variant.
-- Source: client-provided URLs (2026-04-27)
-- ============================================================================

-- ---------- 1. Service images ----------

-- Ceiling Fan Cleaning
UPDATE public.services
SET image_url = 'https://www.urbanambiance.com/cdn/shop/articles/how-to-clean-a-ceiling-fan-diy-tips-to-enhance-your-space-174105_300x.jpg?v=1660291392'
WHERE id = '66660000-0000-4000-8000-000000000010';

-- Kitchen Accessories Cleaning Service (will host Chimney variant too)
UPDATE public.services
SET image_url = 'https://content.jdmagicbox.com/v2/comp/delhi/v6/011pxx11.xx11.240218153719.q2v6/catalogue/cleaning-guru-kalkaji-delhi-housekeeping-services-l0tzosod8f-250.jpg'
WHERE id = '66660000-0000-4000-8000-000000000006';

-- Complete Kitchen Cleaning Service
UPDATE public.services
SET image_url = 'https://www.bondcleaningincanberra.com.au/wp-content/uploads/2022/05/hero-3.webp'
WHERE id = '66660000-0000-4000-8000-000000000007';

-- WC / Toilet Cleaning
UPDATE public.services
SET image_url = 'https://way2cleaning.com/wp-content/uploads/2025/02/bathroom-deep-cleaning.png'
WHERE id = '66660000-0000-4000-8000-00000000000f';

-- Home Cleaning Service
UPDATE public.services
SET image_url = 'https://way2cleaning.com/wp-content/uploads/2025/03/Occupied-Apartment-Cleaning.png'
WHERE id = '66660000-0000-4000-8000-000000000009';


-- ---------- 2. Chimney Only variant ----------
-- Added to existing "Kitchen Accessories Cleaning Service" (id ...000000000006)
INSERT INTO public.service_variants (id, service_id, name, description, price, duration, is_active) VALUES
  ('77770000-0000-4000-8000-000000000005',
   '66660000-0000-4000-8000-000000000006',
   'Chimney Only',
   'Specialized chimney deep cleaning — duct, mesh filter, and motor housing degrease.',
   999, 90, true)
ON CONFLICT (id) DO NOTHING;
