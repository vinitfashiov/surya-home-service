-- ============================================================================
-- Add toilet/bathroom variants + ceiling fan cleaning service
-- Source: client WhatsApp (2026-04-27)
-- Placeholder prices ₹999 for Classic / Deep / Move-in Intense — update later
-- when client confirms.
-- ============================================================================

-- ---------- 1. Variants for "WC / Toilet Cleaning" ----------
-- Base service id: 66660000-0000-4000-8000-00000000000f
INSERT INTO public.service_variants (id, service_id, name, description, price, duration, is_active) VALUES
  ('77770000-0000-4000-8000-000000000001',
   '66660000-0000-4000-8000-00000000000f',
   'Classic',
   'Basic toilet cleaning — WC, washbasin, and floor scrubbing.',
   999, 60, true),

  ('77770000-0000-4000-8000-000000000002',
   '66660000-0000-4000-8000-00000000000f',
   'Deep Cleaning',
   'Premium deep cleaning — descaling, disinfection, tile and grout treatment.',
   999, 90, true),

  ('77770000-0000-4000-8000-000000000003',
   '66660000-0000-4000-8000-00000000000f',
   'Badi Toilet (Large)',
   'Large bathroom variant — bathtub, multiple fixtures, full deep clean.',
   700, 90, true),

  ('77770000-0000-4000-8000-000000000004',
   '66660000-0000-4000-8000-00000000000f',
   'Move-in Intense',
   'Intense bathroom cleaning for move-in / move-out — sanitization, scaling, full disinfection.',
   999, 120, true)
ON CONFLICT (id) DO NOTHING;

-- ---------- 2. New service: Ceiling Fan Cleaning ----------
-- Category:    Floor & Appliance Cleaning  (44440000-...-000000000001)
-- Subcategory: Appliance Cleaning           (55550000-...-000000000001)
INSERT INTO public.services (
  id, category_id, subcategory_id, provider_id, city_id, zone_id,
  name, description, price, duration, rating, review_count, is_active
) VALUES
  ('66660000-0000-4000-8000-000000000010',
   '44440000-0000-4000-8000-000000000001',
   '55550000-0000-4000-8000-000000000001',
   '33330000-0000-4000-8000-000000000001',
   '11110000-0000-4000-8000-000000000001',
   '22220000-0000-4000-8000-000000000001',
   'Ceiling Fan Cleaning',
   'Dust and grease removal for ceiling fans. Blade scrubbing and motor housing wipe-down. Priced per fan.',
   50, 30, 0, 0, true)
ON CONFLICT (id) DO NOTHING;
