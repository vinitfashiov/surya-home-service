
-- Phase 2: Provider verification documents
CREATE TABLE public.provider_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL DEFAULT 'id_proof',
  document_name text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text DEFAULT '',
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;

-- Providers can manage own documents
CREATE POLICY "Providers manage own documents"
ON public.provider_documents FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.providers WHERE providers.id = provider_documents.provider_id AND providers.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.providers WHERE providers.id = provider_documents.provider_id AND providers.user_id = auth.uid()
));

-- Admins manage all documents
CREATE POLICY "Admins manage all documents"
ON public.provider_documents FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add verification columns to providers
ALTER TABLE public.providers 
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Storage bucket for provider documents
INSERT INTO storage.buckets (id, name, public) VALUES ('provider-documents', 'provider-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for provider-documents bucket
CREATE POLICY "Providers upload own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'provider-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Providers read own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'provider-documents' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.providers WHERE user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Admins manage all provider documents"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'provider-documents' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'provider-documents' AND public.has_role(auth.uid(), 'admin'));
