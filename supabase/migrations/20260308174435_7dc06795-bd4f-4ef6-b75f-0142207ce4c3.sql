
-- Add category_type to service_categories
ALTER TABLE public.service_categories 
ADD COLUMN IF NOT EXISTS category_type text NOT NULL DEFAULT 'standard';

-- Create category_checkout_fields table
CREATE TABLE public.category_checkout_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  options jsonb DEFAULT '[]'::jsonb,
  is_required boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  placeholder text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create booking_custom_fields table
CREATE TABLE public.booking_custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.category_checkout_fields(id) ON DELETE CASCADE,
  field_value text NOT NULL DEFAULT ''
);

-- RLS for category_checkout_fields
ALTER TABLE public.category_checkout_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read checkout fields"
ON public.category_checkout_fields FOR SELECT
USING (true);

CREATE POLICY "Admins manage checkout fields"
ON public.category_checkout_fields FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for booking_custom_fields
ALTER TABLE public.booking_custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own booking fields"
ON public.booking_custom_fields FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_custom_fields.booking_id
    AND bookings.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins manage all booking fields"
ON public.booking_custom_fields FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Providers read own booking fields"
ON public.booking_custom_fields FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.providers p ON p.id = b.provider_id
    WHERE b.id = booking_custom_fields.booking_id
    AND p.user_id = auth.uid()
  )
);
