import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
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
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please log in first');
      navigate('/login');
      onOpenChange(false);
      return;
    }
    if (!serviceId) return;
    try {
      await addToCart.mutateAsync({ userId: user.id, serviceId, addonIds: [] });
      toast.success('Added to cart!');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add');
    }
  };

  const formatDuration = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins}m`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto px-5 pb-8 pt-4">
        {/* Drag handle */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {service && (
          <SheetHeader className="text-left mb-4">
            <div className="flex items-center gap-3">
              {service.image_url && (
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-base font-bold text-[#1F2937] leading-tight">
                  {service.name}
                </SheetTitle>
                <SheetDescription className="text-xs text-[#718096] mt-0.5 line-clamp-1">
                  Starting from ₹{service.price?.toLocaleString('en-IN')}
                </SheetDescription>
              </div>
              {service.rating > 0 && (
                <div className="flex items-center gap-1 bg-[#1DA653] text-white px-2 py-1 rounded-lg flex-shrink-0">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs font-bold">{service.rating}</span>
                </div>
              )}
            </div>
          </SheetHeader>
        )}

        {/* Variants list */}
        <div className="space-y-2.5">
          <h4 className="text-sm font-bold text-[#1F2937]">
            {variants.length > 0 ? 'Choose a variant' : 'Service options'}
          </h4>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : variants.length > 0 ? (
            variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(selectedVariant === v.id ? null : v.id)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  selectedVariant === v.id
                    ? 'border-[#1DA653] bg-[#1DA653]/5'
                    : 'border-gray-100 bg-[#F8FAFC] hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-bold text-[#1F2937] leading-tight">{v.name}</p>
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
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-sm font-black text-[#1F2937]">₹{v.price.toLocaleString('en-IN')}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedVariant === v.id
                        ? 'border-[#1DA653] bg-[#1DA653]'
                        : 'border-gray-300'
                    }`}>
                      {selectedVariant === v.id && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#1F2937]">{service?.name}</p>
                  <p className="text-[11px] text-[#718096] mt-0.5">{service?.description?.slice(0, 80)}...</p>
                </div>
                <span className="text-sm font-black text-[#1F2937]">₹{service?.price?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => { onOpenChange(false); navigate(`/service/${serviceId}`); }}
            className="flex-1 h-12 rounded-2xl border-2 border-[#1DA653] text-[#1DA653] font-bold text-sm hover:bg-[#1DA653]/5 transition-colors"
          >
            View Details
          </button>
          <button
            onClick={handleAddToCart}
            disabled={addToCart.isPending}
            className="flex-1 h-12 rounded-2xl bg-[#1DA653] text-white font-bold text-sm hover:bg-[#178F48] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
