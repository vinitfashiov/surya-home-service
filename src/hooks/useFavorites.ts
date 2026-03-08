import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFavorites(userId?: string) {
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select('*, service:services(*, provider:providers(id, company_name), category:service_categories(id, name, icon))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useFavoriteIds(userId?: string) {
  return useQuery({
    queryKey: ['favorite-ids', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select('service_id')
        .eq('user_id', userId);
      if (error) throw error;
      return data.map((f: any) => f.service_id as string);
    },
    enabled: !!userId,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, serviceId, isFavorited }: { userId: string; serviceId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('service_id', serviceId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: userId, service_id: serviceId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.invalidateQueries({ queryKey: ['favorite-ids'] });
    },
  });
}
