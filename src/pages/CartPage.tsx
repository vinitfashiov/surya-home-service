import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCart, useUpdateCartQuantity, useRemoveFromCart } from '@/hooks/useCart';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: cartItems = [], isLoading } = useCart(user?.id);
  const updateQuantity = useUpdateCartQuantity();
  const removeItem = useRemoveFromCart();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-heading font-bold text-foreground">Please log in</h2>
        <p className="text-muted-foreground mt-1">Sign in to view your cart</p>
        <Button className="mt-4" onClick={() => navigate('/login?redirect=/cart')}>Sign In</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-8 w-48 mb-6" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl mb-3" />)}
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum: number, item: any) => {
    const addonTotal = (item.addons || []).reduce((s: number, a: any) => s + Number(a.addon?.price || 0), 0);
    return sum + (Number(item.service?.price || 0) + addonTotal) * (item.quantity || 1);
  }, 0);

  const totalDuration = cartItems.reduce((sum: number, item: any) => sum + (item.service?.duration || 0) * (item.quantity || 1), 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-heading font-bold text-foreground">Your Cart</h1>
        <span className="text-sm text-muted-foreground">({cartItems.length} items)</span>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl shadow-card border">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-heading font-semibold text-foreground">Your cart is empty</h3>
          <p className="text-sm text-muted-foreground mt-1">Browse services and add them to your cart</p>
          <Button className="mt-4" onClick={() => navigate('/services')}>Browse Services</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Cart items */}
          <div className="md:col-span-2 space-y-3">
            {cartItems.map((item: any, i: number) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl shadow-card border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-heading font-semibold text-foreground">{item.service?.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.service?.provider?.company_name}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.service?.duration} min</span>
                    </div>
                    {/* Addons */}
                    {item.addons?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.addons.map((a: any) => (
                          <span key={a.id} className="inline-block bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                            +{a.addon?.name} (₹{a.addon?.price})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-primary">₹{Number(item.service?.price || 0) * item.quantity}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity - 1 })}
                        className="w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-muted"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
                        className="w-7 h-7 rounded-lg border flex items-center justify-center hover:bg-muted"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeItem.mutate(item.id)}
                        className="w-7 h-7 rounded-lg border flex items-center justify-center text-destructive hover:bg-destructive/10 ml-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div className="bg-card rounded-xl shadow-card border p-6 sticky top-24">
              <h3 className="font-heading font-semibold text-foreground mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Duration</span>
                  <span className="text-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {totalDuration} min</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-heading font-bold text-primary">₹{subtotal}</span>
                </div>
              </div>
              <Button className="w-full mt-6" size="lg" onClick={() => navigate('/checkout')}>
                Proceed to Checkout
              </Button>
              <Button variant="ghost" className="w-full mt-2" size="sm" onClick={() => navigate('/services')}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
