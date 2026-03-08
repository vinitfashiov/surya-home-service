import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
}

export interface ServiceVariant {
  id: string;
  service_id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  is_active: boolean;
}

export function useSubcategories(categoryId?: string) {
  return useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('service_subcategories' as any)
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Subcategory[];
    },
  });
}

export function useServiceVariants(serviceId?: string) {
  return useQuery({
    queryKey: ['service-variants', serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      const { data, error } = await supabase
        .from('service_variants' as any)
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .order('price');
      if (error) throw error;
      return (data || []) as unknown as ServiceVariant[];
    },
    enabled: !!serviceId,
  });
}
