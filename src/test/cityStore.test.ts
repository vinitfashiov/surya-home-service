import { describe, it, expect, beforeEach } from 'vitest';
import { useCityStore } from '@/lib/cityStore';

describe('CityStore (Zustand)', () => {
  beforeEach(() => {
    localStorage.clear();
    useCityStore.setState({
      selectedCityId: null,
      selectedCityName: null,
      hasCheckedCity: false,
    });
  });

  it('should start with no city selected', () => {
    const state = useCityStore.getState();
    expect(state.selectedCityId).toBeNull();
    expect(state.selectedCityName).toBeNull();
    expect(state.hasCheckedCity).toBe(false);
  });

  it('should set city and persist to localStorage', () => {
    useCityStore.getState().setCity('city-1', 'Mumbai');
    const state = useCityStore.getState();
    expect(state.selectedCityId).toBe('city-1');
    expect(state.selectedCityName).toBe('Mumbai');
    expect(state.hasCheckedCity).toBe(true);
    expect(JSON.parse(localStorage.getItem('selectedCity')!)).toEqual({ id: 'city-1', name: 'Mumbai' });
  });

  it('should clear city and remove from localStorage', () => {
    useCityStore.getState().setCity('city-1', 'Mumbai');
    useCityStore.getState().clearCity();
    const state = useCityStore.getState();
    expect(state.selectedCityId).toBeNull();
    expect(state.selectedCityName).toBeNull();
    expect(state.hasCheckedCity).toBe(false);
    expect(localStorage.getItem('selectedCity')).toBeNull();
  });

  it('should allow changing city', () => {
    useCityStore.getState().setCity('city-1', 'Mumbai');
    useCityStore.getState().setCity('city-2', 'Delhi');
    const state = useCityStore.getState();
    expect(state.selectedCityId).toBe('city-2');
    expect(state.selectedCityName).toBe('Delhi');
  });

  it('setHasChecked should update flag without affecting city', () => {
    useCityStore.getState().setHasChecked(true);
    const state = useCityStore.getState();
    expect(state.hasCheckedCity).toBe(true);
    expect(state.selectedCityId).toBeNull();
  });
});
