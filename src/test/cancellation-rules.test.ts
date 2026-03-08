import { describe, it, expect } from 'vitest';

// Extract and test the cancellation logic
function canCancel(status: string, enabled: boolean): boolean {
  if (!enabled) return false;
  return ['pending', 'accepted', 'assigned'].includes(status);
}

function calculateCancellationFee(amount: number, feePercent: number, minutesSinceBooking: number, freeMinutes: number): number {
  if (minutesSinceBooking <= freeMinutes) return 0;
  return Math.round(amount * feePercent / 100);
}

describe('Cancellation Rules', () => {
  it('should allow cancellation for pending bookings', () => {
    expect(canCancel('pending', true)).toBe(true);
  });

  it('should allow cancellation for accepted bookings', () => {
    expect(canCancel('accepted', true)).toBe(true);
  });

  it('should allow cancellation for assigned bookings', () => {
    expect(canCancel('assigned', true)).toBe(true);
  });

  it('should NOT allow cancellation for on_the_way bookings', () => {
    expect(canCancel('on_the_way', true)).toBe(false);
  });

  it('should NOT allow cancellation for started bookings', () => {
    expect(canCancel('started', true)).toBe(false);
  });

  it('should NOT allow cancellation for completed bookings', () => {
    expect(canCancel('completed', true)).toBe(false);
  });

  it('should NOT allow cancellation for cancelled bookings', () => {
    expect(canCancel('cancelled', true)).toBe(false);
  });

  it('should NOT allow cancellation when disabled', () => {
    expect(canCancel('pending', false)).toBe(false);
  });
});

describe('Cancellation Fee Calculation', () => {
  it('should be free within free period', () => {
    expect(calculateCancellationFee(1000, 10, 15, 30)).toBe(0);
  });

  it('should charge fee after free period', () => {
    expect(calculateCancellationFee(1000, 10, 45, 30)).toBe(100);
  });

  it('should be free at exactly the free period boundary', () => {
    expect(calculateCancellationFee(1000, 10, 30, 30)).toBe(0);
  });

  it('should round the fee', () => {
    expect(calculateCancellationFee(999, 10, 60, 30)).toBe(100); // 99.9 → 100
  });
});
