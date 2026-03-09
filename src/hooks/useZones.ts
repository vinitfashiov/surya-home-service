import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceZone {
  id: string;
  name: string;
  zone_type: 'all_india' | 'state' | 'pincode' | 'polygon';
  state_names: string[];
  pincodes: string[];
  polygon_coordinates: { lat: number; lng: number }[] | null;
  center_lat: number | null;
  center_lng: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_zones' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ServiceZone[];
    },
  });
}

export function useActiveZones() {
  return useQuery({
    queryKey: ['active-zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_zones' as any)
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as unknown as ServiceZone[];
    },
  });
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (zone: Omit<ServiceZone, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('service_zones' as any)
        .insert(zone as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] });
      qc.invalidateQueries({ queryKey: ['active-zones'] });
    },
  });
}

export function useUpdateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceZone> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_zones' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] });
      qc.invalidateQueries({ queryKey: ['active-zones'] });
    },
  });
}

export function useDeleteZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_zones' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] });
      qc.invalidateQueries({ queryKey: ['active-zones'] });
    },
  });
}

// Indian States list
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Check if a location is within a zone
export function isLocationInZone(
  zone: ServiceZone,
  lat: number,
  lng: number,
  pincode?: string,
  state?: string
): boolean {
  if (!zone.is_active) return false;

  switch (zone.zone_type) {
    case 'all_india':
      return true;

    case 'state':
      return state ? zone.state_names.includes(state) : false;

    case 'pincode':
      return pincode ? zone.pincodes.includes(pincode) : false;

    case 'polygon':
      if (!zone.polygon_coordinates) return false;
      return isPointInPolygon({ lat, lng }, zone.polygon_coordinates);

    default:
      return false;
  }
}

// Ray casting algorithm for point-in-polygon detection
function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
): boolean {
  let inside = false;
  const { lat, lng } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
}

// Check if location is serviceable (in any active zone)
export function useCheckServiceability() {
  const { data: zones = [] } = useActiveZones();

  return (lat: number, lng: number, pincode?: string, state?: string): boolean => {
    if (zones.length === 0) return true; // No zones = serve everywhere
    return zones.some(zone => isLocationInZone(zone, lat, lng, pincode, state));
  };
}
