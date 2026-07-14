import { useAuth, useProviderBookings, useMyProvider, useCategories, useServices } from '@/hooks/useSupabaseData';
import { useReviewsForProvider } from '@/hooks/useReviews';
import StatusBadge from '@/components/StatusBadge';
import {
  Calendar, Users, Wallet, Star, TrendingUp,
  Clock, ShieldCheck, ChevronRight,
  MapPin, Award, ShieldAlert
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProviderTranslation } from '@/hooks/useProviderTranslation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: provider, error: providerError, refetch } = useMyProvider(user?.id);
  const { data: bookings = [], isLoading, error: bookingsError } = useProviderBookings(user?.id);
  const { data: reviews = [], error: reviewsError } = useReviewsForProvider(provider?.id);
  const { data: categories = [] } = useCategories();
  const { data: services = [] } = useServices();
  const { t } = useProviderTranslation();

  useEffect(() => {
    if (providerError) toast.error(`Failed to load provider: ${providerError.message}`);
    if (bookingsError) toast.error(`Failed to load bookings: ${bookingsError.message}`);
    if (reviewsError) toast.error(`Failed to load reviews: ${reviewsError.message}`);
  }, [providerError, bookingsError, reviewsError]);

  // ── Onboarding Redirect ──
  // If provider exists but hasn't completed onboarding → send to /provider/onboarding
  useEffect(() => {
    if (!provider) return;
    const isVerifiedOrActive = !!(provider.is_verified || provider.status === 'active');
    const hasCompletedOnboarding = !!(
      localStorage.getItem(`provider_onboarding_completed_${provider.id}`) === 'true' ||
      (provider.aadhaar_number && provider.bank_account_number && provider.latitude)
    );
    if (!isVerifiedOrActive && !hasCompletedOnboarding) {
      navigate('/provider/onboarding', { replace: true });
    }
  }, [provider, navigate]);

  if (!user) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;
  }

  if (isLoading && !provider) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg space-y-4">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Dashboard Metrics ──
  const totalEarnings = bookings.filter((b: any) => b.payment_status === 'paid').reduce((s: number, b: any) => s + Number(b.amount), 0);
  const activeBookings = bookings.filter((b: any) => !['completed', 'cancelled'].includes(b.status)).length;
  const completedBookings = bookings.filter((b: any) => b.status === 'completed').length;
  const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;
  const totalCommission = totalEarnings * 0.20;
  const netEarnings = totalEarnings * 0.80;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ── Header ── */}
      <div className="bg-slate-900 text-white pt-8 pb-12 px-4 rounded-b-[2.5rem] shadow-xl max-w-lg mx-auto relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wide flex items-center gap-0.5">
                <ShieldCheck className="h-2.5 w-2.5" /> Partner
              </span>
              {provider?.is_verified && (
                <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/30 uppercase tracking-wide">
                  Verified ✓
                </span>
              )}
            </div>
            <h1 className="text-xl font-heading font-black text-white mt-1">
              Namaste, {provider?.owner_name?.split(' ')[0] || 'Partner'}! 👋
            </h1>
            <p className="text-xs text-slate-400">{provider?.company_name}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-2.5 text-center border border-white/10 shrink-0">
            <span className="text-lg font-black block text-amber-400">{avgRating} ⭐</span>
            <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider block">Rating</span>
          </div>
        </div>

        {/* Pending Verification Banner */}
        {!provider?.is_verified && (
          <div className="relative z-10 mt-5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="font-bold text-amber-300 text-xs">Verification Pending ⏳</h4>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                Your profile is under review. Active jobs & duty switch unlock after admin verification.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="container mx-auto px-4 -mt-6 max-w-lg space-y-4 relative z-10">

        {/* Wallet Card */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white p-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Available Balance</span>
                <h2 className="text-3xl font-heading font-black text-white">₹{Math.round(netEarnings).toLocaleString('en-IN')}</h2>
              </div>
              <Button
                onClick={() => navigate('/provider/payouts')}
                size="sm"
                className="bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl h-8 gap-1.5"
              >
                <Wallet className="h-3.5 w-3.5" /> Withdraw
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-3 mt-3 text-xs">
              <div>
                <span className="block text-slate-400 mb-0.5">Total Sales</span>
                <span className="font-bold text-white">₹{totalEarnings.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="block text-slate-400 mb-0.5">Platform Commission (20%)</span>
                <span className="font-bold text-rose-400">-₹{Math.round(totalCommission).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1 mb-2">Quick Tools</p>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'GPS Hub', icon: MapPin, color: 'text-primary bg-primary/10', path: '/provider/hub' },
              { label: 'My Hours', icon: Clock, color: 'text-emerald-600 bg-emerald-500/10', path: '/provider/availability' },
              { label: 'Profile', icon: Award, color: 'text-purple-600 bg-purple-500/10', path: '/provider/profile' },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="bg-white border rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1 mb-2">Performance</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Active Jobs', value: activeBookings, icon: Calendar, color: 'text-blue-600 bg-blue-500/10' },
              { label: 'Completed', value: completedBookings, icon: Users, color: 'text-emerald-600 bg-emerald-500/10' },
              { label: 'Pending', value: pendingBookings, icon: Clock, color: 'text-amber-600 bg-amber-500/10' },
              { label: 'Total Sales', value: `₹${totalEarnings.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-purple-600 bg-purple-500/10' },
            ].map(stat => (
              <Card key={stat.label} className="border shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wide">{stat.label}</span>
                    <p className="font-heading font-black text-slate-900 text-base leading-tight">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div>
          <div className="flex justify-between items-center pl-1 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent Bookings</p>
            <button onClick={() => navigate('/provider/bookings')} className="text-xs font-bold text-primary flex items-center gap-0.5">
              See All <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {isLoading ? (
            <Skeleton className="h-24 rounded-2xl" />
          ) : bookings.length === 0 ? (
            <div className="bg-white border border-dashed rounded-2xl py-8 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs text-slate-400 font-medium">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {bookings.slice(0, 3).map((b: any) => (
                <div
                  key={b.id}
                  onClick={() => navigate(`/provider/booking/${b.id}`)}
                  className="bg-white rounded-2xl p-4 shadow-sm border hover:border-primary/30 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="space-y-0.5 min-w-0 flex-1 pr-3">
                    <p className="font-heading font-black text-sm text-slate-800 truncate">{b.service?.name || 'Service'}</p>
                    <p className="text-[11px] text-slate-400">
                      {b.customer?.full_name || 'Customer'} · {b.booking_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-heading font-black text-primary text-sm">₹{b.amount}</span>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pl-1 mb-2">Customer Reviews</p>
            <div className="space-y-2.5">
              {reviews.slice(0, 2).map((r: any) => (
                <Card key={r.id} className="border shadow-sm">
                  <CardContent className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-800">{r.customer?.full_name || 'Customer'}</p>
                      <div className="flex text-amber-400">
                        {[...Array(r.rating)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                      </div>
                    </div>
                    {r.comment && <p className="text-xs text-slate-500 leading-relaxed">{r.comment}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
