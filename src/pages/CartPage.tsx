import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCart, useUpdateCartQuantity, useRemoveFromCart } from '@/hooks/useCart';
import { useCityStore } from '@/lib/cityStore';
import { ArrowLeft, ChevronRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useState } from 'react';
import BookingTypeTabs, { BookingType } from '@/components/v2/BookingTypeTabs';
import QuantityStepper from '@/components/v2/QuantityStepper';

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { selectedCityName } = useCityStore();
  const { data: cartItems = [], isLoading } = useCart(user?.id);
  const updateQuantity = useUpdateCartQuantity();
  const [bookingType, setBookingType] = useState<BookingType>('Instant');

  const subtotal = cartItems.reduce((sum: number, item: any) => {
    const itemPrice = Number(item.variant?.price || item.service?.price || 0);
    const addonTotal = (item.addons || []).reduce((s: number, a: any) => s + Number(a.addon?.price || 0), 0);
    return sum + (itemPrice + addonTotal) * (item.quantity || 1);
  }, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-white p-10 text-center flex flex-col items-center justify-center">
        <h2 className="text-[17px] font-black text-gray-800">Please log in</h2>
        <Button className="mt-4 rounded-xl px-10 h-12 bg-[#1DA653] font-bold" onClick={() => navigate('/login?redirect=/cart')}>Sign In</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative pb-32 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white px-5 pt-12 pb-4 sticky top-0 z-50 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center text-gray-700">
          <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={2.5} />
        </button>
        <h1 className="text-[17px] font-black text-[#1F2937]">My cart</h1>
      </header>

      <main className="px-5 py-2 flex flex-col gap-6 relative z-10 bg-white">
        {/* Booking Type Switcher */}
        <BookingTypeTabs activeType={bookingType} onChange={setBookingType} />

        {/* Review Booking Section */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
             <h2 className="text-[15px] font-extrabold text-[#1F2937]">Review booking</h2>
             <span className="text-[10px] text-gray-400 font-bold">{cartItems.length} services</span>
          </div>

          <div className="bg-white rounded-[1.25rem] p-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100">
            {cartItems.length === 0 ? (
              <div className="text-center py-6">
                 <p className="text-gray-400 font-medium text-sm">Your cart is empty</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {cartItems.map((item: any, idx: number) => {
                  const itemPrice = Number(item.variant?.price || item.service?.price || 0);
                  return (
                    <div key={item.id} className={`flex items-center justify-between ${idx !== cartItems.length - 1 ? 'border-b border-gray-50 pb-4' : ''}`}>
                       <div className="flex items-center gap-3.5 w-1/2">
                          <div className="w-12 h-12 rounded-[10px] bg-[#F7F8F9] shrink-0 p-1 border border-black/5">
                             <img 
                               src={item.service?.image_url || 'https://via.placeholder.com/150'} 
                               alt={item.service?.name} 
                               className="w-full h-full object-contain mix-blend-multiply"
                             />
                          </div>
                          <div>
                            <h4 className="text-[12px] font-extrabold text-[#1F2937] leading-tight pr-2">{item.service?.name}</h4>
                            {item.variant && (
                              <p className="text-[10px] text-[#1DA653] font-bold mt-0.5">{item.variant.name}</p>
                            )}
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-4">
                         <div className="flex flex-col items-end pt-1">
                            {itemPrice > 0 && (
                               <span className="text-[9px] text-[#A0AEC0] font-bold line-through tracking-wide">₹{Math.round(itemPrice * 1.3)}</span>
                            )}
                            <span className="text-[15px] font-black text-[#1F2937]">₹{itemPrice}</span>
                         </div>

                         <QuantityStepper 
                           quantity={item.quantity} 
                           label={item.service?.name.split(' ')[0].toLowerCase() + 's'}
                           onIncrease={() => updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
                           onDecrease={() => updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })}
                         />
                       </div>
                    </div>
                  );
                })}
              </div>
            )}

            {cartItems.length > 0 && (
              <div className="mt-5 text-center">
                 <button 
                  onClick={() => navigate('/services')}
                  className="text-[11px] font-bold text-[#718096]"
                 >
                   Missed something? <span className="text-[#1DA653]">Add more services.</span>
                 </button>
              </div>
            )}
          </div>
        </section>

        {/* Coupons */}
        <section className="bg-white rounded-[1.25rem] p-4.5 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-between cursor-pointer py-5">
           <span className="text-[14px] font-bold text-[#1F2937]">View all coupons</span>
           <ChevronRight className="h-[20px] w-[20px] text-gray-400" />
        </section>

        {/* Booking Details / Location */}
        <section>
           <h2 className="text-[15px] font-extrabold text-[#1F2937] mb-3 px-1">Booking details</h2>
           <div className="bg-white rounded-[1.25rem] p-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3.5">
                 <div className="w-[38px] h-[38px] rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                    <MapPin className="h-[18px] w-[18px]" strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-extrabold text-[#1F2937]">Location</span>
                    <span className="text-[10px] text-[#718096] font-semibold truncate max-w-[200px]">
                      {selectedCityName || 'Select a location'} B124, Sector 55, Gurugram, Haryana...
                    </span>
                 </div>
              </div>
              <ChevronRight className="h-[20px] w-[20px] text-gray-400" />
           </div>
        </section>
      </main>

      {/* Decorative Bottom Bubbles/Background */}
      <div className="fixed bottom-0 left-0 right-0 h-[220px] bg-[#1DA653] z-0 opacity-10 pointer-events-none rounded-t-[100%]" style={{ transform: 'translateY(30%) scale(1.5)' }}></div>
      <div className="fixed bottom-0 left-0 right-0 h-[220px] bg-[#1DA653] z-0 opacity-20 pointer-events-none rounded-t-[100%]" style={{ transform: 'translateY(50%) scale(1.8)' }}></div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-5 z-50">
         <motion.div 
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="container mx-auto"
         >
           <Button 
              className="w-full h-[52px] rounded-2xl bg-[#1DA653] hover:bg-[#199448] text-white text-[15px] font-black flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(29,166,83,0.3)] transition-all active:scale-[0.98] border-none"
              onClick={() => navigate('/checkout')}
              disabled={cartItems.length === 0}
           >
              <span>Pay now</span>
              <span>·</span>
              <span>₹{subtotal}</span>
           </Button>
         </motion.div>
      </div>
    </div>
  );
}
