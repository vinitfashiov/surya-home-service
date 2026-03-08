
-- Provider availability calendar
CREATE TABLE public.provider_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  start_time text NOT NULL DEFAULT '9:00 AM',
  end_time text NOT NULL DEFAULT '5:00 PM',
  max_bookings_per_slot integer NOT NULL DEFAULT 0,
  note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, date)
);

ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read provider availability"
ON public.provider_availability FOR SELECT USING (true);

CREATE POLICY "Providers manage own availability"
ON public.provider_availability FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.providers
    WHERE providers.id = provider_availability.provider_id
    AND providers.user_id = auth.uid()
  )
);

CREATE POLICY "Admins manage all availability"
ON public.provider_availability FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
