import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePlatformSettings() {
  return useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => { map[s.key] = s.value; });
      return map;
    },
  });
}

export function useCancellationRules() {
  const { data: settings = {} } = usePlatformSettings();

  const freeMinutes = Number(settings.cancellation_free_minutes || 30);
  const cancellationFee = Number(settings.cancellation_fee_percent || 10);
  const enabled = settings.cancellation_enabled !== 'false';

  const canCancel = (status: string) => {
    if (!enabled) return false;
    // Can only cancel if not already started/completed/cancelled
    return ['pending', 'accepted', 'assigned'].includes(status);
  };

  return { freeMinutes, cancellationFee, enabled, canCancel };
}
