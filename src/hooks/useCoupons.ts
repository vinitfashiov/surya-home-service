import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CouponResult {
  valid: boolean;
  coupon?: any;
  discountAmount: number;
  message: string;
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: async ({ code, orderTotal }: { code: string; orderTotal: number }): Promise<CouponResult> => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) return { valid: false, discountAmount: 0, message: 'Enter a coupon code' };

      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', trimmed)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!coupon) return { valid: false, discountAmount: 0, message: 'Invalid coupon code' };

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { valid: false, discountAmount: 0, message: 'This coupon has expired' };
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return { valid: false, discountAmount: 0, message: 'This coupon has reached its usage limit' };
      }

      // Check minimum order
      if (orderTotal < coupon.min_order_amount) {
        return { valid: false, discountAmount: 0, message: `Minimum order of ₹${coupon.min_order_amount} required` };
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = Math.round(orderTotal * (coupon.discount_value / 100));
        if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
      } else {
        discount = coupon.discount_value;
      }

      discount = Math.min(discount, orderTotal);

      return {
        valid: true,
        coupon,
        discountAmount: discount,
        message: `Coupon applied! You save ₹${discount}`,
      };
    },
  });
}

export function useAdminCoupons() {
  return useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: any) => {
      const { data, error } = await supabase.from('coupons').insert(coupon).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });
}
