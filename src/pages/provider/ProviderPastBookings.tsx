import { useAuth, useProviderBookings } from '@/hooks/useSupabaseData';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Calendar, History, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function ProviderPastBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: bookings = [], isLoading, error } = useProviderBookings(user?.id);

  useEffect(() => {
    if (error) toast.error(`Failed to load bookings: ${error.message}`);
  }, [error]);

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;

  const pastBookings = bookings.filter((b: any) => ['completed', 'cancelled'].includes(b.status));

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b h-14 flex items-center px-4 justify-between z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/provider/profile')} className="-ml-2">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Purane Jobs (History)
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-lg">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : pastBookings.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
              <Calendar className="h-8 w-8" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No past bookings found</p>
              <p className="text-xs text-muted-foreground mt-1">Jobs you complete or cancel will appear here.</p>
            </div>
            <Button onClick={() => navigate('/provider/bookings')} variant="outline" className="text-xs">
              View Active Bookings
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {pastBookings.map((b: any) => (
              <div 
                key={b.id} 
                className="bg-card rounded-xl p-4 shadow-sm border hover:border-primary/30 transition-all cursor-pointer flex items-center justify-between"
                onClick={() => navigate(`/provider/booking/${b.id}`)}
              >
                <div className="space-y-1 pr-3 flex-1 min-w-0">
                  <h3 className="font-heading font-semibold text-foreground text-sm truncate">{b.service?.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Customer: {b.customer?.full_name || 'No Name'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    📅 {b.booking_date} · 🕒 {b.booking_time}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">📍 {b.address}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                  <span className="font-heading font-bold text-primary text-sm">₹{b.amount}</span>
                  <StatusBadge status={b.status} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
