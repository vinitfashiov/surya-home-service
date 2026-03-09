-- =============================================
-- PHASE 1: Advanced Scheduling Enhancement
-- =============================================

-- Add emergency booking flag to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS is_emergency boolean NOT NULL DEFAULT false;

-- Add buffer_time_minutes to platform_settings (will use INSERT if not exists)
-- This will be done via application logic since platform_settings already exists

-- =============================================
-- PHASE 3: Zone Management System
-- =============================================

-- Create zone_type enum
CREATE TYPE public.zone_type AS ENUM ('all_india', 'state', 'pincode', 'polygon');

-- Create service_zones table
CREATE TABLE public.service_zones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  zone_type public.zone_type NOT NULL DEFAULT 'polygon',
  -- For state-wise zones
  state_names text[] DEFAULT '{}',
  -- For pincode-based zones
  pincodes text[] DEFAULT '{}',
  -- For polygon zones (GeoJSON coordinates array)
  polygon_coordinates jsonb DEFAULT NULL,
  -- Zone center for map display
  center_lat numeric DEFAULT NULL,
  center_lng numeric DEFAULT NULL,
  -- Metadata
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add zone_id to providers for zone assignment
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES public.service_zones(id) ON DELETE SET NULL;

-- Add zone_id to services for zone assignment
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES public.service_zones(id) ON DELETE SET NULL;

-- Add lat/lng to customer_addresses for map-based locations
ALTER TABLE public.customer_addresses 
ADD COLUMN IF NOT EXISTS latitude numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS longitude numeric DEFAULT NULL;

-- Add lat/lng to bookings for exact service location
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS latitude numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS longitude numeric DEFAULT NULL;

-- Enable RLS on service_zones
ALTER TABLE public.service_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_zones
CREATE POLICY "Admins manage zones" 
ON public.service_zones 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active zones" 
ON public.service_zones 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_service_zones_updated_at
  BEFORE UPDATE ON public.service_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Add index for zone lookups
CREATE INDEX idx_service_zones_type ON public.service_zones(zone_type);
CREATE INDEX idx_service_zones_active ON public.service_zones(is_active);
CREATE INDEX idx_providers_zone ON public.providers(zone_id);
CREATE INDEX idx_services_zone ON public.services(zone_id);