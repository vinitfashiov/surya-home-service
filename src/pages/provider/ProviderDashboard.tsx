import { useAuth, useProviderBookings, useMyProvider, useServicemen, useCategories, useServices } from '@/hooks/useSupabaseData';
import { useReviewsForProvider } from '@/hooks/useReviews';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { CalendarDays, Users, DollarSign, Star, TrendingUp, Percent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { data: provider } = useMyProvider(user?.id);
  const { data: bookings = [], isLoading } = useProviderBookings(user?.id);
  const { data: myServicemen = [] } = useServicemen(provider?.id);
  const { data: reviews = [] } = useReviewsForProvider(provider?.id);
  const { data: categories = [] } = useCategories();
  const { data: services = [] } = useServices();

  if (!user) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;
  }

  // Show onboarding for pending/rejected providers
  if (provider && provider.status !== 'active') {
    return <ProviderOnboarding provider={provider} />;
  }

  const totalEarnings = bookings.filter((b: any) => b.payment_status === 'paid').reduce((s: number, b: any) => s + Number(b.amount), 0);
  const activeBookings = bookings.filter((b: any) => !['completed', 'cancelled'].includes(b.status)).length;
  const completedBookings = bookings.filter((b: any) => b.status === 'completed').length;
  const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;

  // Calculate commission deducted
  const totalCommission = bookings
    .filter((b: any) => b.payment_status === 'paid')
    .reduce((sum: number, b: any) => {
      const service = services.find((s: any) => s.id === b.service_id);
      const category = service ? categories.find((c: any) => c.id === (service as any).category_id) : null;
      const rate = (category as any)?.commission_rate ?? 20;
      return sum + (Number(b.amount) * rate / 100);
    }, 0);

  const netEarnings = totalEarnings - totalCommission;
  const avgRating = reviews.length > 0 ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">Provider Dashboard</h1>
      <p className="text-muted-foreground mt-1">{provider?.company_name || 'Your company'} — manage your services and team</p>

      {/* Earnings overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <StatCard title="Active Bookings" value={activeBookings} icon={CalendarDays} />
        <StatCard title="Servicemen" value={myServicemen.length} icon={Users} />
        <StatCard title="Total Earnings" value={`₹${totalEarnings.toLocaleString()}`} icon={DollarSign} />
        <StatCard title="Net Earnings" value={`₹${Math.round(netEarnings).toLocaleString()}`} icon={TrendingUp} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Percent className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Commission Paid</p>
              <p className="font-heading font-bold text-foreground">₹{Math.round(totalCommission).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="font-heading font-bold text-foreground">{completedBookings}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="font-heading font-bold text-foreground">{pendingBookings}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
              <p className="font-heading font-bold text-foreground">{avgRating} ⭐</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <div className="mt-8">
        <h2 className="text-xl font-heading font-bold text-foreground mb-4">Recent Bookings</h2>
        {isLoading ? <Skeleton className="h-48 rounded-xl" /> : (
          <div className="space-y-3">
            {bookings.map((b: any) => (
              <div key={b.id} className="bg-card rounded-xl p-4 shadow-card border flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{b.service?.name}</p>
                  <p className="text-sm text-muted-foreground">{b.customer?.full_name} · {b.booking_date} {b.booking_time}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold text-primary">₹{b.amount}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-center py-10 text-muted-foreground">No bookings yet.</p>}
          </div>
        )}
      </div>

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-heading font-bold text-foreground mb-4">Recent Reviews</h2>
          <div className="space-y-3">
            {reviews.slice(0, 5).map((r: any) => (
              <Card key={r.id} className="border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{r.customer?.full_name || 'Customer'}</p>
                    <div className="flex items-center gap-1 text-warning">
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
