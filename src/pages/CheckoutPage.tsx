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
import GoogleMapsProvider from '@/components/maps/GoogleMapsProvider';
import LocationPicker from '@/components/maps/LocationPicker';
import { useCheckServiceability } from '@/hooks/useZones';
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
  const [mapLocation, setMapLocation] = useState<{lat: number, lng: number, address: string, pincode?: string, state?: string} | null>(null);

  const checkServiceability = useCheckServiceability();
  const finalAddress = mapLocation?.address || selectedAddress?.address_line || manualAddress;

  // Determine if current location is serviceable
  const isLocationServiceable = useMemo(() => {
    if (mapLocation) {
      return checkServiceability(mapLocation.lat, mapLocation.lng, mapLocation.pincode, mapLocation.state);
    }
    if (selectedAddress?.latitude && selectedAddress?.longitude) {
      return checkServiceability(
        Number(selectedAddress.latitude),
        Number(selectedAddress.longitude),
        selectedAddress.pincode,
        selectedAddress.city?.state
      );
    }
    // Manual address can't be validated against zones
    return null; // unknown
  }, [mapLocation, selectedAddress, checkServiceability]);

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
      const itemPrice = Number(item.variant?.price || item.service?.price || 0);
      return {
        serviceId: item.service?.id,
        variantId: item.variant?.id,
        name: item.service?.name,
        variantName: item.variant?.name,
        providerId: item.service?.provider?.id,
        providerName: item.service?.provider?.company_name || 'Provider',
        categoryId: item.service?.category_id,
        price: itemPrice,
        duration: item.variant?.duration || item.service?.duration || 0,
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

  const canCheckout = finalAddress && date && time && lineItems.length > 0 && !requiredFieldsMissing && isLocationServiceable !== false;

  const handlePlaceOrder = async () => {
    if (!user || !canCheckout) return;
    setProcessingPayment(true);
    try {
      // 1. Create all bookings first
      const bookingIds: string[] = [];
      for (const item of lineItems) {
        for (let q = 0; q < item.quantity; q++) {
          const pricedItem = pricedItems.find(p => p.serviceId === item.serviceId && p.variantId === item.variantId);
          const bookingAmount = (pricedItem?.dynamicPrice ?? item.price) + item.addonsTotal;
          const latitude = mapLocation?.lat || (selectedAddress?.latitude ? Number(selectedAddress.latitude) : null);
          const longitude = mapLocation?.lng || (selectedAddress?.longitude ? Number(selectedAddress.longitude) : null);

          const booking = await createBooking.mutateAsync({
            customer_id: user.id,
            service_id: item.serviceId,
            variant_id: item.variantId,
            provider_id: item.providerId,
            booking_date: date,
            booking_time: time,
            address: finalAddress,
            notes: notes || undefined,
            amount: bookingAmount,
            latitude,
            longitude,
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
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="bg-white rounded-[2.5rem] p-10 shadow-soft border border-black/5 text-center max-w-sm w-full"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-[#10B981]/10 flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-[#10B981]" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-2">Booking Confirmed!</h2>
          <p className="text-sm text-gray-400 font-medium leading-relaxed">Your services have been booked successfully. Our professional will arrive shortly.</p>
          
          <div className="mt-8 space-y-3 text-sm text-left bg-gray-50 rounded-2xl p-6 border border-black/5">
            <div className="flex justify-between">
               <span className="text-gray-400 font-medium">Services</span>
               <span className="text-gray-800 font-black text-right line-clamp-1 ml-4">{lineItems.map(i => i.name).join(', ')}</span>
            </div>
            <div className="flex justify-between">
               <span className="text-gray-400 font-medium">Date & Time</span>
               <span className="text-gray-800 font-black">{date}, {time}</span>
            </div>
            <div className="flex justify-between">
               <span className="text-gray-400 font-medium">Total Paid</span>
               <span className="text-primary font-black">₹{total}</span>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <Button 
               className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20" 
               onClick={() => navigate('/')}
            >
              Done
            </Button>
            <Button 
               variant="ghost" 
               className="w-full h-14 rounded-2xl text-gray-400 font-bold hover:text-gray-800" 
               onClick={() => navigate('/my-bookings')}
            >
              View Bookings
            </Button>
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
    <div className="min-h-screen bg-[#F9FAFB] pb-40">
      {/* Header */}
      <header className="bg-white px-6 pt-10 pb-6 sticky top-0 z-50 border-b border-gray-100 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-black text-gray-800">Checkout</h1>
      </header>

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
              <Button className="flex-1" onClick={handlePlaceOrder} disabled={createBooking.isPending || processingPayment}>
                {processingPayment ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</> : paymentMethod === 'online' ? 'Pay Now' : 'Confirm & Book'}
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
                    {item.variantName && (
                      <p className="text-[10px] font-bold text-[#1DA653] uppercase tracking-wider">{item.variantName}</p>
                    )}
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
            
            {/* Map-based location picker */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-3">📍 Pick your exact location on the map to check serviceability</p>
              <GoogleMapsProvider>
                <LocationPicker
                  initialLocation={mapLocation ? { lat: mapLocation.lat, lng: mapLocation.lng } : undefined}
                  onLocationSelect={(loc) => {
                    const isServiceable = checkServiceability(loc.lat, loc.lng, loc.pincode, loc.state);
                    setMapLocation({ lat: loc.lat, lng: loc.lng, address: loc.address, pincode: loc.pincode, state: loc.state });
                    setSelectedAddress(null);
                    setManualAddress('');
                    if (!isServiceable) {
                      toast.error('Sorry, this location is not in our service area. Please try a different address.');
                    } else {
                      toast.success('Great! This location is serviceable.');
                    }
                  }}
                />
              </GoogleMapsProvider>
              {mapLocation && isLocationServiceable === true && (
                <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-success/10 border border-success/20 text-sm text-success">
                  <CheckCircle className="h-4 w-4" />
                  ✓ This location is in our service area
                </div>
              )}
              {mapLocation && isLocationServiceable === false && (
                <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  This location is outside our service area. Please select a different location.
                </div>
              )}
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or select saved address</span></div>
            </div>

            <AddressManager
              userId={user.id}
              selectable
              selectedAddressId={selectedAddress?.id}
              onSelect={(a) => {
                setSelectedAddress(a);
                setManualAddress('');
                setMapLocation(null);
                // Validate saved address if it has coordinates
                if (a.latitude && a.longitude) {
                  const serviceable = checkServiceability(Number(a.latitude), Number(a.longitude), a.pincode, a.city?.state);
                  if (!serviceable) {
                    toast.error('This saved address is outside our service area.');
                  }
                }
              }}
            />

            {selectedAddress && isLocationServiceable === false && (
              <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                This saved address is outside our service area. Please use the map to pick a serviceable location.
              </div>
            )}
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
              <div className="space-y-2">
                <button
                  onClick={() => setPaymentMethod('online')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-primary' : 'border-muted-foreground'}`}>
                    {paymentMethod === 'online' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div className="text-left">
                    <span className="text-sm font-medium text-foreground">Pay Online</span>
                    <p className="text-xs text-muted-foreground">UPI, Card, Net Banking via Razorpay</p>
                  </div>
                  <Shield className="h-3.5 w-3.5 text-success ml-auto" />
                </button>
                <button
                  onClick={() => setPaymentMethod('cod')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-primary' : 'border-muted-foreground'}`}>
                    {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div className="text-left">
                    <span className="text-sm font-medium text-foreground">Pay After Service</span>
                    <p className="text-xs text-muted-foreground">Cash on delivery</p>
                  </div>
                </button>
              </div>
            </div>

            {requiredFieldsMissing && (
              <p className="text-xs text-destructive mb-3">Please fill all required fields marked with *</p>
            )}

            <Button className="w-full" size="lg" disabled={!canCheckout || processingPayment} onClick={() => setShowSummary(true)}>
              {paymentMethod === 'online' ? 'Review & Pay Online' : 'Review & Confirm'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
