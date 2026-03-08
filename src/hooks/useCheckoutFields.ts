import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CheckoutField {
  id: string;
  category_id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  options: any[];
  is_required: boolean;
  display_order: number;
  placeholder: string;
}

export function useCategoryCheckoutFields(categoryIds: string[]) {
  return useQuery({
    queryKey: ['checkout-fields', categoryIds],
    queryFn: async () => {
      if (!categoryIds.length) return [];
      const { data, error } = await supabase
        .from('category_checkout_fields' as any)
        .select('*')
        .in('category_id', categoryIds)
        .order('display_order');
      if (error) throw error;
      return (data || []) as unknown as CheckoutField[];
    },
    enabled: categoryIds.length > 0,
  });
}

export function useAllCheckoutFields() {
  return useQuery({
    queryKey: ['all-checkout-fields'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('category_checkout_fields' as any)
        .select('*')
        .order('display_order');
      if (error) throw error;
      return (data || []) as unknown as CheckoutField[];
    },
  });
}

export function useCreateCheckoutField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (field: Omit<CheckoutField, 'id'>) => {
      const { data, error } = await supabase
        .from('category_checkout_fields' as any)
        .insert(field as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkout-fields'] });
      qc.invalidateQueries({ queryKey: ['all-checkout-fields'] });
    },
  });
}

export function useUpdateCheckoutField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CheckoutField> & { id: string }) => {
      const { data, error } = await supabase
        .from('category_checkout_fields' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkout-fields'] });
      qc.invalidateQueries({ queryKey: ['all-checkout-fields'] });
    },
  });
}

export function useDeleteCheckoutField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('category_checkout_fields' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['checkout-fields'] });
      qc.invalidateQueries({ queryKey: ['all-checkout-fields'] });
    },
  });
}

export function useSaveBookingCustomFields() {
  return useMutation({
    mutationFn: async (fields: { booking_id: string; field_id: string; field_value: string }[]) => {
      if (!fields.length) return;
      const { error } = await supabase
        .from('booking_custom_fields' as any)
        .insert(fields as any);
      if (error) throw error;
    },
  });
}
