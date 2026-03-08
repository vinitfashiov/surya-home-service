import { describe, it, expect } from 'vitest';

const ALL_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];

function slotIndex(slot: string): number {
  return ALL_SLOTS.indexOf(slot);
}

function filterSlotsByWorkingHours(slots: string[], startTime: string, endTime: string): string[] {
  const startIdx = slotIndex(startTime);
  const endIdx = slotIndex(endTime);
  if (startIdx < 0 || endIdx < 0) return slots;
  return slots.filter(slot => {
    const idx = slotIndex(slot);
    return idx >= startIdx && idx <= endIdx;
  });
}

function filterSlotsByCapacity(
  slots: string[],
  bookings: { booking_time: string; provider_id: string }[],
  providerId: string,
  maxCapacity: number
): string[] {
  return slots.filter(slot => {
    const bookingsAtSlot = bookings.filter(
      b => b.booking_time === slot && b.provider_id === providerId
    ).length;
    return bookingsAtSlot < maxCapacity;
  });
}

describe('Time Slot Logic', () => {
  it('should have 9 default slots', () => {
    expect(ALL_SLOTS).toHaveLength(9);
  });

  it('should filter slots by working hours', () => {
    const result = filterSlotsByWorkingHours(ALL_SLOTS, '10:00 AM', '3:00 PM');
    expect(result).toEqual(['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM']);
  });

  it('should return all slots for invalid working hours', () => {
    const result = filterSlotsByWorkingHours(ALL_SLOTS, 'invalid', 'times');
    expect(result).toEqual(ALL_SLOTS);
  });

  it('should filter out fully booked slots', () => {
    const bookings = [
      { booking_time: '10:00 AM', provider_id: 'p1' },
      { booking_time: '10:00 AM', provider_id: 'p1' },
    ];
    const result = filterSlotsByCapacity(ALL_SLOTS, bookings, 'p1', 2);
    expect(result).not.toContain('10:00 AM');
    expect(result).toContain('9:00 AM');
  });

  it('should keep slots under capacity', () => {
    const bookings = [
      { booking_time: '10:00 AM', provider_id: 'p1' },
    ];
    const result = filterSlotsByCapacity(ALL_SLOTS, bookings, 'p1', 3);
    expect(result).toContain('10:00 AM');
  });

  it('should not count bookings from other providers', () => {
    const bookings = [
      { booking_time: '10:00 AM', provider_id: 'p2' },
      { booking_time: '10:00 AM', provider_id: 'p2' },
    ];
    const result = filterSlotsByCapacity(ALL_SLOTS, bookings, 'p1', 1);
    expect(result).toContain('10:00 AM');
  });
});
