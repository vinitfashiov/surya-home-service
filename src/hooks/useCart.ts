import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCart(userId?: string) {
  return useQuery({
    queryKey: ['cart', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          service:services(
            id, name, price, duration, rating, image_url, category_id,
            provider:providers(id, company_name)
          ),
          variant:service_variants(
            id, name, price, duration
          ),
          addons:cart_item_addons(
            id,
            addon:service_addons(id, name, price)
          )
        `)
        .eq('user_id', userId)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useCartCount(userId?: string) {
  const { data: cart = [] } = useCart(userId);
  return cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, serviceId, variantId, addonIds = [] }: { userId: string; serviceId: string; variantId?: string; addonIds?: string[] }) => {
      // Check if already in cart with SAME variant
      const query = supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('service_id', serviceId);
      
      if (variantId) {
        query.eq('variant_id', variantId);
      } else {
        query.is('variant_id', null);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        // Increment quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);
        if (error) throw error;
        return existing;
      }

      const { data: item, error } = await supabase
        .from('cart_items')
        .insert({ user_id: userId, service_id: serviceId, variant_id: variantId })
        .select()
        .single();
      if (error) throw error;

      // Add addon selections
      if (addonIds.length > 0) {
        const { error: addonError } = await supabase
          .from('cart_item_addons')
          .insert(addonIds.map(aid => ({ cart_item_id: item.id, addon_id: aid })));
        if (addonError) throw addonError;
      }

      return item;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useUpdateCartQuantity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cartItemId: string) => {
      const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}
