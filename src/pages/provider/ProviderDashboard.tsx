import { useAuth, useProviderBookings, useMyProvider, useServicemen } from '@/hooks/useSupabaseData';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { CalendarDays, Users, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { data: provider } = useMyProvider(user?.id);
  const { data: bookings = [], isLoading } = useProviderBookings(user?.id);
  const { data: myServicemen = [] } = useServicemen(provider?.id);

  if (!user) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">Provider Dashboard</h1>
      <p className="text-muted-foreground mt-1">{provider?.company_name || 'Your company'} — manage your services and team</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <StatCard title="Active Bookings" value={bookings.filter((b: any) => !['completed', 'cancelled'].includes(b.status)).length} icon={CalendarDays} />
        <StatCard title="Servicemen" value={myServicemen.length} icon={Users} />
        <StatCard title="Revenue" value={`$${bookings.filter((b: any) => b.payment_status === 'paid').reduce((s: number, b: any) => s + Number(b.amount), 0)}`} icon={DollarSign} />
      </div>

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
                  <span className="font-heading font-bold text-primary">${b.amount}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-center py-10 text-muted-foreground">No bookings yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
