import { useAuth, useProviderBookings, useUpdateBookingStatus, useMyProvider } from '@/hooks/useSupabaseData';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import ChatDialog from '@/components/ChatDialog';

export default function ProviderBookings() {
  const { user } = useAuth();
  const { data: provider, isLoading: providerLoading } = useMyProvider(user?.id);
  const { data: bookings = [], isLoading, error: bookingsError } = useProviderBookings(user?.id);
  const updateStatus = useUpdateBookingStatus();

  const [chatBooking, setChatBooking] = useState<any>(null);

  useEffect(() => {
    if (bookingsError) toast.error(`Failed to load bookings: ${bookingsError.message}`);
  }, [bookingsError]);

  const handleStatus = (id: string, status: string) => {
    updateStatus.mutate({ bookingId: id, status }, {
      onSuccess: () => toast.success(`Booking updated to ${status}`),
      onError: (err) => toast.error(err.message),
    });
  };

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;
  if (isLoading || providerLoading) return <div className="container mx-auto px-4 py-8"><Skeleton className="h-96 rounded-xl" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">Booking Requests</h1>
      <p className="text-muted-foreground mt-1">Manage incoming booking requests and update task status</p>

      <div className="mt-8 space-y-4">
        {bookings.map((b: any) => (
          <div key={b.id} className="bg-card rounded-xl p-5 shadow-card border">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading font-semibold text-foreground">{b.service?.name}</h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  {b.customer?.full_name || 'No Name'} 
                  {b.customer?.phone && (
                    <span className="ml-2 font-normal text-primary">
                      · <a href={`tel:${b.customer.phone}`} className="hover:underline">📞 {b.customer.phone}</a>
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  📅 {b.booking_date} · 🕒 {b.booking_time}
                </p>
                <p className="text-sm text-muted-foreground mt-1">📍 {b.address}</p>
                {b.notes && (
                  <div className="mt-3 p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <span className="font-semibold block text-foreground mb-0.5">Notes:</span>
                    {b.notes}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="font-heading font-bold text-primary text-lg">₹{b.amount}</p>
                <div className="flex flex-col items-end gap-1.5 mt-1">
                  <StatusBadge status={b.status} />
                  <span className={`text-[10px] px-2 py-0.5 font-medium rounded uppercase ${
                    b.payment_status === 'paid' 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    Payment: {b.payment_status || 'pending'}
                  </span>
                  {b.is_emergency && (
                    <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-destructive text-destructive-foreground rounded">
                      EMERGENCY
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4 flex-wrap">
              {b.status === 'pending' && (
                <>
                  <Button size="sm" onClick={() => handleStatus(b.id, 'accepted')}>Accept</Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleStatus(b.id, 'cancelled')}>Decline</Button>
                </>
              )}
              {b.status === 'accepted' && (
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95" onClick={() => handleStatus(b.id, 'on_the_way')}>
                  Start Travel
                </Button>
              )}
              {b.status === 'on_the_way' && (
                <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-700" onClick={() => handleStatus(b.id, 'started')}>
                  Start Service
                </Button>
              )}
              {b.status === 'started' && (
                <Button size="sm" className="bg-success text-white hover:bg-success/90" onClick={() => handleStatus(b.id, 'completed')}>
                  Complete Job
                </Button>
              )}
              
              {!['completed', 'cancelled'].includes(b.status) && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setChatBooking(b)}>
                  <MessageCircle className="h-3.5 w-3.5" /> Chat
                </Button>
              )}
            </div>
          </div>
        ))}
        
        {bookings.length === 0 && (
          <p className="text-center py-10 text-muted-foreground">No booking requests.</p>
        )}
      </div>

      {/* Chat Dialog */}
      {chatBooking && (
        <ChatDialog
          open={!!chatBooking}
          onOpenChange={(open) => !open && setChatBooking(null)}
          bookingId={chatBooking.id}
          userId={user.id}
          otherPartyName={chatBooking.customer?.full_name || 'Customer'}
        />
      )}
    </div>
  );
}
