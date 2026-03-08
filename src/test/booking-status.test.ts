import { describe, it, expect } from 'vitest';

// Test booking status workflow
const VALID_STATUSES = ['pending', 'accepted', 'assigned', 'on_the_way', 'started', 'completed', 'cancelled'];
const ACTIVE_STATUSES = ['pending', 'accepted', 'assigned', 'on_the_way', 'started'];
const CANCELLABLE_STATUSES = ['pending', 'accepted', 'assigned'];

function categorizeBookings(bookings: { status: string }[]) {
  return {
    upcoming: bookings.filter(b => ACTIVE_STATUSES.includes(b.status)),
    completed: bookings.filter(b => b.status === 'completed'),
    cancelled: bookings.filter(b => b.status === 'cancelled'),
  };
}

describe('Booking Status Workflow', () => {
  it('should categorize bookings correctly', () => {
    const bookings = [
      { status: 'pending' },
      { status: 'accepted' },
      { status: 'completed' },
      { status: 'cancelled' },
      { status: 'on_the_way' },
      { status: 'started' },
    ];
    const { upcoming, completed, cancelled } = categorizeBookings(bookings);
    expect(upcoming).toHaveLength(4);
    expect(completed).toHaveLength(1);
    expect(cancelled).toHaveLength(1);
  });

  it('should handle empty bookings', () => {
    const { upcoming, completed, cancelled } = categorizeBookings([]);
    expect(upcoming).toHaveLength(0);
    expect(completed).toHaveLength(0);
    expect(cancelled).toHaveLength(0);
  });

  it('all statuses should be valid enum values', () => {
    VALID_STATUSES.forEach(status => {
      expect(typeof status).toBe('string');
      expect(status.length).toBeGreaterThan(0);
    });
  });

  it('cancellable statuses should be subset of active statuses', () => {
    CANCELLABLE_STATUSES.forEach(s => {
      expect(ACTIVE_STATUSES).toContain(s);
    });
  });

  it('completed and cancelled should not be in active', () => {
    expect(ACTIVE_STATUSES).not.toContain('completed');
    expect(ACTIVE_STATUSES).not.toContain('cancelled');
  });
});

describe('Rebook / Book Again Logic', () => {
  it('should only show rebook for completed or cancelled', () => {
    const showRebook = (status: string) => status === 'completed' || status === 'cancelled';
    expect(showRebook('completed')).toBe(true);
    expect(showRebook('cancelled')).toBe(true);
    expect(showRebook('pending')).toBe(false);
    expect(showRebook('started')).toBe(false);
  });
});

describe('Review Eligibility', () => {
  it('should only allow reviews on completed bookings without existing review', () => {
    const canReview = (status: string, hasExistingReview: boolean) =>
      status === 'completed' && !hasExistingReview;

    expect(canReview('completed', false)).toBe(true);
    expect(canReview('completed', true)).toBe(false);
    expect(canReview('pending', false)).toBe(false);
    expect(canReview('cancelled', false)).toBe(false);
  });
});
