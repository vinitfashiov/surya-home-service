import { describe, it, expect } from 'vitest';

// Extracted pricing logic for testing
interface PricingRule {
  service_id: string;
  rule_type: string;
  base_price: number;
  unit_price: number;
  unit_label: string;
  min_units: number | null;
  max_units: number | null;
  linked_field_name: string | null;
  is_active: boolean;
}

interface CheckoutField {
  id: string;
  field_name: string;
}

function calculateDynamicPrice(
  baseServicePrice: number,
  rules: PricingRule[],
  fieldValues: Record<string, string>,
  fields: CheckoutField[]
): { total: number; breakdown: { label: string; amount: number }[] } {
  if (!rules.length) return { total: baseServicePrice, breakdown: [] };

  let total = 0;
  const breakdown: { label: string; amount: number }[] = [];

  for (const rule of rules) {
    if (!rule.is_active) continue;

    let units = 1;
    if (rule.linked_field_name) {
      const field = fields.find(f => f.field_name === rule.linked_field_name);
      if (field) {
        const val = Number(fieldValues[field.id] || 0);
        units = Math.max(val, rule.min_units || 0);
        if (rule.max_units) units = Math.min(units, rule.max_units);
      }
    }

    const amount = rule.base_price + rule.unit_price * units;
    total += amount;
    breakdown.push({ label: `${rule.unit_label}: ${units} × ₹${rule.unit_price}`, amount });
  }

  return { total: total || baseServicePrice, breakdown };
}

describe('Dynamic Pricing Calculation', () => {
  const basePrice = 500;

  it('should return base price when no rules', () => {
    const result = calculateDynamicPrice(basePrice, [], {}, []);
    expect(result.total).toBe(500);
    expect(result.breakdown).toHaveLength(0);
  });

  it('should calculate flat rule correctly', () => {
    const rules: PricingRule[] = [{
      service_id: 's1', rule_type: 'flat', base_price: 200, unit_price: 100,
      unit_label: 'room', min_units: null, max_units: null,
      linked_field_name: null, is_active: true,
    }];
    const result = calculateDynamicPrice(basePrice, rules, {}, []);
    expect(result.total).toBe(300); // 200 + 100 * 1
  });

  it('should use linked field value for units', () => {
    const rules: PricingRule[] = [{
      service_id: 's1', rule_type: 'per_unit', base_price: 100, unit_price: 50,
      unit_label: 'room', min_units: 1, max_units: 10,
      linked_field_name: 'num_rooms', is_active: true,
    }];
    const fields: CheckoutField[] = [{ id: 'f1', field_name: 'num_rooms' }];
    const result = calculateDynamicPrice(basePrice, rules, { f1: '3' }, fields);
    expect(result.total).toBe(250); // 100 + 50 * 3
  });

  it('should respect max_units cap', () => {
    const rules: PricingRule[] = [{
      service_id: 's1', rule_type: 'per_unit', base_price: 0, unit_price: 100,
      unit_label: 'room', min_units: 1, max_units: 5,
      linked_field_name: 'num_rooms', is_active: true,
    }];
    const fields: CheckoutField[] = [{ id: 'f1', field_name: 'num_rooms' }];
    const result = calculateDynamicPrice(basePrice, rules, { f1: '20' }, fields);
    expect(result.total).toBe(500); // 0 + 100 * 5 (capped)
  });

  it('should skip inactive rules', () => {
    const rules: PricingRule[] = [{
      service_id: 's1', rule_type: 'flat', base_price: 200, unit_price: 100,
      unit_label: 'room', min_units: null, max_units: null,
      linked_field_name: null, is_active: false,
    }];
    const result = calculateDynamicPrice(basePrice, rules, {}, []);
    expect(result.total).toBe(500); // Falls back to base
  });
});
