import { useAppStore } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { BookingStatus } from '@/lib/types';
import { toast } from 'sonner';

export default function ProviderBookings() {
  const { bookings, updateBookingStatus } = useAppStore();
  const providerBookings = bookings.filter((b) => b.providerId === '1');

  const handleStatus = (id: string, status: BookingStatus) => {
    updateBookingStatus(id, status);
    toast.success(`Booking updated to ${status}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">Booking Requests</h1>
      <p className="text-muted-foreground mt-1">Manage incoming booking requests</p>

      <div className="mt-8 space-y-4">
        {providerBookings.map((b) => (
          <div key={b.id} className="bg-card rounded-xl p-5 shadow-card border">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading font-semibold text-foreground">{b.serviceName}</h3>
                <p className="text-sm text-muted-foreground">{b.customerName} · {b.date} {b.time}</p>
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
      </div>
    </div>
  );
}
