
-- Create storage buckets for service images, provider logos, and user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('service-images', 'service-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('provider-logos', 'provider-logos', true, 2097152, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- RLS policies for service-images bucket
CREATE POLICY "Providers upload service images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'service-images');

CREATE POLICY "Providers update service images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'service-images');

CREATE POLICY "Providers delete service images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'service-images');

CREATE POLICY "Anyone can view service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

-- RLS policies for provider-logos bucket
CREATE POLICY "Providers upload own logo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'provider-logos');

CREATE POLICY "Providers update own logo"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'provider-logos');

CREATE POLICY "Providers delete own logo"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'provider-logos');

CREATE POLICY "Anyone can view provider logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'provider-logos');
