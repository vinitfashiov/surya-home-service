import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCart, useClearCart } from '@/hooks/useCart';
import { useService, useCreateBooking } from '@/hooks/useSupabaseData';
import { useServiceAddons } from '@/hooks/useServiceAddons';
import { useMyAddresses } from '@/hooks/useAddresses';
import { useCreateNotification } from '@/hooks/useNotifications';
import AddressManager from '@/components/AddressManager';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, CheckCircle, Clock, CreditCard, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const isQuickBook = searchParams.get('mode') === 'quick';
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: cartItems = [], isLoading: cartLoading } = useCart(user?.id);
  const { data: addresses = [] } = useMyAddresses(user?.id);
  const createBooking = useCreateBooking();
  const createNotification = useCreateNotification();
  const clearCart = useClearCart();

  // Quick book data
  const quickBookData = useMemo(() => {
    if (!isQuickBook) return null;
    try { return JSON.parse(sessionStorage.getItem('quickBook') || 'null'); }
    catch { return null; }
  }, [isQuickBook]);

  const { data: quickService } = useService(quickBookData?.serviceId);
  const { data: quickAddons = [] } = useServiceAddons(quickBookData?.serviceId);

  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [coupon, setCoupon] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
  const finalAddress = selectedAddress?.address_line || manualAddress;

  // Redirect unauthenticated users
  useEffect(() => {
    if (!user && !cartLoading) {
      toast.info('Please login to continue booking.');
      navigate('/login?redirect=/checkout' + (isQuickBook ? '?mode=quick' : ''));
    }
  }, [user, cartLoading]);

  // Build line items
  const lineItems = useMemo(() => {
    if (isQuickBook && quickService) {
      const selectedAddonIds = quickBookData?.addonIds || [];
      const selectedQuickAddons = quickAddons.filter((a: any) => selectedAddonIds.includes(a.id));
      const addonsTotal = selectedQuickAddons.reduce((s: number, a: any) => s + Number(a.price), 0);
      return [{
        serviceId: quickService.id,
        name: quickService.name,
        providerId: quickService.provider_id,
        providerName: quickService.provider?.company_name || 'Provider',
        price: Number(quickService.price),
        duration: quickService.duration,
        quantity: 1,
        addons: selectedQuickAddons,
        addonsTotal,
      }];
    }
    return cartItems.map((item: any) => {
      const addonTotal = (item.addons || []).reduce((s: number, a: any) => s + Number(a.addon?.price || 0), 0);
      return {
        serviceId: item.service?.id,
        name: item.service?.name,
        providerId: item.service?.provider?.id,
        providerName: item.service?.provider?.company_name || 'Provider',
        price: Number(item.service?.price || 0),
        duration: item.service?.duration || 0,
        quantity: item.quantity || 1,
        addons: item.addons?.map((a: any) => a.addon) || [],
        addonsTotal: addonTotal,
      };
    });
  }, [isQuickBook, quickService, quickAddons, quickBookData, cartItems]);

  const subtotal = lineItems.reduce((sum, item) => sum + (item.price + item.addonsTotal) * item.quantity, 0);
  const platformFee = Math.round(subtotal * 0.05);
  const total = subtotal + platformFee;
  const totalDuration = lineItems.reduce((sum, item) => sum + item.duration * item.quantity, 0);

  const canCheckout = finalAddress && date && time && lineItems.length > 0;

  const handlePlaceOrder = async () => {
    if (!user || !canCheckout) return;
    try {
      // Create a booking for each service/provider
      for (const item of lineItems) {
        for (let q = 0; q < item.quantity; q++) {
          await createBooking.mutateAsync({
            customer_id: user.id,
            service_id: item.serviceId,
            provider_id: item.providerId,
            booking_date: date,
            booking_time: time,
            address: finalAddress,
            notes: notes || undefined,
            amount: item.price + item.addonsTotal,
          });
        }
      }
      // Notification
      await createNotification.mutateAsync({
        user_id: user.id,
        title: 'Booking Confirmed',
        message: `Your booking for ${lineItems.map(i => i.name).join(', ')} on ${date} at ${time} has been placed.`,
        type: 'booking',
      });
      // Clear cart if not quick book
      if (!isQuickBook) {
        await clearCart.mutateAsync(user.id);
      }
      sessionStorage.removeItem('quickBook');
      setConfirmed(true);
      toast.success('Booking placed successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to place booking');
    }
  };

  if (!user) return null;

  if (confirmed) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-2xl p-10 shadow-card border">
          <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Booking Confirmed!</h2>
          <p className="text-muted-foreground mt-2">Your services have been booked successfully.</p>
          <div className="mt-6 space-y-2 text-sm text-left bg-muted rounded-xl p-4">
            <p><span className="text-muted-foreground">Services:</span> <span className="font-medium text-foreground">{lineItems.map(i => i.name).join(', ')}</span></p>
            <p><span className="text-muted-foreground">Date:</span> <span className="font-medium text-foreground">{date}</span></p>
            <p><span className="text-muted-foreground">Time:</span> <span className="font-medium text-foreground">{time}</span></p>
            <p><span className="text-muted-foreground">Total:</span> <span className="font-medium text-primary">₹{total}</span></p>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/my-bookings')}>View Bookings</Button>
            <Button className="flex-1" onClick={() => navigate('/')}>Home</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2"><Skeleton className="h-96 rounded-xl" /></div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Checkout</h1>

      {/* Summary modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowSummary(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-2xl p-6 max-w-md w-full shadow-elevated border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-heading font-bold text-foreground mb-4">Confirm Your Booking</h2>
            <div className="space-y-3 text-sm">
              {lineItems.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                  <span className="text-foreground">₹{(item.price + item.addonsTotal) * item.quantity}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span>₹{platformFee}</span></div>
              <Separator />
              <div className="flex justify-between text-base font-bold"><span className="text-foreground">Total</span><span className="text-primary">₹{total}</span></div>
              <Separator />
              <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{date}</span></div>
              <div><span className="text-muted-foreground">Time:</span> <span className="text-foreground">{time}</span></div>
              <div><span className="text-muted-foreground">Address:</span> <span className="text-foreground">{finalAddress}</span></div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowSummary(false)}>Edit</Button>
              <Button className="flex-1" onClick={handlePlaceOrder} disabled={createBooking.isPending}>
                {createBooking.isPending ? 'Placing...' : 'Confirm & Pay'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left - Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Services summary */}
          <div className="bg-card rounded-xl shadow-card border p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Services</h3>
            <div className="space-y-3">
              {lineItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-foreground">{item.name} {item.quantity > 1 && `x${item.quantity}`}</p>
                    <p className="text-xs text-muted-foreground">{item.providerName} · {item.duration} min</p>
                    {item.addons.length > 0 && (
                      <p className="text-xs text-primary">+ {item.addons.map((a: any) => a.name).join(', ')}</p>
                    )}
                  </div>
                  <span className="font-heading font-semibold text-foreground">₹{(item.price + item.addonsTotal) * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="bg-card rounded-xl shadow-card border p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Service Address</h3>
            {addresses.length > 0 ? (
              <AddressManager
                userId={user.id}
                selectable
                selectedAddressId={selectedAddress?.id}
                onSelect={(a) => { setSelectedAddress(a); setManualAddress(''); }}
              />
            ) : (
              <AddressManager userId={user.id} selectable selectedAddressId={selectedAddress?.id} onSelect={(a) => { setSelectedAddress(a); setManualAddress(''); }} />
            )}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or enter manually</span></div>
            </div>
            <Textarea
              placeholder="Enter your complete address..."
              value={manualAddress}
              onChange={(e) => { setManualAddress(e.target.value); setSelectedAddress(null); }}
              rows={2}
            />
          </div>

          {/* Date & Time */}
          <div className="bg-card rounded-xl shadow-card border p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Date & Time</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Time Slot</label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button key={slot} onClick={() => setTime(slot)} className={`px-3 py-2 rounded-lg text-sm border transition-colors ${time === slot ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground hover:bg-muted'}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Coupon */}
          <div className="bg-card rounded-xl shadow-card border p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Additional Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Special Instructions (Optional)</label>
                <Textarea placeholder="Any special instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Coupon Code</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Enter coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} className="pl-9" />
                  </div>
                  <Button variant="outline">Apply</Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Price summary */}
        <div>
          <div className="bg-card rounded-xl shadow-card border p-6 sticky top-24">
            <h3 className="font-heading font-semibold text-foreground mb-4">Price Breakdown</h3>
            <div className="space-y-2 text-sm">
              {lineItems.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                  <span className="text-foreground">₹{item.price * item.quantity}</span>
                </div>
              ))}
              {lineItems.some(i => i.addonsTotal > 0) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Add-ons</span>
                  <span className="text-foreground">₹{lineItems.reduce((s, i) => s + i.addonsTotal * i.quantity, 0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="text-foreground">₹{platformFee}</span>
              </div>
              {coupon && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-₹0</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-heading font-bold text-primary">₹{total}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Est. Duration</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {totalDuration} min</span>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Payment method */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-foreground mb-2">Payment Method</h4>
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Pay after service</span>
              </div>
            </div>

            <Button className="w-full" size="lg" disabled={!canCheckout} onClick={() => setShowSummary(true)}>
              Review & Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
