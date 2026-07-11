import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Admin assigns a provider to a booking
export function useAssignProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, providerId }: { bookingId: string; providerId: string }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ provider_id: providerId })
        .eq('id', bookingId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-bookings'] });
      qc.invalidateQueries({ queryKey: ['provider-bookings'] });
    },
  });
}


// Mark booking as emergency
export function useToggleEmergency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, isEmergency }: { bookingId: string; isEmergency: boolean }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ is_emergency: isEmergency } as any)
        .eq('id', bookingId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-bookings'] });
      qc.invalidateQueries({ queryKey: ['provider-bookings'] });
    },
  });
}
