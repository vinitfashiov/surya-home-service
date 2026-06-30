import { useAuth, useProviderBookings, useUpdateBookingStatus, useServicemen, useMyProvider } from '@/hooks/useSupabaseData';
import { useAssignServiceman } from '@/hooks/useBookingAssignment';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { MessageCircle, UserPlus, CheckCircle } from 'lucide-react';
import ChatDialog from '@/components/ChatDialog';

export default function ProviderBookings() {
  const { user } = useAuth();
  const { data: provider, isLoading: providerLoading } = useMyProvider(user?.id);
  const { data: bookings = [], isLoading, error: bookingsError } = useProviderBookings(user?.id);
  const { data: servicemen = [] } = useServicemen(provider?.id);
  const updateStatus = useUpdateBookingStatus();
  const assignServiceman = useAssignServiceman();

  const [chatBooking, setChatBooking] = useState<any>(null);
  const [assigningBooking, setAssigningBooking] = useState<any>(null);
  const [selectedServiceman, setSelectedServiceman] = useState<string>('');

  useEffect(() => {
    if (bookingsError) toast.error(`Failed to load bookings: ${bookingsError.message}`);
  }, [bookingsError]);

  const handleStatus = (id: string, status: string) => {
    updateStatus.mutate({ bookingId: id, status }, {
      onSuccess: () => toast.success(`Booking updated to ${status}`),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleAssignServiceman = () => {
    if (!assigningBooking || !selectedServiceman) return;

    assignServiceman.mutate(
      { bookingId: assigningBooking.id, servicemanId: selectedServiceman },
      {
        onSuccess: () => {
          toast.success('Serviceman assigned successfully');
          setAssigningBooking(null);
          setSelectedServiceman('');
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  const openAssignDialog = (booking: any) => {
    setAssigningBooking(booking);
    setSelectedServiceman(booking.serviceman_id || '');
  };

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;
  if (isLoading || providerLoading) return <div className="container mx-auto px-4 py-8"><Skeleton className="h-96 rounded-xl" /></div>;

  const availableServicemen = servicemen.filter((s: any) => s.status === 'available');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">Booking Requests</h1>
      <p className="text-muted-foreground mt-1">Manage incoming booking requests and assign servicemen</p>

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
                {b.serviceman && (
                  <p className="text-sm text-primary mt-3 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Assigned to: {b.serviceman.name}
                  </p>
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
                  <Button size="sm" variant="outline" onClick={() => handleStatus(b.id, 'cancelled')}>Decline</Button>
                </>
              )}
              
              {/* Show assign serviceman button for accepted bookings or to reassign */}
              {['accepted', 'assigned'].includes(b.status) && (
                <Button 
                  size="sm" 
                  variant={b.serviceman_id ? 'outline' : 'default'}
                  className="gap-1.5"
                  onClick={() => openAssignDialog(b)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {b.serviceman_id ? 'Reassign Serviceman' : 'Assign Serviceman'}
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

      {/* Assign Serviceman Dialog */}
      <Dialog open={!!assigningBooking} onOpenChange={(open) => !open && setAssigningBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Serviceman</DialogTitle>
            <DialogDescription>
              Select a serviceman for: {assigningBooking?.service?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Serviceman</label>
              <Select value={selectedServiceman} onValueChange={setSelectedServiceman}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a serviceman..." />
                </SelectTrigger>
                <SelectContent>
                  {availableServicemen.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <span>{s.name}</span>
                        {s.rating > 0 && (
                          <span className="text-xs text-muted-foreground">⭐ {s.rating}</span>
                        )}
                        {s.completed_jobs > 0 && (
                          <span className="text-xs text-muted-foreground">({s.completed_jobs} jobs)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {availableServicemen.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No available servicemen. Add servicemen in the Servicemen section.
                </p>
              )}
            </div>

            {/* Selected serviceman skills */}
            {selectedServiceman && (
              <div className="p-3 bg-muted/50 rounded-lg">
                {(() => {
                  const sm = servicemen.find((s: any) => s.id === selectedServiceman);
                  return sm ? (
                    <div>
                      <p className="font-medium text-sm">{sm.name}</p>
                      {sm.skills?.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Skills: {sm.skills.join(', ')}
                        </p>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAssigningBooking(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignServiceman}
                disabled={!selectedServiceman || assignServiceman.isPending}
              >
                {assignServiceman.isPending ? 'Assigning...' : 'Assign & Notify'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
