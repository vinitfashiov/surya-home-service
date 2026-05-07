import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useServiceVariants } from '@/hooks/useSubcategoriesVariants';
import { useService } from '@/hooks/useSupabaseData';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAddToCart } from '@/hooks/useCart';
import { Clock, Star, Check, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface VariantSheetProps {
  serviceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VariantSheet({ serviceId, open, onOpenChange }: VariantSheetProps) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: service } = useService(serviceId || undefined);
  const { data: variants = [], isLoading } = useServiceVariants(serviceId || undefined);
  const addToCart = useAddToCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please log in first');
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      onOpenChange(false);
      return;
    }
    if (!serviceId) return;
    try {
      await addToCart.mutateAsync({ 
        userId: user.id, 
        serviceId, 
        variantId: selectedVariantId || undefined,
        addonIds: [] 
      });
      toast.success('Added to cart!');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add');
    }
  };

  const selectedVariant = variants.find(v => v.id === selectedVariantId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto px-5 pb-6">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="text-xl font-black text-[#1F2937]">{service?.name}</SheetTitle>
          <div className="flex items-center gap-4 text-xs font-medium text-[#718096]">
            {service?.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-[#1F2937] font-bold">{service.rating}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Starting from ₹{service?.starting_price?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          {variants.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-2">Select Option</p>
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantId(selectedVariantId === v.id ? null : v.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    selectedVariantId === v.id
                      ? 'border-[#1DA653] bg-[#1DA653]/5'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-[#1F2937] text-sm">{v.name}</p>
                      <p className="text-[10px] text-[#718096] mt-0.5">{v.duration} min duration</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-[#1F2937] text-sm">₹{v.price.toLocaleString('en-IN')}</p>
                      {selectedVariantId === v.id && <Check className="w-4 h-4 text-[#1DA653]" strokeWidth={3} />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleAddToCart}
            disabled={addToCart.isPending || (variants.length > 0 && !selectedVariantId)}
            className="w-full h-12 rounded-2xl bg-[#1DA653] text-white font-bold text-sm hover:bg-[#178F48] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale active:scale-[0.98]"
          >
            <ShoppingCart className="w-4 h-4" />
            {addToCart.isPending ? 'Adding...' : (variants.length > 0 && !selectedVariantId) ? 'Pick Option' : 'Add to Cart'}
          </button>
          <button 
            onClick={() => { onOpenChange(false); navigate(`/service/${serviceId}`); }}
            className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            View Full Details
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
