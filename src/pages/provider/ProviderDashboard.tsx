import { useAppStore } from '@/lib/store';
import { servicemen } from '@/lib/mock-data';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { CalendarDays, Users, DollarSign, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ProviderDashboard() {
  const { bookings } = useAppStore();
  const providerBookings = bookings.filter((b) => b.providerId === '1');
  const myServicemen = servicemen.filter((s) => s.providerId === '1');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">Provider Dashboard</h1>
      <p className="text-muted-foreground mt-1">Glamour Studio — manage your services and team</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <StatCard title="Active Bookings" value={providerBookings.filter(b => !['completed', 'cancelled'].includes(b.status)).length} icon={CalendarDays} />
        <StatCard title="Servicemen" value={myServicemen.length} icon={Users} />
        <StatCard title="Revenue" value={`$${providerBookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.amount, 0)}`} icon={DollarSign} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-heading font-bold text-foreground mb-4">Recent Bookings</h2>
        <div className="space-y-3">
          {providerBookings.map((b) => (
            <div key={b.id} className="bg-card rounded-xl p-4 shadow-card border flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{b.serviceName}</p>
                <p className="text-sm text-muted-foreground">{b.customerName} · {b.date} {b.time}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-heading font-bold text-primary">${b.amount}</span>
                <StatusBadge status={b.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
