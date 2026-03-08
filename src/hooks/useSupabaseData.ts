import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

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

// Services with provider info
export function useServices(categoryId?: string, cityId?: string | null) {
  return useQuery({
    queryKey: ['services', categoryId, cityId],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select(`
          *,
          provider:providers(id, company_name),
          category:service_categories(id, name, icon)
        `)
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }
      if (cityId) {
        query = query.eq('city_id', cityId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
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
      // First get the provider for this user
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', userId)
        .single();
      if (!provider) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name),
          customer:profiles!bookings_customer_id_fkey(full_name),
          serviceman:servicemen(name)
        `)
        .eq('provider_id', provider.id)
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
          customer:profiles!bookings_customer_id_fkey(full_name)
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
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
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
