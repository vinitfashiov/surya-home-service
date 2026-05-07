import { useParams, useNavigate } from 'react-router-dom';
import { useService } from '@/hooks/useSupabaseData';
import { useServiceVariants } from '@/hooks/useSubcategoriesVariants';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAddToCart } from '@/hooks/useCart';
import { 
  Star, 
  Clock, 
  ArrowLeft, 
  ShoppingCart, 
  Check, 
  Share2
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function ServiceDetailsPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: service, isLoading: serviceLoading } = useService(serviceId);
  const { data: variants = [], isLoading: variantsLoading } = useServiceVariants(serviceId);
  const addToCart = useAddToCart();
  
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const selectedVariant = useMemo(() => 
    variants.find(v => v.id === selectedVariantId), 
    [variants, selectedVariantId]
  );

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please log in to continue');
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    if (variants.length > 0 && !selectedVariantId) {
      toast.error('Please select an option');
      return;
    }

    try {
      await addToCart.mutateAsync({ 
        userId: user.id, 
        serviceId: serviceId!, 
        variantId: selectedVariantId || undefined,
        addonIds: [] 
      });
      toast.success('Added to cart!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add to cart');
    }
  };

  if (serviceLoading || variantsLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Skeleton className="h-[40vh] w-full" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-3/4 rounded-xl" />
          <Skeleton className="h-6 w-1/2 rounded-lg" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!service) return <div className="p-10 text-center font-bold">Service not found</div>;

  const hasVariants = variants.length > 0;
  const displayPrice = selectedVariantId 
    ? selectedVariant?.price 
    : (hasVariants ? 0 : service.price);
  const displayDuration = selectedVariantId ? selectedVariant?.duration : service.duration;

  return (
    <div className="min-h-screen bg-white relative pb-32">
      {/* Visual Header (Full Bleed Image) */}
      <section className="relative h-[45vh] w-full">
        <div className="absolute top-12 left-5 right-5 z-30 flex justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
        
        {service.image_url ? (
          <img 
            src={service.image_url} 
            alt={service.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
      </section>

      {/* Content Card (Overlapping) */}
      <section className="relative -mt-8 bg-white rounded-t-[32px] px-6 pt-8 z-20">
        <div className="flex justify-between items-start mb-1">
          <div className="flex-1">
            <h1 className="text-[22px] font-bold text-[#1F2937] leading-tight mb-1">{service.name}</h1>
            {service.category && (
              <p className="text-[14px] font-bold text-[#1DA653]">{(service.category as any).name}</p>
            )}
          </div>
          <div className="text-right">
            {displayPrice > 0 && (
              <p className="text-[22px] font-bold text-[#1F2937]">₹{displayPrice.toLocaleString('en-IN')}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-[13px] text-gray-500 mb-6">
          <Clock className="w-4 h-4" />
          <span>{displayDuration} min</span>
        </div>

        {/* About Section */}
        <div className="mb-8">
          <h2 className="text-[16px] font-bold text-[#1F2937] mb-3">About this service</h2>
          <p className="text-[14px] text-gray-600 leading-relaxed">
            {service.description || "Expert service delivered at your doorstep with professional quality and care."}
          </p>
        </div>

        {/* Variants Section */}
        {variants.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[16px] font-bold text-[#1F2937] mb-4">Choose your option</h2>
            <div className="space-y-3">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={cn(
                    "w-full text-left p-5 rounded-[20px] border border-[#F1F5F9] transition-all",
                    selectedVariantId === v.id 
                      ? "bg-[#F8FAFC] border-[#E2E8F0]" 
                      : "bg-[#F8FAFC]/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <p className="text-[15px] font-bold text-[#1F2937] mb-1">{v.name}</p>
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{v.duration} hours</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-[16px] font-bold text-[#1F2937]">₹{v.price.toLocaleString('en-IN')}</p>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedVariantId === v.id 
                          ? "border-[#1DA653] bg-white" 
                          : "border-gray-200"
                      )}>
                        {selectedVariantId === v.id && (
                          <div className="w-3.5 h-3.5 bg-[#1DA653] rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Included Items */}
        <div className="mb-10">
          <h2 className="text-[16px] font-bold text-[#1F2937] mb-4">What's included</h2>
          <ul className="space-y-4">
            {getIncludedItems(service.name).map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-0.5 w-6 h-6 bg-[#1DA653] rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
                <span className="text-[14px] text-gray-600 font-medium">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bottom Sticky Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div>
          {displayPrice > 0 ? (
            <p className="text-[20px] font-bold text-[#1F2937]">₹{displayPrice.toLocaleString('en-IN')}</p>
          ) : (
            <p className="text-[20px] font-bold text-[#1F2937]">₹0</p>
          )}
        </div>
        
        <button
          onClick={handleAddToCart}
          disabled={addToCart.isPending || (variants.length > 0 && !selectedVariantId)}
          className={cn(
            "h-[54px] px-10 rounded-[14px] font-bold text-[16px] flex items-center gap-3 transition-all active:scale-95",
            variants.length > 0 && !selectedVariantId
              ? "bg-[#1DA653]/40 text-white cursor-not-allowed"
              : "bg-[#1DA653] text-white shadow-[0_4px_12px_rgba(29,166,83,0.2)]"
          )}
        >
          <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />
          {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

function getIncludedItems(name: string): string[] {
  const lower = (name || '').toLowerCase();
  if (lower.includes('car')) {
    return [
      'Well-maintained vehicle with AC',
      'Experienced and courteous driver',
      'Flexible pick-up and drop timing'
    ];
  }
  return [
    'Professional service by verified provider',
    'Quality assured with premium materials',
    'Timely delivery and setup'
  ];
}
