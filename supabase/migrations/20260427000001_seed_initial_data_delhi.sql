-- ============================================================================
-- Initial seed data: Delhi / South Delhi launch
-- Source: services_data_export.json (8 categories, 15 subcategories, 15 services)
-- Idempotent via deterministic UUIDs + ON CONFLICT (id) DO NOTHING.
-- ============================================================================

-- ---------- 1. City: Delhi ----------
INSERT INTO public.cities (id, name, state, is_active) VALUES
  ('11110000-0000-4000-8000-000000000001', 'Delhi', 'Delhi', true)
ON CONFLICT (id) DO NOTHING;

-- ---------- 2. Service zone: South Delhi ----------
-- zone_type = 'pincode' so admins can later attach actual South Delhi pincodes
-- (Hauz Khas 110016, Saket 110017, Vasant Kunj 110070, etc.) from /admin/zones
INSERT INTO public.service_zones (id, name, zone_type, pincodes, is_active) VALUES
  ('22220000-0000-4000-8000-000000000001', 'South Delhi', 'pincode', ARRAY[]::text[], true)
ON CONFLICT (id) DO NOTHING;

-- ---------- 3. Platform provider ----------
-- Single placeholder provider that owns all initial services. user_id is NULL
-- (allowed since 2026-03-17 migration). Real providers onboard via /admin/providers.
INSERT INTO public.providers (
  id, user_id, company_name, owner_name, email, phone, address,
  status, is_verified, verified_at, city_id, zone_id, rating
) VALUES (
  '33330000-0000-4000-8000-000000000001',
  NULL,
  'Surya Home Service',
  'Surya Home Service',
  'support@suryahomeservice.com',
  '',
  'South Delhi, Delhi',
  'active',
  true,
  now(),
  '11110000-0000-4000-8000-000000000001',
  '22220000-0000-4000-8000-000000000001',
  0
) ON CONFLICT (id) DO NOTHING;

-- ---------- 4. Service categories (8) ----------
INSERT INTO public.service_categories (id, name, description, icon, commission_rate, category_type, is_active) VALUES
  ('44440000-0000-4000-8000-000000000001', 'Floor & Appliance Cleaning', 'Deep cleaning of floors, refrigerators, and home appliances', 'Refrigerator', 20, 'standard', true),
  ('44440000-0000-4000-8000-000000000002', 'Window & Glass Cleaning',    'Streak-free cleaning of windows, glass doors, and panels',    'Square',       20, 'standard', true),
  ('44440000-0000-4000-8000-000000000003', 'Car Cleaning',               'Doorstep car wash and interior detailing',                    'Car',          20, 'standard', true),
  ('44440000-0000-4000-8000-000000000004', 'Balcony & Utility Cleaning', 'Balcony, terrace, and utility area cleaning',                 'Trees',        20, 'standard', true),
  ('44440000-0000-4000-8000-000000000005', 'Kitchen Cleaning',           'Kitchen accessories, chimney, and complete deep cleans',      'Utensils',     20, 'standard', true),
  ('44440000-0000-4000-8000-000000000006', 'Home Cleaning',              'Full-home cleaning including move-in / move-out services',    'Home',         20, 'standard', true),
  ('44440000-0000-4000-8000-000000000007', 'Painting Services',          'Interior, exterior, and furniture painting',                  'PaintBucket',  20, 'standard', true),
  ('44440000-0000-4000-8000-000000000008', 'Cleaning Services',          'Sofa, upholstery, and bathroom deep cleaning',                'Sparkles',     20, 'standard', true)
ON CONFLICT (id) DO NOTHING;

-- ---------- 5. Service subcategories (15) ----------
INSERT INTO public.service_subcategories (id, category_id, name, description, icon, is_active) VALUES
  ('55550000-0000-4000-8000-000000000001', '44440000-0000-4000-8000-000000000001', 'Appliance Cleaning',            'Refrigerator, microwave, washing machine cleaning',       'Refrigerator', true),
  ('55550000-0000-4000-8000-000000000002', '44440000-0000-4000-8000-000000000001', 'Floor Cleaning',                'Tile, marble, and hardwood floor scrubbing',              'Brush',        true),
  ('55550000-0000-4000-8000-000000000003', '44440000-0000-4000-8000-000000000002', 'Window Cleaning',               'Window panes, glass doors, and grills',                   'Square',       true),
  ('55550000-0000-4000-8000-000000000004', '44440000-0000-4000-8000-000000000003', 'Car Wash',                      'Exterior wash and interior vacuum',                       'Car',          true),
  ('55550000-0000-4000-8000-000000000005', '44440000-0000-4000-8000-000000000004', 'Balcony Cleaning',              'Balcony floor, railing, and grill cleaning',              'Trees',        true),
  ('55550000-0000-4000-8000-000000000006', '44440000-0000-4000-8000-000000000005', 'Kitchen Accessories Cleaning',  'Chimney, hob, exhaust fan deep cleaning',                 'ChefHat',      true),
  ('55550000-0000-4000-8000-000000000007', '44440000-0000-4000-8000-000000000005', 'Complete Kitchen Cleaning',     'Full kitchen deep clean with cabinets and slabs',         'Utensils',     true),
  ('55550000-0000-4000-8000-000000000008', '44440000-0000-4000-8000-000000000006', 'Empty / Move-In Cleaning',      'Pre-move sanitization for empty homes',                   'PackageOpen',  true),
  ('55550000-0000-4000-8000-000000000009', '44440000-0000-4000-8000-000000000006', 'Full Home Cleaning',            'Whole-home deep cleaning across all rooms',               'Home',         true),
  ('55550000-0000-4000-8000-00000000000a', '44440000-0000-4000-8000-000000000007', 'Furniture & Fixture Painting',  'Doors, cabinets, wooden furniture, metal fixtures',       'Brush',        true),
  ('55550000-0000-4000-8000-00000000000b', '44440000-0000-4000-8000-000000000007', 'Outdoor & Utility Area Painting','Exterior walls and utility area painting',               'PaintBucket',  true),
  ('55550000-0000-4000-8000-00000000000c', '44440000-0000-4000-8000-000000000007', 'Room Painting',                 'Single room painting with primer and finish coats',       'Paintbrush',   true),
  ('55550000-0000-4000-8000-00000000000d', '44440000-0000-4000-8000-000000000007', 'Full House Painting Packages',  'Complete house interior painting packages',               'Palette',      true),
  ('55550000-0000-4000-8000-00000000000e', '44440000-0000-4000-8000-000000000008', 'Sofa Cleaning',                 'Upholstery shampooing and stain treatment',               'Sofa',         true),
  ('55550000-0000-4000-8000-00000000000f', '44440000-0000-4000-8000-000000000008', 'Bathroom & WC Cleaning',        'Toilet, washbasin, and bathroom fixture cleaning',        'Bath',         true)
ON CONFLICT (id) DO NOTHING;

-- ---------- 6. Services (15) ----------
-- Pricing taken from min_price in source data. Currency stripped (₹2,690.00 -> 2690).
-- Duration is an estimate; admins can adjust per service.
INSERT INTO public.services (
  id, category_id, subcategory_id, provider_id, city_id, zone_id,
  name, description, price, duration, rating, review_count, is_active
) VALUES
  -- Floor & Appliance Cleaning
  ('66660000-0000-4000-8000-000000000001',
   '44440000-0000-4000-8000-000000000001', '55550000-0000-4000-8000-000000000001',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Fridge Cleaning',
   'Deep cleaning of refrigerator interior and exterior. Removes stains, odors, and food residue. Includes shelves, drawers, and door gasket sanitization.',
   480, 60, 0, 0, true),

  ('66660000-0000-4000-8000-000000000002',
   '44440000-0000-4000-8000-000000000001', '55550000-0000-4000-8000-000000000002',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Floor Cleaning Service',
   'Professional floor scrubbing and mopping for tiles, marble, and hardwood. Starting at ₹45 per square foot.',
   45, 45, 0, 0, true),

  -- Window & Glass Cleaning
  ('66660000-0000-4000-8000-000000000003',
   '44440000-0000-4000-8000-000000000002', '55550000-0000-4000-8000-000000000003',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Window / Glass Cleaning Service',
   'Streak-free cleaning of windows, glass doors, and panels. Both interior and exterior surfaces handled.',
   499, 60, 0, 0, true),

  -- Car Cleaning
  ('66660000-0000-4000-8000-000000000004',
   '44440000-0000-4000-8000-000000000003', '55550000-0000-4000-8000-000000000004',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Car Wash Service',
   'Complete exterior wash and interior vacuuming at your doorstep. Eco-friendly cleaning agents and microfiber finish.',
   499, 45, 0, 0, true),

  -- Balcony & Utility Cleaning
  ('66660000-0000-4000-8000-000000000005',
   '44440000-0000-4000-8000-000000000004', '55550000-0000-4000-8000-000000000005',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Balcony Cleaning Service',
   'Thorough scrubbing of balcony floors, railings, and grills. Includes cobweb removal and disinfection.',
   369, 60, 0, 0, true),

  -- Kitchen Cleaning
  ('66660000-0000-4000-8000-000000000006',
   '44440000-0000-4000-8000-000000000005', '55550000-0000-4000-8000-000000000006',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Kitchen Accessories Cleaning Service',
   'Deep cleaning of chimney, hob, exhaust fan, and microwave. Removes oil and grease buildup.',
   399, 60, 0, 0, true),

  ('66660000-0000-4000-8000-000000000007',
   '44440000-0000-4000-8000-000000000005', '55550000-0000-4000-8000-000000000007',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Complete Kitchen Cleaning Service',
   'Full kitchen deep clean including cabinets, slabs, sink, appliances, and tiles. Removes grease and stains.',
   999, 180, 0, 0, true),

  -- Home Cleaning
  ('66660000-0000-4000-8000-000000000008',
   '44440000-0000-4000-8000-000000000006', '55550000-0000-4000-8000-000000000008',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Empty / Move-In Cleaning Service',
   'Pre-move sanitization for empty homes. Floor scrubbing, dusting, cobweb removal, and disinfection.',
   350, 240, 0, 0, true),

  ('66660000-0000-4000-8000-000000000009',
   '44440000-0000-4000-8000-000000000006', '55550000-0000-4000-8000-000000000009',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Home Cleaning Service',
   'Professional whole-home deep cleaning across all rooms, bathrooms, and kitchen. Premium-grade equipment.',
   2690, 240, 0, 0, true),

  -- Painting Services
  ('66660000-0000-4000-8000-00000000000a',
   '44440000-0000-4000-8000-000000000007', '55550000-0000-4000-8000-00000000000a',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Furniture & Fixture Painting',
   'Custom painting for doors, cabinets, wooden furniture, and metal fixtures. Premium enamel finish.',
   1349, 180, 0, 0, true),

  ('66660000-0000-4000-8000-00000000000b',
   '44440000-0000-4000-8000-000000000007', '55550000-0000-4000-8000-00000000000b',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Outdoor & Utility Area Painting',
   'Exterior wall and utility area painting with weatherproof finish.',
   2300, 240, 0, 0, true),

  ('66660000-0000-4000-8000-00000000000c',
   '44440000-0000-4000-8000-000000000007', '55550000-0000-4000-8000-00000000000c',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Single Room Painting',
   'Complete painting of one room including walls, ceiling, prep work, primer, and two coats of premium paint.',
   2339, 360, 0, 0, true),

  ('66660000-0000-4000-8000-00000000000d',
   '44440000-0000-4000-8000-000000000007', '55550000-0000-4000-8000-00000000000d',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'House Painting Packages',
   'Full house interior painting package. Includes prep, primer, two coats of premium paint, and post-job clean-up.',
   9000, 480, 0, 0, true),

  -- Cleaning Services (general)
  ('66660000-0000-4000-8000-00000000000e',
   '44440000-0000-4000-8000-000000000008', '55550000-0000-4000-8000-00000000000e',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'Sofa Cleaning',
   'Deep upholstery shampooing and stain treatment. Starting at ₹125 per seat.',
   125, 90, 0, 0, true),

  ('66660000-0000-4000-8000-00000000000f',
   '44440000-0000-4000-8000-000000000008', '55550000-0000-4000-8000-00000000000f',
   '33330000-0000-4000-8000-000000000001', '11110000-0000-4000-8000-000000000001', '22220000-0000-4000-8000-000000000001',
   'WC / Toilet Cleaning',
   'Disinfection and deep cleaning of toilet, washbasin, and bathroom fixtures.',
   249, 60, 0, 0, true)
ON CONFLICT (id) DO NOTHING;
