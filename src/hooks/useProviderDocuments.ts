import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProviderDocument {
  id: string;
  provider_id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  status: string;
  admin_notes: string;
  uploaded_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const DOCUMENT_TYPES = [
  { value: 'id_proof', label: 'Government ID (Aadhaar/PAN)' },
  { value: 'business_license', label: 'Business License / GST' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'insurance', label: 'Insurance Certificate' },
  { value: 'certification', label: 'Professional Certification' },
  { value: 'other', label: 'Other Document' },
];

export function useProviderDocuments(providerId?: string) {
  return useQuery({
    queryKey: ['provider-documents', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const { data, error } = await supabase
        .from('provider_documents' as any)
        .select('*')
        .eq('provider_id', providerId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;

      const docs = (data || []) as unknown as ProviderDocument[];
      
      // Generate signed URLs for each doc
      const paths = docs.map(d => {
        const marker = '/provider-documents/';
        const idx = d.file_url.indexOf(marker);
        return idx !== -1 ? d.file_url.substring(idx + marker.length) : '';
      }).filter(Boolean);

      if (paths.length > 0) {
        try {
          const { data: signedData, error: signedError } = await supabase.storage
            .from('provider-documents')
            .createSignedUrls(paths, 3600); // 1 hour expiry

          if (!signedError && signedData) {
            return docs.map(d => {
              const marker = '/provider-documents/';
              const idx = d.file_url.indexOf(marker);
              const path = idx !== -1 ? d.file_url.substring(idx + marker.length) : '';
              const signed = signedData.find(s => s.path === path);
              return {
                ...d,
                file_url: signed?.signedUrl || d.file_url
              };
            });
          }
        } catch (err) {
          console.error("Failed to generate signed URLs", err);
        }
      }

      return docs;
    },
    enabled: !!providerId,
  });
}

export function useAllProviderDocuments() {
  return useQuery({
    queryKey: ['all-provider-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provider_documents' as any)
        .select('*')
        .order('uploaded_at', { ascending: false });
      if (error) throw error;

      const docs = (data || []) as unknown as ProviderDocument[];

      // Generate signed URLs for each doc
      const paths = docs.map(d => {
        const marker = '/provider-documents/';
        const idx = d.file_url.indexOf(marker);
        return idx !== -1 ? d.file_url.substring(idx + marker.length) : '';
      }).filter(Boolean);

      if (paths.length > 0) {
        try {
          const { data: signedData, error: signedError } = await supabase.storage
            .from('provider-documents')
            .createSignedUrls(paths, 3600); // 1 hour expiry

          if (!signedError && signedData) {
            return docs.map(d => {
              const marker = '/provider-documents/';
              const idx = d.file_url.indexOf(marker);
              const path = idx !== -1 ? d.file_url.substring(idx + marker.length) : '';
              const signed = signedData.find(s => s.path === path);
              return {
                ...d,
                file_url: signed?.signedUrl || d.file_url
              };
            });
          }
        } catch (err) {
          console.error("Failed to generate signed URLs", err);
        }
      }

      return docs;
    },
  });
}

export function useUploadProviderDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      providerId,
      documentType,
      documentName,
      file,
    }: {
      providerId: string;
      documentType: string;
      documentName: string;
      file: File;
    }) => {
      const ext = file.name.split('.').pop();
      const path = `${providerId}/${documentType}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('provider-documents')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('provider-documents')
        .getPublicUrl(path);

      const { data, error } = await supabase
        .from('provider_documents' as any)
        .insert({
          provider_id: providerId,
          document_type: documentType,
          document_name: documentName,
          file_url: urlData.publicUrl,
          status: 'pending',
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provider-documents'] });
      qc.invalidateQueries({ queryKey: ['all-provider-documents'] });
    },
  });
}

export function useReviewDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      documentId,
      status,
      adminNotes,
      reviewedBy,
    }: {
      documentId: string;
      status: 'approved' | 'rejected';
      adminNotes?: string;
      reviewedBy: string;
    }) => {
      const { data, error } = await supabase
        .from('provider_documents' as any)
        .update({
          status,
          admin_notes: adminNotes || '',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy,
        } as any)
        .eq('id', documentId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provider-documents'] });
      qc.invalidateQueries({ queryKey: ['all-provider-documents'] });
    },
  });
}

export function useVerifyProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ providerId, verified }: { providerId: string; verified: boolean }) => {
      const { error } = await supabase
        .from('providers')
        .update({
          is_verified: verified,
          verified_at: verified ? new Date().toISOString() : null,
        } as any)
        .eq('id', providerId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      qc.invalidateQueries({ queryKey: ['my-provider'] });
    },
  });
}
