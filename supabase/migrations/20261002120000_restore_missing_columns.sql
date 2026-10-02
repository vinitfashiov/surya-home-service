-- Restore columns/tables the app uses that were lost in the Supabase project move.
-- Run in Supabase SQL Editor for project akxcyibzrmqvbojwbfqz. Safe to re-run.

-- 1. Service variants in cart and bookings ("Could not find the 'variant_id' column of 'cart_items'")
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.service_variants(id) ON DELETE SET NULL;
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.service_variants(id) ON DELETE SET NULL;

-- 2. Provider onboarding, profile, payouts & wallet fields (from add_provider_fields.sql)
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS gst_number text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS pan_number text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS bank_account_number text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS bank_ifsc text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS bank_account_name text;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS whatsapp_updates boolean DEFAULT true;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS app_language text DEFAULT 'hinglish';
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS credits numeric DEFAULT 500;

-- 3. Payout requests (provider withdrawals, admin approval)
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX IF NOT EXISTS payout_requests_provider_idx ON public.payout_requests(provider_id);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers view own payout requests" ON public.payout_requests;
CREATE POLICY "Providers view own payout requests" ON public.payout_requests
  FOR SELECT TO authenticated
  USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Providers create own pending payout requests" ON public.payout_requests;
CREATE POLICY "Providers create own pending payout requests" ON public.payout_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    status = 'pending'
    AND processed_at IS NULL
    AND provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage payout requests" ON public.payout_requests;
CREATE POLICY "Admins manage payout requests" ON public.payout_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE ON public.payout_requests TO authenticated;

-- 4. Storage bucket for provider ad images (path: campaigns/<provider_id>/<file>)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ad-campaigns', 'ad-campaigns', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view ad images" ON storage.objects;
CREATE POLICY "Anyone can view ad images" ON storage.objects
  FOR SELECT USING (bucket_id = 'ad-campaigns');

DROP POLICY IF EXISTS "Providers upload own ad images" ON storage.objects;
CREATE POLICY "Providers upload own ad images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ad-campaigns'
    AND (storage.foldername(name))[2] IN (SELECT id::text FROM public.providers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Providers update own ad images" ON storage.objects;
CREATE POLICY "Providers update own ad images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'ad-campaigns'
    AND (storage.foldername(name))[2] IN (SELECT id::text FROM public.providers WHERE user_id = auth.uid())
  );

-- 5. Make PostgREST pick up the new columns immediately
NOTIFY pgrst, 'reload schema';
