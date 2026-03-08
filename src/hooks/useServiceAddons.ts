import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useServiceAddons(serviceId?: string) {
  return useQuery({
    queryKey: ['service-addons', serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      const { data, error } = await supabase
        .from('service_addons')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .order('price');
      if (error) throw error;
      return data;
    },
    enabled: !!serviceId,
  });
}
