import { useAppStore } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { BookingStatus } from '@/lib/types';
import { toast } from 'sonner';

export default function AdminBookings() {
  const { bookings, updateBookingStatus } = useAppStore();

  const handleStatusChange = (id: string, status: BookingStatus) => {
    updateBookingStatus(id, status);
    toast.success(`Booking ${id} updated to ${status}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">Manage Bookings</h1>
      <p className="text-muted-foreground mt-1">View and manage all platform bookings</p>

      <div className="mt-8 bg-card rounded-xl shadow-card border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">ID</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Service</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Provider</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4 font-mono text-xs text-muted-foreground">{b.id}</td>
                  <td className="p-4 font-medium text-foreground">{b.customerName}</td>
                  <td className="p-4 text-foreground">{b.serviceName}</td>
                  <td className="p-4 text-muted-foreground">{b.providerName}</td>
                  <td className="p-4 text-muted-foreground">{b.date} {b.time}</td>
                  <td className="p-4 font-medium text-primary">${b.amount}</td>
                  <td className="p-4"><StatusBadge status={b.status} /></td>
                  <td className="p-4">
                    {b.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(b.id, 'accepted')}>Accept</Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleStatusChange(b.id, 'cancelled')}>Cancel</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
