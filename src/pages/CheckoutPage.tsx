import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCart, useClearCart } from '@/hooks/useCart';
import { useService, useCreateBooking } from '@/hooks/useSupabaseData';
import { useServiceAddons } from '@/hooks/useServiceAddons';
import { useMyAddresses } from '@/hooks/useAddresses';
import { useCreateNotification } from '@/hooks/useNotifications';
import { useAvailableTimeSlots, ALL_SLOTS } from '@/hooks/useAvailableTimeSlots';
import { useValidateCoupon, CouponResult } from '@/hooks/useCoupons';
import { useCategoryCheckoutFields, useSaveBookingCustomFields } from '@/hooks/useCheckoutFields';
import { usePricingRulesForServices, calculateDynamicPrice } from '@/hooks/usePricingRules';
import { loadRazorpayScript, createRazorpayOrder, verifyRazorpayPayment, openRazorpayCheckout } from '@/lib/razorpay';
import AddressManager from '@/components/AddressManager';
import DynamicCheckoutFields from '@/components/DynamicCheckoutFields';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, CheckCircle, Clock, CreditCard, Tag, Loader2, AlertCircle, TrendingUp, Shield } from 'lucide-react';
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
  const validateCoupon = useValidateCoupon();
  const saveCustomFields = useSaveBookingCustomFields();

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
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [processingPayment, setProcessingPayment] = useState(false);

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
        categoryId: quickService.category_id,
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
        categoryId: item.service?.category_id,
        price: Number(item.service?.price || 0),
        duration: item.service?.duration || 0,
        quantity: item.quantity || 1,
        addons: item.addons?.map((a: any) => a.addon) || [],
        addonsTotal: addonTotal,
      };
    });
  }, [isQuickBook, quickService, quickAddons, quickBookData, cartItems]);

  // Get unique category IDs for dynamic checkout fields
  const categoryIds = useMemo(() =>
    [...new Set(lineItems.map(i => i.categoryId).filter(Boolean))],
    [lineItems]
  );

  const { data: checkoutFields = [] } = useCategoryCheckoutFields(categoryIds);

  // Fetch pricing rules for all services in the checkout
  const serviceIds = useMemo(() => lineItems.map(i => i.serviceId).filter(Boolean), [lineItems]);
  const { data: allPricingRules = [] } = usePricingRulesForServices(serviceIds);

  // Dynamic pricing: compute price per line item using pricing rules + custom field values
  const pricedItems = useMemo(() => {
    return lineItems.map(item => {
      const itemRules = allPricingRules.filter(r => r.service_id === item.serviceId && r.is_active);
      const { total: dynamicPrice, breakdown } = calculateDynamicPrice(
        item.price,
        itemRules,
        customFieldValues,
        checkoutFields,
      );
      return {
        ...item,
        dynamicPrice,
        priceBreakdown: breakdown,
        hasDynamicPricing: itemRules.length > 0,
      };
    });
  }, [lineItems, allPricingRules, customFieldValues, checkoutFields]);

  const subtotal = pricedItems.reduce((sum, item) => sum + (item.dynamicPrice + item.addonsTotal) * item.quantity, 0);
  const platformFee = Math.round(subtotal * 0.05);
  const discount = couponResult?.valid ? couponResult.discountAmount : 0;
  const total = Math.max(0, subtotal + platformFee - discount);
  const totalDuration = pricedItems.reduce((sum, item) => sum + item.duration * item.quantity, 0);

  // Real-time time slot availability
  const providerIds = useMemo(() => 
    [...new Set(lineItems.map(i => i.providerId).filter(Boolean))],
    [lineItems]
  );

  const { data: availableSlots = ALL_SLOTS, isLoading: slotsLoading } = useAvailableTimeSlots({
    date,
    providerIds,
    duration: totalDuration,
  });

  // Reset time if selected slot becomes unavailable
  useEffect(() => {
    if (time && !availableSlots.includes(time)) {
      setTime('');
    }
  }, [availableSlots, time]);

  // Reset coupon when subtotal changes
  useEffect(() => {
    if (couponResult?.valid) {
      setCouponResult(null);
      setCouponCode('');
    }
  }, [subtotal]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const result = await validateCoupon.mutateAsync({ code: couponCode, orderTotal: subtotal + platformFee });
    setCouponResult(result);
    if (result.valid) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponResult(null);
    setCouponCode('');
  };

  // Validate custom fields
  const requiredFieldsMissing = checkoutFields
    .filter(f => f.is_required)
    .some(f => !customFieldValues[f.id]?.trim());

  const canCheckout = finalAddress && date && time && lineItems.length > 0 && !requiredFieldsMissing;

  const handlePlaceOrder = async () => {
    if (!user || !canCheckout) return;
    setProcessingPayment(true);
    try {
      // 1. Create all bookings first
      const bookingIds: string[] = [];
      for (const item of lineItems) {
        for (let q = 0; q < item.quantity; q++) {
          const pricedItem = pricedItems.find(p => p.serviceId === item.serviceId);
          const bookingAmount = (pricedItem?.dynamicPrice ?? item.price) + item.addonsTotal;
          const booking = await createBooking.mutateAsync({
            customer_id: user.id,
            service_id: item.serviceId,
            provider_id: item.providerId,
            booking_date: date,
            booking_time: time,
            address: finalAddress,
            notes: notes || undefined,
            amount: bookingAmount,
          });
          bookingIds.push(booking.id);
        }
      }

      // 2. Save custom field values
      if (checkoutFields.length > 0 && bookingIds.length > 0) {
        const customFieldRows = bookingIds.flatMap(bookingId =>
          checkoutFields
            .filter(f => customFieldValues[f.id]?.trim())
            .map(f => ({
              booking_id: bookingId,
              field_id: f.id,
              field_value: customFieldValues[f.id],
            }))
        );
        if (customFieldRows.length > 0) {
          await saveCustomFields.mutateAsync(customFieldRows);
        }
      }

      // 3. Handle payment
      if (paymentMethod === 'online' && total > 0) {
        await loadRazorpayScript();
        const order = await createRazorpayOrder({
          amount: total,
          bookingIds,
          receipt: `rcpt_${bookingIds[0]}`,
        });

        openRazorpayCheckout({
          orderId: order.order_id,
          amount: order.amount,
          currency: order.currency,
          keyId: order.key_id,
          userName: user.user_metadata?.full_name,
          userEmail: user.email,
          description: `Payment for ${lineItems.map(i => i.name).join(', ')}`,
          onSuccess: async (response) => {
            try {
              const result = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_ids: bookingIds,
              });
              if (result.verified) {
                await createNotification.mutateAsync({
                  user_id: user.id,
                  title: 'Payment Successful',
                  message: `Payment of ₹${total} received for ${lineItems.map(i => i.name).join(', ')}.`,
                  type: 'payment',
                });
                if (!isQuickBook) await clearCart.mutateAsync(user.id);
                sessionStorage.removeItem('quickBook');
                setConfirmed(true);
                toast.success('Payment successful! Booking confirmed.');
              } else {
                toast.error('Payment verification failed. Contact support.');
              }
            } catch (err: any) {
              toast.error(err.message || 'Payment verification error');
            }
            setProcessingPayment(false);
          },
          onFailure: (error) => {
            toast.error(error?.description || 'Payment failed or cancelled');
            setProcessingPayment(false);
          },
        });
        return; // Don't set processingPayment=false here, callbacks handle it
      }

      // COD flow
      await createNotification.mutateAsync({
        user_id: user.id,
        title: 'Booking Confirmed',
        message: `Your booking for ${lineItems.map(i => i.name).join(', ')} on ${date} at ${time} has been placed. Pay after service.`,
        type: 'booking',
      });
      if (!isQuickBook) await clearCart.mutateAsync(user.id);
      sessionStorage.removeItem('quickBook');
      setConfirmed(true);
      toast.success('Booking placed successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to place booking');
    }
    setProcessingPayment(false);
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
              {pricedItems.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                  <span className="text-foreground">₹{(item.dynamicPrice + item.addonsTotal) * item.quantity}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span>₹{platformFee}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-success"><span>Discount</span><span>-₹{discount}</span></div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold"><span className="text-foreground">Total</span><span className="text-primary">₹{total}</span></div>
              <Separator />
              <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{date}</span></div>
              <div><span className="text-muted-foreground">Time:</span> <span className="text-foreground">{time}</span></div>
              <div><span className="text-muted-foreground">Address:</span> <span className="text-foreground">{finalAddress}</span></div>
              {checkoutFields.filter(f => customFieldValues[f.id]?.trim()).length > 0 && (
                <>
                  <Separator />
                  {checkoutFields.filter(f => customFieldValues[f.id]?.trim()).map(f => (
                    <div key={f.id}>
                      <span className="text-muted-foreground">{f.field_label}:</span>{' '}
                      <span className="text-foreground">{customFieldValues[f.id]}</span>
                    </div>
                  ))}
                </>
              )}
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
              {pricedItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-foreground">{item.name} {item.quantity > 1 && `x${item.quantity}`}</p>
                    <p className="text-xs text-muted-foreground">{item.providerName} · {item.duration} min</p>
                    {item.addons.length > 0 && (
                      <p className="text-xs text-primary">+ {item.addons.map((a: any) => a.name).join(', ')}</p>
                    )}
                    {item.hasDynamicPricing && (
                      <div className="mt-1 space-y-0.5">
                        {item.priceBreakdown.map((b, j) => (
                          <p key={j} className="text-xs text-accent flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> {b.label}: ₹{Math.round(b.amount)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="font-heading font-semibold text-foreground">₹{Math.round((item.dynamicPrice + item.addonsTotal) * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic checkout fields */}
          {checkoutFields.length > 0 && (
            <DynamicCheckoutFields
              fields={checkoutFields}
              values={customFieldValues}
              onChange={(fieldId, value) => setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }))}
            />
          )}

          {/* Address */}
          <div className="bg-card rounded-xl shadow-card border p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Service Address</h3>
            <AddressManager
              userId={user.id}
              selectable
              selectedAddressId={selectedAddress?.id}
              onSelect={(a) => { setSelectedAddress(a); setManualAddress(''); }}
            />
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
                {slotsLoading && date ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking availability...
                  </div>
                ) : !date ? (
                  <p className="text-sm text-muted-foreground py-2">Select a date first to see available slots</p>
                ) : availableSlots.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-destructive py-3">
                    <AlertCircle className="h-4 w-4" /> No slots available on this date. Please try another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {ALL_SLOTS.map((slot) => {
                      const isAvailable = availableSlots.includes(slot);
                      return (
                        <button
                          key={slot}
                          onClick={() => isAvailable && setTime(slot)}
                          disabled={!isAvailable}
                          className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                            time === slot
                              ? 'bg-primary text-primary-foreground border-primary'
                              : isAvailable
                                ? 'bg-card text-foreground hover:bg-muted'
                                : 'bg-muted/50 text-muted-foreground/50 border-transparent cursor-not-allowed line-through'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
                {date && availableSlots.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {availableSlots.length} of {ALL_SLOTS.length} slots available · Updates in real-time
                  </p>
                )}
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
                {couponResult?.valid ? (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-success/30 bg-success/5">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-success" />
                      <div>
                        <p className="text-sm font-medium text-success">{couponCode.toUpperCase()} applied</p>
                        <p className="text-xs text-muted-foreground">You save ₹{couponResult.discountAmount}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="text-destructive hover:text-destructive">
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="pl-9"
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={validateCoupon.isPending || !couponCode.trim()}
                    >
                      {validateCoupon.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                )}
                {couponResult && !couponResult.valid && (
                  <p className="text-xs text-destructive mt-1">{couponResult.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right - Price summary */}
        <div>
          <div className="bg-card rounded-xl shadow-card border p-6 sticky top-24">
            <h3 className="font-heading font-semibold text-foreground mb-4">Price Breakdown</h3>
            <div className="space-y-2 text-sm">
              {pricedItems.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                    <span className="text-foreground">₹{Math.round(item.dynamicPrice * item.quantity)}</span>
                  </div>
                  {item.hasDynamicPricing && item.priceBreakdown.map((b, j) => (
                    <div key={j} className="flex justify-between text-xs pl-3">
                      <span className="text-muted-foreground/70">{b.label}</span>
                      <span className="text-muted-foreground">₹{Math.round(b.amount)}</span>
                    </div>
                  ))}
                </div>
              ))}
              {pricedItems.some(i => i.addonsTotal > 0) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Add-ons</span>
                  <span className="text-foreground">₹{pricedItems.reduce((s, i) => s + i.addonsTotal * i.quantity, 0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee (5%)</span>
                <span className="text-foreground">₹{platformFee}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Coupon Discount</span>
                  <span>-₹{discount}</span>
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

            {requiredFieldsMissing && (
              <p className="text-xs text-destructive mb-3">Please fill all required fields marked with *</p>
            )}

            <Button className="w-full" size="lg" disabled={!canCheckout} onClick={() => setShowSummary(true)}>
              Review & Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
