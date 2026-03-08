import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useReviewsForProvider(providerId?: string) {
  return useQuery({
    queryKey: ['reviews-provider', providerId],
    queryFn: async () => {
      if (!providerId) return [];
      const { data, error } = await supabase
        .from('reviews')
        .select('*, customer:profiles!reviews_customer_id_fkey(full_name)')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });
}

export function useReviewForBooking(bookingId?: string) {
  return useQuery({
    queryKey: ['review-booking', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (review: {
      booking_id: string;
      customer_id: string;
      serviceman_id?: string;
      provider_id: string;
      rating: number;
      comment?: string;
    }) => {
      const { data, error } = await supabase.from('reviews').insert(review).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews-provider'] });
      qc.invalidateQueries({ queryKey: ['review-booking'] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}
