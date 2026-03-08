import { useAllBookings, useProviders, useCategories } from '@/hooks/useSupabaseData';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { CalendarDays, Building2, Package, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { data: bookings = [], isLoading } = useAllBookings();
  const { data: providers = [] } = useProviders();
  const { data: categories = [] } = useCategories();
  const totalRevenue = bookings.filter((b: any) => b.payment_status === 'paid').reduce((s: number, b: any) => s + Number(b.amount), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">Admin Dashboard</h1>
      <p className="text-muted-foreground mt-1">Platform overview and management</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <StatCard title="Total Bookings" value={bookings.length} change="+12% this week" changeType="positive" icon={CalendarDays} />
        <StatCard title="Revenue" value={`$${totalRevenue}`} change="+8% this week" changeType="positive" icon={DollarSign} />
        <StatCard title="Providers" value={providers.length} change="+2 new" changeType="positive" icon={Building2} />
        <StatCard title="Categories" value={categories.length} icon={Package} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-heading font-bold text-foreground mb-4">Recent Bookings</h2>
        {isLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <div className="bg-card rounded-xl shadow-card border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Service</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 10).map((b: any) => (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4 font-medium text-foreground">{b.customer?.full_name || 'Customer'}</td>
                      <td className="p-4 text-foreground">{b.service?.name}</td>
                      <td className="p-4 text-muted-foreground">{b.booking_date}</td>
                      <td className="p-4 font-medium text-primary">${b.amount}</td>
                      <td className="p-4"><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bookings.length === 0 && <p className="text-center py-10 text-muted-foreground">No bookings yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
