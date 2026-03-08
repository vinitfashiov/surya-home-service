import { describe, it, expect } from 'vitest';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  duration: number;
  subcategory_id: string | null;
  provider: { company_name: string };
  category: { name: string };
  created_at: string;
}

const mockServices: Service[] = [
  { id: '1', name: 'Deep Cleaning', description: 'Full home cleaning', price: 1500, rating: 4.5, duration: 120, subcategory_id: 'sub1', provider: { company_name: 'CleanPro' }, category: { name: 'Cleaning' }, created_at: '2026-01-01' },
  { id: '2', name: 'AC Repair', description: 'AC service and repair', price: 500, rating: 4.8, duration: 60, subcategory_id: 'sub2', provider: { company_name: 'CoolFix' }, category: { name: 'Repairs' }, created_at: '2026-02-01' },
  { id: '3', name: 'Haircut', description: 'Men haircut at home', price: 200, rating: 4.2, duration: 30, subcategory_id: null, provider: { company_name: 'StyleHub' }, category: { name: 'Salon' }, created_at: '2026-03-01' },
  { id: '4', name: 'Plumbing', description: 'Pipe repair service', price: 800, rating: 3.5, duration: 90, subcategory_id: 'sub1', provider: { company_name: 'FixIt' }, category: { name: 'Repairs' }, created_at: '2026-01-15' },
];

function filterServices(
  services: Service[],
  { searchQuery = '', subcategory = 'all', priceRange = [0, 50000] as [number, number], minRating = 0, maxDuration = 480, sortBy = 'rating' }
): Service[] {
  let result = [...services];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.provider.company_name.toLowerCase().includes(q) ||
      s.category.name.toLowerCase().includes(q)
    );
  }

  if (subcategory !== 'all') {
    result = result.filter(s => s.subcategory_id === subcategory);
  }

  result = result.filter(s => s.price >= priceRange[0] && s.price <= priceRange[1]);

  if (minRating > 0) {
    result = result.filter(s => s.rating >= minRating);
  }

  if (maxDuration < 480) {
    result = result.filter(s => s.duration <= maxDuration);
  }

  switch (sortBy) {
    case 'price_low': result.sort((a, b) => a.price - b.price); break;
    case 'price_high': result.sort((a, b) => b.price - a.price); break;
    case 'duration_low': result.sort((a, b) => a.duration - b.duration); break;
    case 'newest': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    default: result.sort((a, b) => b.rating - a.rating);
  }

  return result;
}

describe('Service Filtering', () => {
  it('should return all services with no filters', () => {
    expect(filterServices(mockServices, {})).toHaveLength(4);
  });

  it('should search by name', () => {
    const result = filterServices(mockServices, { searchQuery: 'haircut' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Haircut');
  });

  it('should search by provider name', () => {
    const result = filterServices(mockServices, { searchQuery: 'cleanpro' });
    expect(result).toHaveLength(1);
  });

  it('should search by category name', () => {
    const result = filterServices(mockServices, { searchQuery: 'repairs' });
    expect(result).toHaveLength(2);
  });

  it('should filter by subcategory', () => {
    const result = filterServices(mockServices, { subcategory: 'sub1' });
    expect(result).toHaveLength(2);
  });

  it('should filter by price range', () => {
    const result = filterServices(mockServices, { priceRange: [400, 1000] });
    expect(result).toHaveLength(2); // AC Repair (500) and Plumbing (800)
  });

  it('should filter by minimum rating', () => {
    const result = filterServices(mockServices, { minRating: 4.5 });
    expect(result).toHaveLength(2); // Deep Cleaning (4.5) and AC Repair (4.8)
  });

  it('should filter by max duration', () => {
    const result = filterServices(mockServices, { maxDuration: 60 });
    expect(result).toHaveLength(2); // AC Repair (60) and Haircut (30)
  });

  it('should sort by price low to high', () => {
    const result = filterServices(mockServices, { sortBy: 'price_low' });
    expect(result[0].name).toBe('Haircut');
    expect(result[result.length - 1].name).toBe('Deep Cleaning');
  });

  it('should sort by price high to low', () => {
    const result = filterServices(mockServices, { sortBy: 'price_high' });
    expect(result[0].name).toBe('Deep Cleaning');
  });

  it('should sort by rating by default', () => {
    const result = filterServices(mockServices, {});
    expect(result[0].name).toBe('AC Repair'); // highest rating
  });

  it('should sort by newest', () => {
    const result = filterServices(mockServices, { sortBy: 'newest' });
    expect(result[0].name).toBe('Haircut'); // March 2026
  });

  it('should sort by shortest duration', () => {
    const result = filterServices(mockServices, { sortBy: 'duration_low' });
    expect(result[0].name).toBe('Haircut'); // 30 min
  });

  it('should combine search and filters', () => {
    const result = filterServices(mockServices, {
      searchQuery: 'repair',
      priceRange: [0, 600],
    });
    expect(result).toHaveLength(1); // Only AC Repair (500) - Plumbing (800) excluded
  });

  it('should return empty for impossible filters', () => {
    const result = filterServices(mockServices, { priceRange: [10000, 20000] });
    expect(result).toHaveLength(0);
  });
});
