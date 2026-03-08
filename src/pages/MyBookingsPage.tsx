import { useAuthContext } from '@/contexts/AuthContext';
import { useMyBookings } from '@/hooks/useSupabaseData';
import { useReviewForBooking } from '@/hooks/useReviews';
import { useCancellationRules } from '@/hooks/useCancellationRules';
import { useUpdateBookingStatus } from '@/hooks/useSupabaseData';
import StatusBadge from '@/components/StatusBadge';
import ReviewDialog from '@/components/ReviewDialog';
import { CalendarDays, Clock, MapPin, Star, RotateCcw, Eye, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

function BookingCard({ booking, userId }: { booking: any; userId: string }) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const { data: existingReview } = useReviewForBooking(booking.id);
  const { canCancel, cancellationFee, freeMinutes } = useCancellationRules();
  const updateStatus = useUpdateBookingStatus();
  const navigate = useNavigate();

  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';
  const canReview = isCompleted && !existingReview;
  const showCancel = canCancel(booking.status);

  const handleRebook = () => {
    navigate(`/service/${booking.service_id}`);
  };

  const handleTrack = () => {
    navigate(`/order/${booking.id}`);
  };

  const handleCancel = async () => {
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

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 shadow-card border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading font-semibold text-foreground">{booking.service?.name}</h3>
            <p className="text-sm text-muted-foreground">{booking.provider?.company_name}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {booking.booking_date}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {booking.booking_time}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {booking.address}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-heading font-bold text-primary">₹{booking.amount}</span>
          <div className="flex items-center gap-2 flex-wrap">
            {booking.serviceman?.name && (
              <span className="text-xs text-muted-foreground">Assigned: <span className="font-medium text-foreground">{booking.serviceman.name}</span></span>
            )}
          </div>
        </div>
        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {!isCancelled && !isCompleted && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleTrack}>
              <Eye className="h-3.5 w-3.5" /> Track Order
            </Button>
          )}
          {canReview && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setReviewOpen(true)}>
              <Star className="h-3.5 w-3.5" /> Rate
            </Button>
          )}
          {(isCompleted || isCancelled) && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleRebook}>
              <RotateCcw className="h-3.5 w-3.5" /> Book Again
            </Button>
          )}
          {showCancel && (
            <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" onClick={handleCancel} disabled={updateStatus.isPending}>
              <XCircle className="h-3.5 w-3.5" /> Cancel
            </Button>
          )}
          {existingReview && (
            <div className="flex items-center gap-1 text-sm text-warning ml-auto">
              {[...Array(existingReview.rating)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
          )}
        </div>
      </motion.div>
      <ReviewDialog open={reviewOpen} onOpenChange={setReviewOpen} booking={booking} userId={userId} />
    </>
  );
}

export default function MyBookingsPage() {
  const { user } = useAuthContext();
  const { data: bookings = [], isLoading } = useMyBookings(user?.id);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Please log in to see your bookings.</p>
        <Button className="mt-4" onClick={() => navigate('/login?redirect=/my-bookings')}>Sign In</Button>
      </div>
    );
  }

  const upcoming = bookings.filter((b: any) => ['pending', 'accepted', 'assigned', 'on_the_way', 'started'].includes(b.status));
  const completed = bookings.filter((b: any) => b.status === 'completed');
  const cancelled = bookings.filter((b: any) => b.status === 'cancelled');

  const renderList = (list: any[]) => {
    if (isLoading) return [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />);
    if (list.length === 0) return <div className="text-center py-16 text-muted-foreground">No bookings found.</div>;
    return list.map((booking: any) => <BookingCard key={booking.id} booking={booking} userId={user.id} />);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-heading font-bold text-foreground">My Bookings</h1>
      <p className="text-muted-foreground mt-1">Track and manage your service bookings</p>

      <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="upcoming" className="gap-1.5">
            Upcoming {upcoming.length > 0 && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{upcoming.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {renderList(upcoming)}
        </TabsContent>
        <TabsContent value="completed" className="mt-4 space-y-4">
          {renderList(completed)}
        </TabsContent>
        <TabsContent value="cancelled" className="mt-4 space-y-4">
          {renderList(cancelled)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
