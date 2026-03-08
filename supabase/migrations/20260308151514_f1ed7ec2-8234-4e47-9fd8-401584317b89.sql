
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON public.platform_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage settings"
  ON public.platform_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('business_name', 'ServisGo'),
  ('business_email', 'contact@servisgo.com'),
  ('business_phone', ''),
  ('business_address', ''),
  ('working_hours_start', '09:00'),
  ('working_hours_end', '18:00'),
  ('working_days', 'Mon,Tue,Wed,Thu,Fri'),
  ('currency', 'USD'),
  ('booking_notice_hours', '24'),
  ('max_bookings_per_day', '50');
