import { useParams, useNavigate } from 'react-router-dom';
import { useService } from '@/hooks/useSupabaseData';
import { useServiceAddons } from '@/hooks/useServiceAddons';
import { useReviewsForProvider } from '@/hooks/useReviews';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAddToCart } from '@/hooks/useCart';
import { useState } from 'react';
import { Star, Clock, ArrowLeft, ShoppingCart, Zap, Check, X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ServiceDetailsPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: service, isLoading } = useService(serviceId);
  const { data: addons = [] } = useServiceAddons(serviceId);
  const addToCart = useAddToCart();
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const providerId = service?.provider?.id;
  const { data: reviews = [] } = useReviewsForProvider(providerId);

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  const addonsTotal = addons
    .filter((a: any) => selectedAddons.includes(a.id))
    .reduce((sum: number, a: any) => sum + Number(a.price), 0);

  const totalPrice = Number(service?.price || 0) + addonsTotal;

  const handleAddToCart = async () => {
    if (!user) { toast.error('Please log in to add to cart.'); navigate('/login?redirect=/service/' + serviceId); return; }
    try {
      await addToCart.mutateAsync({ userId: user.id, serviceId: serviceId!, addonIds: selectedAddons });
      toast.success('Added to cart!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add to cart');
    }
  };

  const handleBookNow = () => {
    if (!user) { navigate('/login?redirect=/service/' + serviceId); return; }
    // Store selected addons in session for checkout
    sessionStorage.setItem('quickBook', JSON.stringify({ serviceId, addonIds: selectedAddons }));
    navigate('/checkout?mode=quick');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-48 rounded-xl mb-6" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Service not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/services')}>Browse Services</Button>
      </div>
    );
  }

  const providerName = service.provider?.company_name || 'Provider';

  const included = [
    'Professional service by trained experts',
    'All necessary equipment included',
    'Service warranty coverage',
    'Post-service cleanup',
  ];
  const notIncluded = [
    'Spare parts or replacement materials',
    'Additional services not listed',
    'Travel charges beyond service area',
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl shadow-card border overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
          {service.image_url ? (
            <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-2">
                <Zap className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <Badge variant="secondary" className="mb-2">{service.category?.name || 'Service'}</Badge>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">{service.name}</h1>
              <p className="text-muted-foreground mt-1">by {providerName}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 text-warning fill-warning" /> {service.rating} ({service.review_count} reviews)</span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> {service.duration} min</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-heading font-bold text-primary">₹{totalPrice}</div>
              {addonsTotal > 0 && <p className="text-xs text-muted-foreground">Base ₹{service.price} + Add-ons ₹{addonsTotal}</p>}
            </div>
          </div>

          {service.description && (
            <div className="mt-6">
              <h3 className="font-heading font-semibold text-foreground mb-2">About this service</h3>
              <p className="text-muted-foreground leading-relaxed">{service.description}</p>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        {/* Left column */}
        <div className="md:col-span-2 space-y-6">
          {/* What's included */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl shadow-card border p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">What's Included</h3>
            <div className="space-y-2">
              {included.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <h4 className="font-heading font-semibold text-foreground mb-3">What's Not Included</h4>
            <div className="space-y-2">
              {notIncluded.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <X className="h-4 w-4 text-destructive flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Add-ons */}
          {addons.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl shadow-card border p-6">
              <h3 className="font-heading font-semibold text-foreground mb-4">Add-Ons & Extras</h3>
              <div className="space-y-3">
                {addons.map((addon: any) => (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                      selectedAddons.includes(addon.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        selectedAddons.includes(addon.id) ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}>
                        {selectedAddons.includes(addon.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{addon.name}</p>
                        {addon.description && <p className="text-xs text-muted-foreground">{addon.description}</p>}
                      </div>
                    </div>
                    <span className="text-sm font-heading font-semibold text-primary">+₹{addon.price}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Reviews */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl shadow-card border p-6">
            <h3 className="font-heading font-semibold text-foreground mb-4">Ratings & Reviews</h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet for this provider.</p>
            ) : (
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review: any) => (
                  <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'text-warning fill-warning' : 'text-muted'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{review.customer?.full_name || 'Customer'}</span>
                    </div>
                    {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right sidebar - Booking CTA */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl shadow-card border p-6 sticky top-24">
            <h3 className="font-heading font-semibold text-foreground mb-4">Book this service</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base price</span>
                <span className="text-foreground font-medium">₹{service.price}</span>
              </div>
              {selectedAddons.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Add-ons ({selectedAddons.length})</span>
                  <span className="text-foreground font-medium">₹{addonsTotal}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-heading font-bold text-primary text-lg">₹{totalPrice}</span>
              </div>
            </div>
            <div className="space-y-3">
              <Button className="w-full" size="lg" onClick={handleBookNow}>
                <Zap className="h-4 w-4 mr-2" /> Book Now
              </Button>
              <Button variant="outline" className="w-full" size="lg" onClick={handleAddToCart} disabled={addToCart.isPending}>
                <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">Free cancellation within 30 mins</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
