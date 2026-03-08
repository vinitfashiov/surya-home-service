import { create } from 'zustand';
import { UserRole, Booking, BookingStatus } from './types';
import { bookings as initialBookings } from './mock-data';

interface AppState {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  bookings: Booking[];
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  addBooking: (booking: Booking) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'customer',
  setCurrentRole: (role) => set({ currentRole: role }),
  bookings: initialBookings,
  updateBookingStatus: (bookingId, status) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status } : b
      ),
    })),
  addBooking: (booking) =>
    set((state) => ({ bookings: [...state.bookings, booking] })),
}));
