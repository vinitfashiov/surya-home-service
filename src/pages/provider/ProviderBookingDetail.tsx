import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useProviderTranslation } from '@/hooks/useProviderTranslation';
import {
  ChevronLeft, Phone, MapPin, MessageSquare, AlertTriangle,
  Calendar, Clock, CheckCircle2, Navigation, Send,
  Wallet, IndianRupee, BadgeCheck
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ChatDialog from '@/components/ChatDialog';
import StatusBadge from '@/components/StatusBadge';

// ── Maps URL helper: works in WebView + browser ──
function getMapsUrl(address: string) {
  // geo: URI scheme works in native Android (including WebView via intent)
  // Fallback to plain Google Maps HTTPS which also works in WebView
  const encoded = encodeURIComponent(address);
  return `https://maps.google.com/?q=${encoded}`;
}

// Open maps — handles Android WebView intent:// errors by using plain https
function openMaps(address: string) {
  const url = getMapsUrl(address);
  try {
    window.open(url, '_blank');
  } catch {
    window.location.href = url;
  }
}

export default function ProviderBookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [chatOpen, setChatOpen] = useState(false);
  const [showPaymentCollect, setShowPaymentCollect] = useState(false);
  const [paymentCollected, setPaymentCollected] = useState(false);
  const { t } = useProviderTranslation();

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['provider-booking-detail', bookingId],
    queryFn: async () => {
      if (!bookingId) throw new Error('No booking ID provided');
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, duration, price, image_url),
          customer:profiles!bookings_customer_id_fkey(full_name, phone)
        `)
        .eq('id', bookingId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: newStatus as any })
        .eq('id', bookingId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['provider-booking-detail', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update status'),
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ provider_id: null, status: 'pending' } as any)
        .eq('id', bookingId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      const declined = JSON.parse(localStorage.getItem('provider_declined_bookings') || '[]');
      if (bookingId && !declined.includes(bookingId)) {
        declined.push(bookingId);
        localStorage.setItem('provider_declined_bookings', JSON.stringify(declined));
      }
      toast.success('You have declined the request.');
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      navigate('/provider/bookings');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to decline request'),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-12 text-center max-w-lg">
        <p className="text-destructive mb-4">Error loading booking details.</p>
        <Button onClick={() => navigate('/provider/bookings')}>Back to Bookings</Button>
      </div>
    );
  }

  const status = booking.status;
  const customer = booking.customer;
  const service = booking.service;

  const isStepActive = (stepName: string) => {
    const states = ['pending', 'accepted', 'on_the_way', 'started', 'completed'];
    const currentIdx = states.indexOf(status);
    const targetIdx = states.indexOf(stepName);
    if (status === 'cancelled') return false;
    return targetIdx <= currentIdx;
  };

  const steps = [
    { name: 'pending', label: t('booking.status.pending'), desc: 'Booking requested' },
    { name: 'accepted', label: t('booking.status.accepted'), desc: 'Assigned to you' },
    { name: 'on_the_way', label: t('booking.status.on_the_way'), desc: 'Travel started' },
    { name: 'started', label: t('booking.status.started'), desc: 'Service started' },
    { name: 'completed', label: t('booking.status.completed'), desc: 'Job finished successfully' },
  ];

  // ── Handle Complete: show payment collection first ──
  const handleCompleteClick = () => {
    if (!paymentCollected) {
      setShowPaymentCollect(true);
    } else {
      updateStatusMutation.mutate('completed');
    }
  };

  const handleConfirmPaymentCollected = () => {
    setPaymentCollected(true);
    setShowPaymentCollect(false);
    toast.success('Payment marked as collected! Now finish the job.');
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-28 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b h-14 flex items-center px-4 justify-between z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/provider/bookings')} className="-ml-2">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="font-heading font-bold text-base text-foreground">{t('booking.details')}</h1>
            <p className="text-[10px] text-muted-foreground">ID: #{booking.id.slice(0, 8)}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </header>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {/* Emergency */}
        {booking.is_emergency && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3 animate-pulse">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-heading font-bold text-destructive text-sm">{t('booking.emergency')}</p>
              <p className="text-xs text-destructive/80 mt-0.5">Please contact the customer and reach immediately.</p>
            </div>
          </div>
        )}

        {/* Service Card */}
        <Card className="overflow-hidden border shadow-sm">
          <CardContent className="p-4 flex gap-4">
            {service?.image_url ? (
              <img src={service.image_url} alt={service.name} className="w-20 h-20 object-cover rounded-lg shrink-0 border" />
            ) : (
              <div className="w-20 h-20 bg-primary/10 rounded-lg shrink-0 flex items-center justify-center border">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-foreground text-base truncate">{service?.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> {service?.duration || 60} mins
              </p>
              <div className="flex items-center justify-between mt-3">
                <p className="font-heading font-bold text-primary text-lg">₹{booking.amount}</p>
                <span className={`text-[10px] px-2 py-0.5 font-medium rounded uppercase ${
                  booking.payment_status === 'paid'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {booking.payment_status || 'Cash'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /><span>Date</span>
              </div>
              <span className="font-medium text-foreground">{booking.booking_date}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" /><span>Time Slot</span>
              </div>
              <span className="font-medium text-foreground">{booking.booking_time}</span>
            </div>
          </CardContent>
        </Card>

        {/* Customer */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{t('booking.cust_contact')}</p>
                <h4 className="font-heading font-bold text-foreground text-lg mt-1">{customer?.full_name || 'Anonymous'}</h4>
              </div>
              <Button size="icon" variant="outline" className="rounded-full h-10 w-10 text-primary border-primary/20" onClick={() => setChatOpen(true)}>
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
            {customer?.phone && (
              <div className="flex gap-2.5">
                <Button className="flex-1 gap-2 bg-primary text-white" asChild>
                  <a href={`tel:${customer.phone}`}>
                    <Phone className="h-4 w-4" /> {t('booking.tel_btn')}
                  </a>
                </Button>
                <Button variant="outline" className="flex-1 gap-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50/50" asChild>
                  <a href={`https://wa.me/91${customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <Send className="h-4 w-4" /> {t('booking.whatsapp_btn')}
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location — Fixed Maps URL for Android WebView */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {t('booking.address')}
            </p>
            <p className="text-sm text-foreground leading-relaxed font-medium">{booking.address}</p>
            <Button
              variant="outline"
              className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5 mt-2"
              onClick={() => openMaps(booking.address)}
            >
              <Navigation className="h-4 w-4" /> Open in Maps
            </Button>
          </CardContent>
        </Card>

        {/* Notes */}
        {booking.notes && (
          <Card className="border shadow-sm bg-muted/30">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Customer Notes</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{booking.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Status Timeline */}
        <Card className="border shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-4">Job Status Tracker</p>
            {status === 'cancelled' ? (
              <div className="flex items-center gap-3 p-3 bg-destructive/5 rounded-xl border border-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">This booking has been cancelled.</span>
              </div>
            ) : (
              <div className="space-y-5 relative before:absolute before:left-[11px] before:top-[12px] before:bottom-[12px] before:w-[2px] before:bg-muted">
                {steps.map((step) => {
                  const active = isStepActive(step.name);
                  return (
                    <div key={step.name} className="flex items-start gap-4 relative">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border z-10 ${
                        active ? 'bg-primary border-primary text-white' : 'bg-background border-muted-foreground/30'
                      }`}>
                        {active
                          ? <CheckCircle2 className="h-4 w-4" />
                          : <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                        }
                      </div>
                      <p className={`text-sm font-bold leading-none mt-1 ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Payment Collection Card (shows when started & not yet collected) ── */}
        {status === 'started' && showPaymentCollect && !paymentCollected && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
              {/* Jar / Wallet visual */}
              <div className="bg-gradient-to-b from-primary to-primary/80 px-6 pt-8 pb-10 text-center text-white relative">
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                  <IndianRupee className="h-8 w-8 text-primary" />
                </div>
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-white/30">
                  <Wallet className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-heading font-black">Collect Payment</h2>
                <p className="text-white/80 text-sm mt-1">Before finishing, collect the amount from customer</p>
              </div>

              <div className="px-6 pt-10 pb-6 space-y-5">
                {/* Amount box */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Amount to Collect</p>
                  <p className="text-4xl font-heading font-black text-primary">₹{booking.amount}</p>
                  <p className="text-xs text-muted-foreground mt-1">{service?.name}</p>
                </div>

                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Ask the customer to pay ₹{booking.amount} in cash or UPI before you mark the job as complete.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 text-sm font-semibold border-muted"
                    onClick={() => setShowPaymentCollect(false)}
                  >
                    Not Yet
                  </Button>
                  <Button
                    className="h-12 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    onClick={handleConfirmPaymentCollected}
                  >
                    <BadgeCheck className="h-4 w-4" /> Collected ✓
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment collected confirmation strip */}
        {paymentCollected && status === 'started' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
            <BadgeCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-800 text-sm">₹{booking.amount} Collected ✓</p>
              <p className="text-xs text-emerald-700/70">Payment received from customer. You can now finish the job.</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 border-t backdrop-blur-lg flex gap-3 z-40 max-w-lg mx-auto shadow-lg">
        {status === 'pending' && (
          <>
            <Button variant="outline" className="flex-1 border-destructive/20 text-destructive hover:bg-destructive/5 h-11 text-sm font-semibold"
              onClick={() => declineMutation.mutate()} disabled={declineMutation.isPending}>
              {t('booking.action.decline')}
            </Button>
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-sm font-semibold"
              onClick={() => updateStatusMutation.mutate('accepted')} disabled={updateStatusMutation.isPending}>
              {t('booking.action.accept')}
            </Button>
          </>
        )}
        {status === 'accepted' && (
          <Button className="w-full bg-primary text-white h-11 text-sm font-semibold"
            onClick={() => updateStatusMutation.mutate('on_the_way')} disabled={updateStatusMutation.isPending}>
            {t('booking.action.travel')}
          </Button>
        )}
        {status === 'on_the_way' && (
          <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white h-11 text-sm font-semibold"
            onClick={() => updateStatusMutation.mutate('started')} disabled={updateStatusMutation.isPending}>
            {t('booking.action.start')}
          </Button>
        )}
        {status === 'started' && (
          <Button
            className={`w-full h-11 text-sm font-semibold ${paymentCollected ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-primary text-white'}`}
            onClick={handleCompleteClick}
            disabled={updateStatusMutation.isPending}
          >
            {paymentCollected ? '✓ Finish Job' : 'Complete & Collect Payment'}
          </Button>
        )}
        {status === 'completed' && (
          <Button className="w-full bg-muted text-muted-foreground h-11 text-sm font-semibold" disabled>
            ✓ Job Completed
          </Button>
        )}
        {status === 'cancelled' && (
          <Button className="w-full bg-muted text-muted-foreground h-11 text-sm font-semibold" disabled>
            Job Cancelled
          </Button>
        )}
      </div>

      {chatOpen && user && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          bookingId={booking.id}
          userId={user.id}
          otherPartyName={customer?.full_name || 'Customer'}
        />
      )}
    </div>
  );
}
