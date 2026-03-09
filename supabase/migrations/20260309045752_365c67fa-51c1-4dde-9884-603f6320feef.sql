-- Add tax fields to services table
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_type text DEFAULT 'none';

-- Add CRUD mutations for service_variants (admin manages variants inline)
-- Variants already exist, just need to ensure we can manage them from admin