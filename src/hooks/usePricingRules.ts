import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface PricingRule {
  id: string;
  service_id: string;
  rule_type: string; // flat | per_hour | per_km | per_guest | per_day | per_room | tiered
  base_price: number;
  unit_price: number;
  unit_label: string;
  min_units: number | null;
  max_units: number | null;
  linked_field_name: string | null; // matches field_name in category_checkout_fields
  is_active: boolean;
  created_at: string;
}

const RULE_TYPE_LABELS: Record<string, string> = {
  flat: 'Flat Price',
  per_hour: 'Per Hour',
  per_km: 'Per Kilometer',
  per_guest: 'Per Guest',
  per_day: 'Per Day',
  per_room: 'Per Room',
  tiered: 'Tiered',
};

export const RULE_TYPES = Object.entries(RULE_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export function usePricingRules(serviceId?: string) {
  return useQuery({
    queryKey: ['pricing-rules', serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .order('created_at');
      if (error) throw error;
      return data as PricingRule[];
    },
    enabled: !!serviceId,
  });
}

export function usePricingRulesForServices(serviceIds: string[]) {
  return useQuery({
    queryKey: ['pricing-rules-batch', serviceIds.sort().join(',')],
    queryFn: async () => {
      if (serviceIds.length === 0) return [];
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .in('service_id', serviceIds)
        .eq('is_active', true)
        .order('created_at');
      if (error) throw error;
      return data as PricingRule[];
    },
    enabled: serviceIds.length > 0,
  });
}

export function useAllPricingRulesForService(serviceId?: string) {
  return useQuery({
    queryKey: ['all-pricing-rules', serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at');
      if (error) throw error;
      return data as PricingRule[];
    },
    enabled: !!serviceId,
  });
}

export function useCreatePricingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Omit<PricingRule, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('pricing_rules').insert(rule as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['pricing-rules'] });
      qc.invalidateQueries({ queryKey: ['all-pricing-rules'] });
      qc.invalidateQueries({ queryKey: ['pricing-rules-batch'] });
    },
  });
}

export function useUpdatePricingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PricingRule> & { id: string }) => {
      const { data, error } = await supabase.from('pricing_rules').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-rules'] });
      qc.invalidateQueries({ queryKey: ['all-pricing-rules'] });
      qc.invalidateQueries({ queryKey: ['pricing-rules-batch'] });
    },
  });
}

export function useDeletePricingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pricing_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-rules'] });
      qc.invalidateQueries({ queryKey: ['all-pricing-rules'] });
      qc.invalidateQueries({ queryKey: ['pricing-rules-batch'] });
    },
  });
}

/**
 * Calculate dynamic price for a service based on its pricing rules and custom field values.
 * 
 * If no active pricing rules exist, falls back to the service's base price.
 * If rules exist, computes: base_price + (unit_price × units) for each rule,
 * where units come from the linked checkout field value.
 */
export function calculateDynamicPrice(
  baseServicePrice: number,
  rules: PricingRule[],
  customFieldValues: Record<string, string>,
  checkoutFields: { id: string; field_name: string }[],
): { total: number; breakdown: { label: string; amount: number }[] } {
  if (!rules || rules.length === 0) {
    return { total: baseServicePrice, breakdown: [{ label: 'Base Price', amount: baseServicePrice }] };
  }

  const breakdown: { label: string; amount: number }[] = [];
  let total = 0;

  for (const rule of rules) {
    if (!rule.is_active) continue;

    if (rule.rule_type === 'flat') {
      breakdown.push({ label: 'Base Price', amount: rule.base_price });
      total += rule.base_price;
      continue;
    }

    // Find the linked field value
    let units = 0;
    if (rule.linked_field_name) {
      const field = checkoutFields.find(f => f.field_name === rule.linked_field_name);
      if (field) {
        const rawValue = customFieldValues[field.id];
        units = parseFloat(rawValue) || 0;
      }
    }

    // Clamp units
    if (rule.min_units != null && units < rule.min_units) units = rule.min_units;
    if (rule.max_units != null && units > rule.max_units) units = rule.max_units;

    const ruleTotal = rule.base_price + (rule.unit_price * units);
    const unitLabel = rule.unit_label || 'unit';

    if (rule.base_price > 0) {
      breakdown.push({ label: `Base fare`, amount: rule.base_price });
    }
    if (units > 0 && rule.unit_price > 0) {
      breakdown.push({ label: `₹${rule.unit_price} × ${units} ${unitLabel}${units !== 1 ? 's' : ''}`, amount: rule.unit_price * units });
    }

    total += ruleTotal;
  }

  if (total === 0) {
    return { total: baseServicePrice, breakdown: [{ label: 'Base Price', amount: baseServicePrice }] };
  }

  return { total, breakdown };
}

/**
 * React hook that computes dynamic price reactively.
 */
export function useDynamicPrice(
  baseServicePrice: number,
  serviceId: string | undefined,
  customFieldValues: Record<string, string>,
  checkoutFields: { id: string; field_name: string }[],
) {
  const { data: rules = [] } = usePricingRules(serviceId);

  return useMemo(() => {
    return calculateDynamicPrice(baseServicePrice, rules, customFieldValues, checkoutFields);
  }, [baseServicePrice, rules, customFieldValues, checkoutFields]);
}
