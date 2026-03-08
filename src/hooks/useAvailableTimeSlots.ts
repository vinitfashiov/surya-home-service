import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ALL_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];

interface UseAvailableTimeSlotsParams {
  date?: string;
  providerIds?: string[];
  duration?: number; // in minutes
}

export function useAvailableTimeSlots({ date, providerIds, duration = 60 }: UseAvailableTimeSlotsParams) {
  return useQuery({
    queryKey: ['available-time-slots', date, providerIds, duration],
    queryFn: async () => {
      if (!date || !providerIds?.length) return ALL_SLOTS;

      // Fetch all bookings for this date and these providers
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('booking_time, provider_id, serviceman_id, service_id, services(duration)')
        .eq('booking_date', date)
        .in('provider_id', providerIds)
        .not('status', 'eq', 'cancelled');

      if (error) throw error;

      // Fetch servicemen for these providers
      const { data: servicemen } = await supabase
        .from('servicemen')
        .select('id, provider_id')
        .in('provider_id', providerIds)
        .eq('status', 'available');

      // Count servicemen per provider
      const servicemenPerProvider: Record<string, number> = {};
      (servicemen || []).forEach((sm: any) => {
        servicemenPerProvider[sm.provider_id] = (servicemenPerProvider[sm.provider_id] || 0) + 1;
      });

      // For each time slot, check if ALL providers have capacity
      const availableSlots = ALL_SLOTS.filter(slot => {
        return providerIds.every(providerId => {
          const maxCapacity = Math.max(servicemenPerProvider[providerId] || 1, 1);
          const bookingsAtSlot = (bookings || []).filter(
            (b: any) => b.booking_time === slot && b.provider_id === providerId
          ).length;
          return bookingsAtSlot < maxCapacity;
        });
      });

      return availableSlots;
    },
    enabled: !!date && !!providerIds?.length,
    staleTime: 30_000, // refresh every 30s
    refetchInterval: 30_000,
  });
}

export { ALL_SLOTS };
