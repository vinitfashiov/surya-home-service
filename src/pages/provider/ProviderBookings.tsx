import { useAuth, useProviderBookings, useMyProvider } from '@/hooks/useSupabaseData';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Calendar, Compass, ArrowRight, BellRing, Zap, AlertTriangle } from 'lucide-react';
import { useProviderTranslation } from '@/hooks/useProviderTranslation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function ProviderBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useProviderTranslation();
  
  const { data: provider, isLoading: providerLoading } = useMyProvider(user?.id);
  const { data: bookings = [], isLoading, error: bookingsError } = useProviderBookings(user?.id);
  
  const [activeTab, setActiveTab] = useState<'my_jobs' | 'emergency'>('my_jobs');

  // Load declined bookings list from local storage
  const declinedBookingIds = JSON.parse(localStorage.getItem('provider_declined_bookings') || '[]');

  // Fetch unassigned emergency bookings matching provider's city
  const { data: emergencyBookings = [], isLoading: emergencyLoading } = useQuery({
    queryKey: ['unassigned-emergency-bookings', provider?.city_id],
    queryFn: async () => {
      if (!provider?.city_id) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(
            name,
            provider:providers(
              city_id
            )
          ),
          customer:profiles!bookings_customer_id_fkey(full_name, phone)
        `)
        .is('provider_id', null)
        .eq('is_emergency', true)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter client-side by provider's city
      return (data || []).filter((b: any) => b.service?.provider?.city_id === provider.city_id);
    },
    enabled: !!provider?.city_id,
  });

  // Claim emergency booking mutation
  const claimMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          provider_id: provider.id,
          status: 'accepted'
        } as any)
        .eq('id', bookingId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(t('booking.claim_success'));
      queryClient.invalidateQueries({ queryKey: ['provider-bookings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-emergency-bookings', provider?.city_id] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      setActiveTab('my_jobs');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to claim job');
    }
  });

  useEffect(() => {
    if (bookingsError) toast.error(`Failed to load bookings: ${bookingsError.message}`);
  }, [bookingsError]);

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;
  if (isLoading || providerLoading || emergencyLoading) return <div className="container mx-auto px-4 py-8"><Skeleton className="h-96 rounded-xl" /></div>;

  if (provider && !provider.is_verified) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg pb-16 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-600 animate-pulse">
          <Zap className="h-10 w-10 fill-current" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-heading font-black text-foreground">Verification Required 🔒</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            You cannot accept bookings or start work because your profile is not verified. Please wait for our team to review and activate your account.
          </p>
        </div>
        <div className="p-4 bg-muted/50 border rounded-2xl w-full text-left space-y-3.5">
          <h4 className="text-xs font-bold text-foreground">KYC Checklist Status:</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Identity verification (Aadhaar & PAN)</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase text-[9px]">Verified</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Bank account payout details</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase text-[9px]">Submitted</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">GPS Location coordinates</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase text-[9px]">Pinned</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2 mt-2">
              <span className="font-bold text-foreground">Final System Approval</span>
              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase text-[9px]">Under Review</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">We usually process registrations within 24-48 hours. You will receive a SMS/WhatsApp notification once approved.</p>
      </div>
    );
  }

  // Filter only active booking requests assigned to this provider (exclude completed/cancelled)
  const activeBookings = bookings.filter((b: any) => !['completed', 'cancelled'].includes(b.status));

  // Filter unassigned emergency bookings that have NOT been declined by this provider
  const filteredEmergencyBookings = emergencyBookings.filter(
    (b: any) => !declinedBookingIds.includes(b.id)
  );

  const handleClaimJob = (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation();
    claimMutation.mutate(bookingId);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-black text-foreground">Kaam Requests</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your active service assignments</p>
        </div>
        <div className="relative">
          <BellRing className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer" />
          {activeBookings.length > 0 && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary animate-ping" />
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="bg-muted/40 p-1 rounded-xl flex gap-1 mb-6 border border-black/5">
        <button
          onClick={() => setActiveTab('my_jobs')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'my_jobs'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('booking.tabs.my_jobs')} ({activeBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('emergency')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all relative flex items-center justify-center gap-1.5 ${
            activeTab === 'emergency'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('booking.tabs.emergency')}
          {filteredEmergencyBookings.length > 0 && (
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-destructive animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-3.5">
        {activeTab === 'my_jobs' ? (
          <>
            {activeBookings.map((b: any) => (
              <div 
                key={b.id} 
                className="bg-card rounded-2xl p-4 shadow-sm border hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between"
                onClick={() => navigate(`/provider/booking/${b.id}`)}
              >
                <div className="space-y-1 pr-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={b.status} />
                    {b.is_emergency && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black bg-destructive/10 text-destructive border border-destructive/20 rounded uppercase tracking-wider animate-pulse">
                        Emergency 🚨
                      </span>
                    )}
                  </div>
                  <h3 className="font-heading font-bold text-foreground text-sm truncate mt-1.5">{b.service?.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Customer: {b.customer?.full_name || 'No Name'}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {b.booking_date} · {b.booking_time}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">📍 {b.address}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                  <span className="font-heading font-black text-primary text-base">₹{b.amount}</span>
                  <Button size="sm" className="h-8 text-[10px] font-bold rounded-lg px-3 bg-primary hover:bg-primary/95 gap-1">
                    Kaam Shuru <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {activeBookings.length === 0 && (
              <div className="text-center py-16 space-y-4">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                  <Compass className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">No active bookings</p>
                  <p className="text-xs text-muted-foreground mt-1">New booking assignments will show up here.</p>
                </div>
                <Button onClick={() => navigate('/provider/past-bookings')} variant="outline" className="text-xs font-semibold">
                  View Past Bookings
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {filteredEmergencyBookings.map((b: any) => (
              <div 
                key={b.id} 
                className="bg-card rounded-2xl p-4 shadow-sm border border-destructive/15 hover:border-destructive/30 transition-all flex items-center justify-between"
              >
                <div className="space-y-1 pr-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 text-[9px] font-black bg-destructive/10 text-destructive border border-destructive/20 rounded uppercase tracking-wider animate-pulse">
                      Urgent Request 🚨
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-foreground text-sm truncate mt-1.5">{b.service?.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Customer: {b.customer?.full_name || 'No Name'}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {b.booking_date} · {b.booking_time}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">📍 {b.address}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                  <span className="font-heading font-black text-primary text-base">₹{b.amount}</span>
                  <Button 
                    size="sm" 
                    className="h-8 text-[10px] font-bold rounded-lg px-3 bg-destructive hover:bg-destructive/90 text-white gap-1"
                    onClick={(e) => handleClaimJob(e, b.id)}
                    disabled={claimMutation.isPending}
                  >
                    <Zap className="h-3 w-3 fill-white" />
                    {claimMutation.isPending ? 'Claiming...' : t('booking.action.claim')}
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredEmergencyBookings.length === 0 && (
              <div className="text-center py-16 space-y-4">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                  <Zap className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t('booking.pool.empty')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('booking.pool.desc')}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
