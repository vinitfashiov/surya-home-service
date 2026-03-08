import { useAuth, useProviderBookings, useUpdateBookingStatus } from '@/hooks/useSupabaseData';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function ProviderBookings() {
  const { user } = useAuth();
  const { data: bookings = [], isLoading } = useProviderBookings(user?.id);
  const updateStatus = useUpdateBookingStatus();

  const handleStatus = (id: string, status: string) => {
    updateStatus.mutate({ bookingId: id, status }, {
      onSuccess: () => toast.success(`Booking updated to ${status}`),
      onError: (err) => toast.error(err.message),
    });
  };

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;
  if (isLoading) return <div className="container mx-auto px-4 py-8"><Skeleton className="h-96 rounded-xl" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">Booking Requests</h1>
      <p className="text-muted-foreground mt-1">Manage incoming booking requests</p>

      <div className="mt-8 space-y-4">
        {bookings.map((b: any) => (
          <div key={b.id} className="bg-card rounded-xl p-5 shadow-card border">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading font-semibold text-foreground">{b.service?.name}</h3>
                <p className="text-sm text-muted-foreground">{b.customer?.full_name} · {b.booking_date} {b.booking_time}</p>
                <p className="text-sm text-muted-foreground mt-1">{b.address}</p>
              </div>
              <div className="text-right">
                <p className="font-heading font-bold text-primary">${b.amount}</p>
                <StatusBadge status={b.status} />
              </div>
            </div>
            {b.status === 'pending' && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => handleStatus(b.id, 'accepted')}>Accept</Button>
                <Button size="sm" variant="outline" onClick={() => handleStatus(b.id, 'cancelled')}>Decline</Button>
              </div>
            )}
            {b.status === 'accepted' && (
              <div className="mt-4">
                <Button size="sm" onClick={() => handleStatus(b.id, 'assigned')}>Assign Serviceman</Button>
              </div>
            )}
          </div>
        ))}
        {bookings.length === 0 && <p className="text-center py-10 text-muted-foreground">No booking requests.</p>}
      </div>
    </div>
  );
}
