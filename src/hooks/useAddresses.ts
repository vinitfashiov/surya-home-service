import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMyAddresses(userId?: string) {
  return useQuery({
    queryKey: ['my-addresses', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*, city:cities(id, name)')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (addr: { user_id: string; label: string; address_line: string; city_id?: string; pincode?: string; is_default?: boolean }) => {
      // If setting as default, unset others first
      if (addr.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('user_id', addr.user_id);
      }
      const { data, error } = await supabase.from('customer_addresses').insert(addr).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-addresses'] }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, user_id, ...updates }: { id: string; user_id: string; label?: string; address_line?: string; city_id?: string; pincode?: string; is_default?: boolean }) => {
      if (updates.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('user_id', user_id);
      }
      const { data, error } = await supabase.from('customer_addresses').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-addresses'] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customer_addresses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-addresses'] }),
  });
}
