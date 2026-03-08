import { useAppStore } from '@/lib/store';
import { bookings as allBookings, providers, employees, categories } from '@/lib/mock-data';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { CalendarDays, Users, Building2, Package, UserCog, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const { bookings } = useAppStore();
  const totalRevenue = bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.amount, 0);

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
        <div className="bg-card rounded-xl shadow-card border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">ID</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Service</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 font-mono text-xs text-muted-foreground">{b.id}</td>
                    <td className="p-4 font-medium text-foreground">{b.customerName}</td>
                    <td className="p-4 text-foreground">{b.serviceName}</td>
                    <td className="p-4 text-muted-foreground">{b.date}</td>
                    <td className="p-4 font-medium text-primary">${b.amount}</td>
                    <td className="p-4"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
