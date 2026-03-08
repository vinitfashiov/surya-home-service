import { describe, it, expect } from 'vitest';

// Test coupon discount calculation logic (extracted from useCoupons)
function calculateDiscount(coupon: {
  discount_type: string;
  discount_value: number;
  max_discount?: number | null;
}, orderTotal: number): number {
  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = Math.round(orderTotal * (coupon.discount_value / 100));
    if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
  } else {
    discount = coupon.discount_value;
  }
  discount = Math.min(discount, orderTotal);
  return discount;
}

describe('Coupon Discount Calculation', () => {
  it('should calculate percentage discount correctly', () => {
    expect(calculateDiscount({ discount_type: 'percentage', discount_value: 10 }, 1000)).toBe(100);
  });

  it('should cap percentage discount at max_discount', () => {
    expect(calculateDiscount({ discount_type: 'percentage', discount_value: 50, max_discount: 200 }, 1000)).toBe(200);
  });

  it('should handle flat discount', () => {
    expect(calculateDiscount({ discount_type: 'flat', discount_value: 150 }, 1000)).toBe(150);
  });

  it('should not exceed order total for flat discount', () => {
    expect(calculateDiscount({ discount_type: 'flat', discount_value: 500 }, 200)).toBe(200);
  });

  it('should not exceed order total for percentage discount', () => {
    expect(calculateDiscount({ discount_type: 'percentage', discount_value: 100 }, 50)).toBe(50);
  });

  it('should handle 0% discount', () => {
    expect(calculateDiscount({ discount_type: 'percentage', discount_value: 0 }, 1000)).toBe(0);
  });

  it('should handle zero order total', () => {
    expect(calculateDiscount({ discount_type: 'percentage', discount_value: 10 }, 0)).toBe(0);
  });
});
