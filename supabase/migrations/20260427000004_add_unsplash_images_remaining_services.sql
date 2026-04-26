-- ============================================================================
-- Add Unsplash images for remaining 11 services.
-- Source: Unsplash search results (free, royalty-free, hotlink-friendly CDN).
-- These are temporary — replace with Supabase Storage uploads before going live.
-- Width reduced to 1200px (from 3000px) for faster loading.
-- ============================================================================

-- Fridge Cleaning
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1762545352529-1e624dad0548?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-000000000001';

-- Floor Cleaning Service
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1749214317455-efbdd57df844?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-000000000002';

-- Window / Glass Cleaning Service
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1482449609509-eae2a7ea42b7?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-000000000003';

-- Car Wash Service
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-000000000004';

-- Balcony Cleaning Service
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1649671965270-ab7ed6aaa709?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-000000000005';

-- Empty / Move-In Cleaning Service
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1632208962087-2719e5e57886?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-000000000008';

-- Furniture & Fixture Painting
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1612908317776-a3afde8232fa?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-00000000000a';

-- Outdoor & Utility Area Painting
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1774977737078-7ccc2ac697e6?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-00000000000b';

-- Single Room Painting
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-00000000000c';

-- House Painting Packages
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1666179861891-db5155e290c3?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-00000000000d';

-- Sofa Cleaning
UPDATE public.services
SET image_url = 'https://images.unsplash.com/photo-1686178827149-6d55c72d81df?fm=jpg&q=80&w=1200&auto=format&fit=crop'
WHERE id = '66660000-0000-4000-8000-00000000000e';
