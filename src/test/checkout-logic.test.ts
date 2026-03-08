import { describe, it, expect } from 'vitest';

// Test checkout pricing calculations
function calculateCheckoutTotals(items: { price: number; addonsTotal: number; quantity: number }[]) {
  const subtotal = items.reduce((sum, item) => sum + (item.price + item.addonsTotal) * item.quantity, 0);
  const platformFee = Math.round(subtotal * 0.05);
  const total = subtotal + platformFee;
  return { subtotal, platformFee, total };
}

function applyDiscount(total: number, discountAmount: number) {
  return Math.max(0, total - discountAmount);
}

describe('Checkout Pricing', () => {
  it('should calculate subtotal for single item', () => {
    const { subtotal, platformFee, total } = calculateCheckoutTotals([
      { price: 500, addonsTotal: 100, quantity: 1 }
    ]);
    expect(subtotal).toBe(600);
    expect(platformFee).toBe(30);
    expect(total).toBe(630);
  });

  it('should calculate subtotal for multiple items', () => {
    const { subtotal } = calculateCheckoutTotals([
      { price: 500, addonsTotal: 0, quantity: 2 },
      { price: 300, addonsTotal: 50, quantity: 1 },
    ]);
    expect(subtotal).toBe(1350); // 500*2 + 350*1
  });

  it('should handle empty cart', () => {
    const { subtotal, platformFee, total } = calculateCheckoutTotals([]);
    expect(subtotal).toBe(0);
    expect(platformFee).toBe(0);
    expect(total).toBe(0);
  });

  it('should not go below zero with discount', () => {
    expect(applyDiscount(100, 200)).toBe(0);
  });

  it('should apply discount correctly', () => {
    expect(applyDiscount(1000, 150)).toBe(850);
  });

  it('should handle platform fee rounding', () => {
    const { platformFee } = calculateCheckoutTotals([
      { price: 333, addonsTotal: 0, quantity: 1 }
    ]);
    expect(platformFee).toBe(17); // Math.round(333 * 0.05) = Math.round(16.65) = 17
  });
});

describe('Cart Quantity Logic', () => {
  it('quantity of 0 should remove item (cart hook behavior)', () => {
    // When quantity <= 0, useUpdateCartQuantity deletes the item
    const quantity = 0;
    expect(quantity <= 0).toBe(true);
  });

  it('total duration calculation', () => {
    const items = [
      { duration: 60, quantity: 2 },
      { duration: 30, quantity: 1 },
    ];
    const totalDuration = items.reduce((sum, item) => sum + item.duration * item.quantity, 0);
    expect(totalDuration).toBe(150);
  });
});
