import { useAllBookings, useUpdateBookingStatus } from '@/hooks/useSupabaseData';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function AdminBookings() {
  const { data: bookings = [], isLoading } = useAllBookings();
  const updateStatus = useUpdateBookingStatus();

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ bookingId: id, status }, {
      onSuccess: () => toast.success(`Booking updated to ${status}`),
      onError: (err) => toast.error(err.message),
    });
  };

  if (isLoading) return <div className="container mx-auto px-4 py-8"><Skeleton className="h-96 rounded-xl" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">Manage Bookings</h1>
      <p className="text-muted-foreground mt-1">View and manage all platform bookings</p>

      <div className="mt-8 bg-card rounded-xl shadow-card border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
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
              {bookings.map((b: any) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4 font-medium text-foreground">{b.customer?.full_name || 'Customer'}</td>
                  <td className="p-4 text-foreground">{b.service?.name}</td>
                  <td className="p-4 text-muted-foreground">{b.provider?.company_name}</td>
                  <td className="p-4 text-muted-foreground">{b.booking_date} {b.booking_time}</td>
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
        {bookings.length === 0 && <p className="text-center py-10 text-muted-foreground">No bookings yet.</p>}
      </div>
    </div>
  );
}
