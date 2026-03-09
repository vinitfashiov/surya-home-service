import { create } from 'zustand';

interface ZoneState {
  lat: number | null;
  lng: number | null;
  pincode: string | null;
  state: string | null;
  address: string | null;
  setLocation: (loc: { lat: number; lng: number; pincode?: string; state?: string; address: string }) => void;
  clearLocation: () => void;
}

export const useZoneStore = create<ZoneState>((set) => ({
  lat: null,
  lng: null,
  pincode: null,
  state: null,
  address: null,
  setLocation: (loc) => set({ 
    lat: loc.lat, 
    lng: loc.lng, 
    pincode: loc.pincode || null, 
    state: loc.state || null,
    address: loc.address 
  }),
  clearLocation: () => set({ 
    lat: null, 
    lng: null, 
    pincode: null, 
    state: null,
    address: null 
  }),
}));
