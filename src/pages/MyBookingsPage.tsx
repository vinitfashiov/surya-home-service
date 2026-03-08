import { useAppStore } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { CalendarDays, Clock, MapPin } from 'lucide-react';

export default function MyBookingsPage() {
  const { bookings } = useAppStore();
  const myBookings = bookings.filter((b) => b.customerId === '1' || b.customerId === 'current');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">My Bookings</h1>
      <p className="text-muted-foreground mt-1">Track your service bookings</p>

      <div className="mt-8 space-y-4">
        {myBookings.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No bookings yet.</div>
        ) : (
          myBookings.map((booking) => (
            <div key={booking.id} className="bg-card rounded-xl p-5 shadow-card border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{booking.serviceName}</h3>
                  <p className="text-sm text-muted-foreground">{booking.providerName}</p>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {booking.date}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {booking.time}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {booking.address}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-heading font-bold text-primary">${booking.amount}</span>
                {booking.servicemanName && (
                  <span className="text-sm text-muted-foreground">Assigned: <span className="font-medium text-foreground">{booking.servicemanName}</span></span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
