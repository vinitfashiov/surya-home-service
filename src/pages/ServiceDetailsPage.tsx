import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useService } from '@/hooks/useSupabaseData';
import { useServiceVariants } from '@/hooks/useSubcategoriesVariants';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAddToCart } from '@/hooks/useCart';
import { ArrowLeft, Share2, Star, Clock, ShoppingCart, Check, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function ServiceDetailsPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: service, isLoading } = useService(serviceId);
  const { data: variants = [], isLoading: variantsLoading } = useServiceVariants(serviceId);
  const addToCart = useAddToCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please log in to add to cart.');
      navigate('/login?redirect=/service/' + serviceId);
      return;
    }
    try {
      await addToCart.mutateAsync({ userId: user.id, serviceId: serviceId!, addonIds: [] });
      toast.success('Added to cart!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add to cart');
    }
  };

  const formatDuration = (mins: number) => {
    if (!mins) return '';
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}min` : `${h} hours`;
    }
    return `${mins} min`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Skeleton className="h-[40vh] w-full" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!service) return <div className="p-20 text-center text-gray-400">Service not found.</div>;

  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  const displayPrice = selectedVariant ? selectedVariant.price : service.price;
  const displayDuration = selectedVariant ? selectedVariant.duration : service.duration;

  return (
    <div className="min-h-screen bg-white relative pb-28 overflow-x-hidden">
      {/* Hero Image */}
      <section className="relative h-[38vh] sm:h-[45vh] bg-gray-100">
        <img
          src={service.image_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80'}
          alt={service.name}
          className="w-full h-full object-cover"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        {/* Top nav buttons */}
        <div className="absolute top-12 left-0 right-0 px-4 flex justify-between z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors">
            <Share2 className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </button>
        </div>

        {/* Rating badge on image */}
        {service.rating > 0 && (
          <div className="absolute bottom-8 left-5 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg">
            <Star className="w-4 h-4 text-[#FF9800] fill-current" />
            <span className="text-sm font-bold text-[#1F2937]">{service.rating}</span>
            {service.review_count > 0 && (
              <span className="text-xs text-[#718096]">({service.review_count} reviews)</span>
            )}
          </div>
        )}
      </section>

      {/* Main Content */}
      <section className="relative -mt-5 bg-white rounded-t-3xl z-20 shadow-[0_-8px_20px_rgba(0,0,0,0.06)]">
        <div className="px-5 pt-6 pb-4 max-w-3xl mx-auto">

          {/* Title + Price */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="text-xl font-black text-[#1F2937] leading-tight">{service.name}</h1>
              {service.category && (
                <p className="text-xs text-[#1DA653] font-semibold mt-1">{(service.category as any).name}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-black text-[#1F2937]">₹{displayPrice?.toLocaleString('en-IN')}</p>
              {service.price !== displayPrice && (
                <p className="text-xs text-[#A0AEC0] line-through">₹{service.price?.toLocaleString('en-IN')}</p>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 mb-5">
            {displayDuration > 0 && (
              <div className="flex items-center gap-1.5 text-[#718096]">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{formatDuration(displayDuration)}</span>
              </div>
            )}
            {service.tax_rate > 0 && (
              <span className="text-[10px] text-[#A0AEC0] font-medium bg-gray-50 px-2 py-0.5 rounded">
                +{service.tax_rate}% tax
              </span>
            )}
          </div>

          {/* Description */}
          {service.description && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[#1F2937] mb-2">About this service</h3>
              <p className="text-[13px] text-[#4A5568] leading-relaxed">{service.description}</p>
            </div>
          )}

          {/* Variants Section */}
          {!variantsLoading && variants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[#1F2937] mb-3">Choose your option</h3>
              <div className="space-y-2.5">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantId(selectedVariantId === v.id ? null : v.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      selectedVariantId === v.id
                        ? 'border-[#1DA653] bg-[#1DA653]/5 shadow-sm'
                        : 'border-gray-100 bg-[#F8FAFC] hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-[13px] font-bold text-[#1F2937] leading-tight">{v.name}</p>
                        {v.description && (
                          <p className="text-[11px] text-[#718096] mt-0.5 line-clamp-2">{v.description}</p>
                        )}
                        {v.duration > 0 && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Clock className="w-3 h-3 text-[#A0AEC0]" />
                            <span className="text-[10px] text-[#A0AEC0] font-medium">{formatDuration(v.duration)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-[#1F2937]">₹{v.price.toLocaleString('en-IN')}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedVariantId === v.id
                            ? 'border-[#1DA653] bg-[#1DA653]'
                            : 'border-gray-300'
                        }`}>
                          {selectedVariantId === v.id && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {variantsLoading && (
            <div className="space-y-3 mb-6">
              <Skeleton className="h-5 w-40" />
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          )}

          {/* What's Included */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[#1F2937] mb-3">What's included</h3>
            <ul className="space-y-3">
              {getIncludedItems(service.name, service.description).map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-[18px] h-[18px] flex-shrink-0 bg-[#1DA653] rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-[12px] text-[#4A5568] font-medium leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Provider Info */}
          {service.provider && (
            <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#A0AEC0] font-medium uppercase tracking-wider">Provided by</p>
                  <p className="text-sm font-bold text-[#1F2937] mt-0.5">{(service.provider as any).company_name}</p>
                  {(service.provider as any).is_verified && (
                    <div className="flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3 text-[#1DA653]" />
                      <span className="text-[10px] text-[#1DA653] font-semibold">Verified Provider</span>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-[#CBD5E0]" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="px-5 py-3 flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <p className="text-lg font-black text-[#1F2937]">₹{displayPrice?.toLocaleString('en-IN')}</p>
            {selectedVariant && (
              <p className="text-[10px] text-[#718096] font-medium">{selectedVariant.name}</p>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={addToCart.isPending}
            className="h-12 px-8 rounded-2xl bg-[#1DA653] text-white font-bold text-sm hover:bg-[#178F48] transition-colors flex items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            <ShoppingCart className="w-4 h-4" />
            {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getIncludedItems(name: string, description?: string): string[] {
  const lower = (name || '').toLowerCase();

  if (lower.includes('photo') || lower.includes('candid') || lower.includes('wide angle')) {
    return [
      'Professional DSLR photographer for full event coverage',
      'High-resolution edited digital photos',
      'Online gallery delivery within 7 days',
      'Print-ready album-quality images',
    ];
  }
  if (lower.includes('video') || lower.includes('cinematic')) {
    return [
      'Professional videographer with HD/4K equipment',
      'Full event video coverage with editing',
      'Background music and highlight reel',
      'Digital delivery within 10 days',
    ];
  }
  if (lower.includes('drone')) {
    return [
      'Licensed drone operator with 4K camera',
      'Aerial shots of venue, baraat, and ceremony',
      'Edited aerial highlight video',
      'Bird-eye view photography of entire event',
    ];
  }
  if (lower.includes('pre wedding')) {
    return [
      'Professional photographer + videographer team',
      'Indoor & outdoor shoot at scenic locations',
      'Edited photos and cinematic video',
      'Props, styling guidance, and creative concepts',
    ];
  }
  if (lower.includes('mandap') || lower.includes('stage')) {
    return [
      'Fresh flower arrangements and drapes',
      'LED and decorative lighting setup',
      'Setup and teardown handled by our team',
      'Multiple theme options available',
    ];
  }
  if (lower.includes('car decoration') || lower.includes('dulha car deco')) {
    return [
      'Fresh flowers, ribbons, and LED lights',
      'Custom theme decoration as per choice',
      'Complete setup before event time',
      'Premium materials and finishing',
    ];
  }
  if (lower.includes('bed') || lower.includes('gate') || lower.includes('party')) {
    return [
      'Premium decoration materials and flowers',
      'Professional setup by experienced decorators',
      'Customizable themes and color schemes',
      'Complete setup and teardown service',
    ];
  }
  if (lower.includes('dj')) {
    return [
      'Professional DJ with sound system',
      'LED lighting and fog effects',
      'Song requests and custom playlist',
      'Setup and sound check included',
    ];
  }
  if (lower.includes('bhangra')) {
    return [
      'Professional Bhangra dance group (5-10 dancers)',
      'Colorful traditional costumes and dhol',
      'High-energy performance for baraat',
      'Coordination with band and DJ',
    ];
  }
  if (lower.includes('band')) {
    return [
      'Full band with brass instruments and dhol',
      'LED lighting setup for procession',
      'Experienced musicians for wedding songs',
      'Baraat route coordination and management',
    ];
  }
  if (lower.includes('makeup') || lower.includes('bridal')) {
    return [
      'Professional makeup artist with premium products',
      'Custom look based on your preference',
      'Hair styling included',
      'Touch-up kit for the event',
    ];
  }
  if (lower.includes('mehndi')) {
    return [
      'Professional mehndi artist',
      'Arabic, Rajasthani, and Traditional designs',
      'Natural chemical-free mehndi',
      'Both full-hand bridal and guest mehndi',
    ];
  }
  if (lower.includes('car') || lower.includes('cab') || lower.includes('bus') || lower.includes('vehicle')) {
    return [
      'Well-maintained vehicle with AC',
      'Experienced and courteous driver',
      'Flexible pick-up and drop timing',
      'Fuel charges as per actuals',
    ];
  }

  // Fallback from description
  if (description) {
    return description.split('.').filter(s => s.trim().length > 10).slice(0, 4).map(s => s.trim());
  }

  return [
    'Professional service by verified provider',
    'Quality assured with premium materials',
    'Timely delivery and setup',
    'Customer support throughout the process',
  ];
}
