import { useState, useEffect } from 'react';
import { useAds, useTrackAd } from '@/hooks/useAds';
import { useCityStore } from '@/lib/cityStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface PromotionalCarouselProps {
  categoryId?: string;
}

export default function PromotionalCarousel({ categoryId }: PromotionalCarouselProps) {
  const { selectedCityId } = useCityStore();
  const { data: ads = [], isLoading } = useAds(selectedCityId, categoryId);
  const { trackImpression, trackClick } = useTrackAd();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [ads.length]);

  // Track impression when current index changes
  useEffect(() => {
    if (ads.length > 0 && ads[currentIndex]) {
      trackImpression.mutate(ads[currentIndex].id);
    }
  }, [currentIndex, ads, trackImpression]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % ads.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-[200px] w-full rounded-2xl" />
      </div>
    );
  }

  if (ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <section className="py-8 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="relative group">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAd.id}
              initial={{ opacity: 0, scale: 0.98, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.98, x: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative rounded-3xl overflow-hidden border bg-card shadow-xl min-h-[220px] md:min-h-[260px] flex flex-col md:flex-row"
            >
              {/* Ad content side */}
              <div className="flex-1 p-8 md:p-12 flex flex-col justify-center z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    <Megaphone className="h-3 w-3" /> Sponsored
                  </div>
                  {currentAd.provider_company_name && (
                    <span className="text-xs text-muted-foreground font-medium">by {currentAd.provider_company_name}</span>
                  )}
                </div>
                
                <h2 className="text-2xl md:text-4xl font-heading font-extrabold text-foreground mb-3 leading-tight">
                  {currentAd.name}
                </h2>
                
                <p className="text-muted-foreground text-sm md:text-lg mb-8 max-w-md line-clamp-2 md:line-clamp-none">
                  {currentAd.description}
                </p>
                
                <div className="flex items-center gap-4">
                  {currentAd.target_url ? (
                    <Link 
                      to={currentAd.target_url} 
                      onClick={() => trackClick.mutate(currentAd.id)}
                    >
                      <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                        Get Offer <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/services" onClick={() => trackClick.mutate(currentAd.id)}>
                      <Button 
                        size="lg" 
                        className="rounded-full px-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                      >
                        Book Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              
              {/* Ad image side */}
              <div className="md:w-2/5 relative min-h-[150px] md:min-h-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent z-10 md:bg-gradient-to-l" />
                {currentAd.image_url ? (
                  <img 
                    src={currentAd.image_url} 
                    alt={currentAd.name} 
                    className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full gradient-primary opacity-20" />
                )}
              </div>
              
              {/* Background decorative elements */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
            </motion.div>
          </AnimatePresence>

          {/* Navigation controls */}
          {ads.length > 1 && (
            <>
              <button 
                onClick={handlePrev} 
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/60 backdrop-blur border border-white/10 flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-card shadow-lg"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                onClick={handleNext} 
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/60 backdrop-blur border border-white/10 flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-card shadow-lg"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              
              <div className="absolute bottom-6 left-12 z-20 flex gap-2">
                {ads.map((_: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
