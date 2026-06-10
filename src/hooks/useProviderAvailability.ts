import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProviderAvailability {
  id: string;
  provider_id: string;
  date: string;
  is_available: boolean;
  start_time: string;
  end_time: string;
  max_bookings_per_slot: number;
  note: string;
}

export function useProviderAvailability(providerId?: string, month?: string) {
  return useQuery({
    queryKey: ['provider-availability', providerId, month],
    queryFn: async () => {
      if (!providerId || !month) return [];
      // month format: YYYY-MM
      const [year, monthNum] = month.split('-').map(Number);
      const lastDay = new Date(year, monthNum, 0).getDate();
      const startDate = `${month}-01`;
      const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;
      const { data, error } = await supabase
        .from('provider_availability' as any)
        .select('*')
        .eq('provider_id', providerId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');
      if (error) throw error;
      return (data || []) as unknown as ProviderAvailability[];
    },
    enabled: !!providerId && !!month,
  });
}

export function useProviderAvailabilityForDate(providerIds: string[], date?: string) {
  return useQuery({
    queryKey: ['provider-availability-date', providerIds, date],
    queryFn: async () => {
      if (!date || !providerIds.length) return [];
      const { data, error } = await supabase
        .from('provider_availability' as any)
        .select('*')
        .in('provider_id', providerIds)
        .eq('date', date);
      if (error) throw error;
      return (data || []) as unknown as ProviderAvailability[];
    },
    enabled: !!date && providerIds.length > 0,
  });
}

export function useUpsertAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<ProviderAvailability, 'id'>) => {
      // Try update first, then insert
      const { data: existing } = await supabase
        .from('provider_availability' as any)
        .select('id')
        .eq('provider_id', entry.provider_id)
        .eq('date', entry.date)
        .maybeSingle();
      
      if (existing) {
        const { data, error } = await supabase
          .from('provider_availability' as any)
          .update({
            is_available: entry.is_available,
            start_time: entry.start_time,
            end_time: entry.end_time,
            max_bookings_per_slot: entry.max_bookings_per_slot,
            note: entry.note,
          } as any)
          .eq('id', (existing as any).id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('provider_availability' as any)
          .insert(entry as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provider-availability'] });
      qc.invalidateQueries({ queryKey: ['provider-availability-date'] });
      qc.invalidateQueries({ queryKey: ['available-time-slots'] });
    },
  });
}

export function useBulkUpsertAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entries: Omit<ProviderAvailability, 'id'>[]) => {
      for (const entry of entries) {
        const { data: existing } = await supabase
          .from('provider_availability' as any)
          .select('id')
          .eq('provider_id', entry.provider_id)
          .eq('date', entry.date)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('provider_availability' as any)
            .update({
              is_available: entry.is_available,
              start_time: entry.start_time,
              end_time: entry.end_time,
              max_bookings_per_slot: entry.max_bookings_per_slot,
              note: entry.note,
            } as any)
            .eq('id', (existing as any).id);
        } else {
          await supabase
            .from('provider_availability' as any)
            .insert(entry as any);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provider-availability'] });
      qc.invalidateQueries({ queryKey: ['provider-availability-date'] });
      qc.invalidateQueries({ queryKey: ['available-time-slots'] });
    },
  });
}
