import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMyBookings, useUpdateBookingStatus } from '@/hooks/useSupabaseData';
import { useCancellationRules } from '@/hooks/useCancellationRules';
import StatusBadge from '@/components/StatusBadge';
import { ArrowLeft, CalendarDays, Clock, MapPin, Phone, User, CheckCircle, XCircle, AlertTriangle, MessageCircle } from 'lucide-react';
import ChatDialog from '@/components/ChatDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const statusSteps = [
  { key: 'pending', label: 'Booking Confirmed', icon: CheckCircle },
  { key: 'accepted', label: 'Accepted by Provider', icon: CheckCircle },
  { key: 'on_the_way', label: 'On the Way', icon: MapPin },
  { key: 'started', label: 'Service Started', icon: Clock },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
];

const statusOrder = ['pending', 'accepted', 'on_the_way', 'started', 'completed'];

export default function OrderTrackingPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: bookings = [], isLoading } = useMyBookings(user?.id);
  const updateStatus = useUpdateBookingStatus();
  const { canCancel, cancellationFee, freeMinutes } = useCancellationRules();

  const booking = bookings.find((b: any) => b.id === bookingId);

  const [chatOpen, setChatOpen] = useState(false);
  // Real-time subscription for booking updates
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  useEffect(() => {
    if (!bookingId) return;
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` }, (payload) => {
        setLiveStatus(payload.new.status);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bookingId]);

  const currentStatus = liveStatus || booking?.status || 'pending';
  const currentStepIndex = statusOrder.indexOf(currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  const handleCancel = async () => {
    if (!booking) return;
    const bookingCreatedAt = new Date(booking.created_at);
    const now = new Date();
    const minutesSinceBooking = (now.getTime() - bookingCreatedAt.getTime()) / 60000;
    const isFree = minutesSinceBooking <= freeMinutes;

    const confirmMsg = isFree
      ? 'Cancel this booking for free?'
      : `A cancellation fee of ${cancellationFee}% (₹${Math.round(booking.amount * cancellationFee / 100)}) will apply. Continue?`;

    if (!confirm(confirmMsg)) return;

    try {
      await updateStatus.mutateAsync({ bookingId: booking.id, status: 'cancelled' });
      toast.success('Booking cancelled');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel');
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Please log in to track your order.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Booking not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/my-bookings')}>My Bookings</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <button onClick={() => navigate('/my-bookings')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Bookings
      </button>

      {/* Booking header */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl shadow-card border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-heading font-bold text-foreground">{booking.service?.name}</h1>
            <p className="text-sm text-muted-foreground">{booking.provider?.company_name}</p>
          </div>
          <StatusBadge status={currentStatus as any} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{booking.booking_date}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{booking.booking_time}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{booking.address}</span>
          </div>

        </div>
        <Separator className="my-4" />
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Amount</span>
          <span className="text-lg font-heading font-bold text-primary">₹{booking.amount}</span>
        </div>
      </motion.div>

      {/* Status Timeline */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl shadow-card border p-6 mb-6">
        <h2 className="font-heading font-semibold text-foreground mb-6">Order Status</h2>

        {isCancelled ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <XCircle className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Booking Cancelled</p>
              <p className="text-sm text-muted-foreground">This booking has been cancelled.</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-muted" />
            <div
              className="absolute left-[18px] top-0 w-0.5 bg-primary transition-all duration-500"
              style={{ height: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%` }}
            />

            <div className="space-y-6">
              {statusSteps.map((step, i) => {
                const isActive = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-4 relative"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 transition-colors ${
                      isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                      isActive ? 'bg-primary text-primary-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-primary font-medium mt-0.5">Current status</p>
                      )}
                    </div>
                    {isActive && <CheckCircle className="h-4 w-4 text-success" />}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* Chat button */}
      {!isCancelled && currentStatus !== 'completed' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
          <Button variant="outline" className="w-full gap-2" onClick={() => setChatOpen(true)}>
            <MessageCircle className="h-4 w-4" /> Chat with Provider
          </Button>
        </motion.div>
      )}

      {/* Actions */}
      {!isCancelled && currentStatus !== 'completed' && canCancel(currentStatus) && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl shadow-card border p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-foreground text-sm">Cancel Booking</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Free cancellation within {freeMinutes} minutes of booking. After that, a {cancellationFee}% fee applies.
              </p>
              <Button variant="destructive" size="sm" className="mt-3" onClick={handleCancel} disabled={updateStatus.isPending}>
                {updateStatus.isPending ? 'Cancelling...' : 'Cancel Booking'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        bookingId={booking.id}
        userId={user.id}
        otherPartyName={booking.provider?.company_name || 'Provider'}
      />
    </div>
  );
}
