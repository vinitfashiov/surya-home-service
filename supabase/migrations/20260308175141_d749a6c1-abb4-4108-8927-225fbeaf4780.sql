
-- Service subcategories
CREATE TABLE public.service_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'Tag',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active subcategories"
ON public.service_subcategories FOR SELECT USING (true);

CREATE POLICY "Admins manage subcategories"
ON public.service_subcategories FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add subcategory_id to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.service_subcategories(id) ON DELETE SET NULL;

-- Service variants
CREATE TABLE public.service_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  duration integer NOT NULL DEFAULT 60,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active variants"
ON public.service_variants FOR SELECT USING (true);

CREATE POLICY "Admins manage variants"
ON public.service_variants FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Providers manage own variants"
ON public.service_variants FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.services s
    JOIN public.providers p ON p.id = s.provider_id
    WHERE s.id = service_variants.service_id AND p.user_id = auth.uid()
  )
);
