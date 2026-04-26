-- ============================================================================
-- Add Unsplash images for all 8 service categories.
-- Source: Unsplash (free, royalty-free, hotlink-friendly).
-- Width 1200px for fast loading on category tile views.
-- ============================================================================

-- Floor & Appliance Cleaning
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000001';

-- Window & Glass Cleaning
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1527352774566-e4916e36c645?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000002';

-- Car Cleaning
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000003';

-- Balcony & Utility Cleaning
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1486484290742-0ce4eb743a34?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000004';

-- Kitchen Cleaning
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1556912167-f556f1f39fdf?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000005';

-- Home Cleaning
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000006';

-- Painting Services
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1629941633816-a1d688cb2d1d?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000007';

-- Cleaning Services (Sofa, Bathroom)
UPDATE public.service_categories
SET image_url = 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '44440000-0000-4000-8000-000000000008';
