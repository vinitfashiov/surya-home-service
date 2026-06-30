import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
export * from './useCities';
export * from './useZones';

// Auth hook
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

// User roles
export function useUserRoles(userId?: string) {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      if (error) throw error;
      return data.map((r: any) => r.role as string);
    },
    enabled: !!userId,
  });
}

// Categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

// Services with provider info (supports zone filtering) - uses optimized catalog RPC
export function useServices(categoryId?: string, cityId?: string | null, zoneId?: string | null) {
  return useQuery({
    queryKey: ['services', categoryId, cityId, zoneId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_service_catalog_v2', {
        p_category_id: category_id_validator(categoryId),
        p_city_id: cityId || null,
        p_zone_id: zoneId || null
      });

      if (error) throw error;
      return data as any[];
    },
  });
}

function category_id_validator(id: string | undefined): string | null {
  if (!id || id === 'all') return null;
  return id;
}

export function useService(serviceId?: string) {
  return useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          provider:providers(id, company_name),
          category:service_categories(id, name, icon)
        `)
        .eq('id', serviceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!serviceId,
  });
}

// Bookings
export function useMyBookings(userId?: string) {
  return useQuery({
    queryKey: ['my-bookings', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, duration),
          provider:providers(company_name),
          serviceman:servicemen(name)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useAllBookings() {
  return useQuery({
    queryKey: ['all-bookings'],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name),
          provider:providers(company_name),
          serviceman:servicemen(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!bookings || bookings.length === 0) return [];

      const customerIds = [...new Set(bookings.map((b: any) => b.customer_id).filter(Boolean))] as string[];
      if (customerIds.length === 0) return bookings;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', customerIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

      return bookings.map((booking: any) => ({
        ...booking,
        customer: {
          full_name: profileMap.get(booking.customer_id) || 'Customer',
        },
      }));
    },
  });
}

export function useProviderBookings(userId?: string) {
  return useQuery({
    queryKey: ['provider-bookings', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      let providerId = null;
      
      // First try provider
      const { data: prov } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', userId)
        .single();
        
      if (prov) {
        providerId = prov.id;
      } else {
        // Try provider employee
        const { data: emp } = await supabase
          .from('provider_employees' as any)
          .select('provider_id')
          .eq('user_id', userId)
          .single();
        if (emp) providerId = (emp as any).provider_id;
      }

      if (!providerId) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name),
          customer:profiles!bookings_customer_id_fkey(full_name, phone),
          serviceman:servicemen(name)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useServicemanBookings(userId?: string) {
  return useQuery({
    queryKey: ['serviceman-bookings', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: sm } = await supabase
        .from('servicemen')
        .select('id')
        .eq('user_id', userId)
        .single();
      if (!sm) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name),
          provider:providers(company_name),
          customer:profiles!bookings_customer_id_fkey(full_name, phone)
        `)
        .eq('serviceman_id', sm.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// Mutations
export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (booking: {
      customer_id: string;
      service_id: string;
      variant_id?: string;
      provider_id: string;
      booking_date: string;
      booking_time: string;
      address: string;
      notes?: string;
      amount: number;
    }) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: status as any })
        .eq('id', bookingId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['serviceman-bookings'] });
    },
  });
}

// Providers
export function useProviders() {
  return useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMyProvider(userId?: string) {
  return useQuery({
    queryKey: ['my-provider', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // Check direct provider first
      const { data: prov, error } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (prov) {
        return { ...prov, is_employee: false, permissions: ['all'] };
      }

      if (error && error.code !== 'PGRST116') throw error;

      // Check provider employee
      const { data: emp, error: empErr } = await supabase
        .from('provider_employees' as any)
        .select('provider_id, permissions')
        .eq('user_id', userId)
        .single();
        
      if (emp) {
        const empData = emp as any;
        const { data: parentProvider, error: pErr } = await supabase
          .from('providers')
          .select('*')
          .eq('id', empData.provider_id)
          .single();
          
        if (pErr) throw pErr;
        
        return { 
          ...parentProvider, 
          is_employee: true, 
          permissions: empData.permissions || [] 
        };
      }

      if (empErr && empErr.code !== 'PGRST116') throw empErr;
      return null;
    },
    enabled: !!userId,
  });
}

// Servicemen
export function useServicemen(providerId?: string) {
  return useQuery({
    queryKey: ['servicemen', providerId],
    queryFn: async () => {
      let query = supabase.from('servicemen').select('*').order('name');
      if (providerId) query = query.eq('provider_id', providerId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Employees
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
