import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAds(cityId?: string | null, categoryId?: string | null) {
  return useQuery({
    queryKey: ['targeted-ads', cityId, categoryId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_targeted_ads', {
        p_city_id: cityId || null,
        p_category_id: categoryId || null,
        p_limit: 5
      });

      if (error) {
        console.error('Error fetching ads:', error);
        throw error;
      }
      return data;
    },
    // Don't refetch too often, ads are relatively static per session
    staleTime: 1000 * 60 * 5, 
  });
}

export function useTrackAd() {
  const trackImpression = useMutation({
    mutationFn: async (campaignId: string) => {
      await supabase.from('ad_analytics').insert([
        { campaign_id: campaignId, event_type: 'impression' }
      ]);
    }
  });

  const trackClick = useMutation({
    mutationFn: async (campaignId: string) => {
      await supabase.from('ad_analytics').insert([
        { campaign_id: campaignId, event_type: 'click' }
      ]);
    }
  });

  return { trackImpression, trackClick };
}
