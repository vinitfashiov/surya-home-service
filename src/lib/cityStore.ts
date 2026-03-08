import { create } from 'zustand';

interface CityState {
  selectedCityId: string | null;
  selectedCityName: string | null;
  hasCheckedCity: boolean;
  setCity: (id: string, name: string) => void;
  clearCity: () => void;
  setHasChecked: (v: boolean) => void;
}

export const useCityStore = create<CityState>((set) => {
  const stored = localStorage.getItem('selectedCity');
  const parsed = stored ? JSON.parse(stored) : null;

  return {
    selectedCityId: parsed?.id || null,
    selectedCityName: parsed?.name || null,
    hasCheckedCity: !!parsed?.id,
    setCity: (id, name) => {
      localStorage.setItem('selectedCity', JSON.stringify({ id, name }));
      set({ selectedCityId: id, selectedCityName: name, hasCheckedCity: true });
    },
    clearCity: () => {
      localStorage.removeItem('selectedCity');
      set({ selectedCityId: null, selectedCityName: null, hasCheckedCity: false });
    },
    setHasChecked: (v) => set({ hasCheckedCity: v }),
  };
});
