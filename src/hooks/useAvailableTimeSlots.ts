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

// Convert slot string to index for range comparison
function slotIndex(slot: string): number {
  return ALL_SLOTS.indexOf(slot);
}

export function useAvailableTimeSlots({ date, providerIds, duration = 60 }: UseAvailableTimeSlotsParams) {
  return useQuery({
    queryKey: ['available-time-slots', date, providerIds, duration],
    queryFn: async () => {
      if (!date || !providerIds?.length) return ALL_SLOTS;

      // Fetch provider availability settings for this date
      const { data: availSettings } = await supabase
        .from('provider_availability' as any)
        .select('*')
        .in('provider_id', providerIds)
        .eq('date', date);

      const availMap: Record<string, any> = {};
      (availSettings || []).forEach((a: any) => { availMap[a.provider_id] = a; });

      // Check if any provider has blocked this date
      for (const pid of providerIds) {
        const setting = availMap[pid];
        if (setting && !setting.is_available) {
          return []; // Provider blocked this date
        }
      }

      // Determine allowed slots based on provider working hours
      let allowedSlots = [...ALL_SLOTS];
      for (const pid of providerIds) {
        const setting = availMap[pid];
        if (setting && setting.is_available) {
          const startIdx = slotIndex(setting.start_time);
          const endIdx = slotIndex(setting.end_time);
          if (startIdx >= 0 && endIdx >= 0) {
            allowedSlots = allowedSlots.filter(slot => {
              const idx = slotIndex(slot);
              return idx >= startIdx && idx <= endIdx;
            });
          }
        }
      }

      // Fetch all bookings for this date and these providers
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('booking_time, provider_id, service_id, services(duration)')
        .eq('booking_date', date)
        .in('provider_id', providerIds)
        .not('status', 'eq', 'cancelled');

      if (error) throw error;

      // For each allowed time slot, check if ALL providers have capacity
      const availableSlots = allowedSlots.filter(slot => {
        return providerIds.every(providerId => {
          const setting = availMap[providerId];
          // Use custom max_bookings_per_slot if set (> 0), otherwise default to 5
          const customMax = setting?.max_bookings_per_slot;
          const maxCapacity = (customMax && customMax > 0)
            ? customMax
            : 5;

          const bookingsAtSlot = (bookings || []).filter(
            (b: any) => b.booking_time === slot && b.provider_id === providerId
          ).length;
          return bookingsAtSlot < maxCapacity;
        });
      });

      return availableSlots;
    },
    enabled: !!date && !!providerIds?.length,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export { ALL_SLOTS };
