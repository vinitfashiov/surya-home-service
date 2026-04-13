import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCategories, useServices } from '@/hooks/useSupabaseData';
import { useBanners } from '@/hooks/useBanners';
import { useCityStore } from '@/lib/cityStore';
import { ChevronRight, Search } from 'lucide-react';
import AppHeader from '@/components/v2/AppHeader';
import ServiceCardApp from '@/components/v2/ServiceCardApp';
import VariantSheet from '@/components/v2/VariantSheet';

const categoryIcons: Record<string, string> = {
  camera: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=100&q=80',
  decoration: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=100&q=80',
  'dj service': 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=100&q=80',
  'makeup service': 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=100&q=80',
  vehicle: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=100&q=80',
  'home cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=100&q=80',
  plumbing: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=100&q=80',
  electrical: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=100&q=80',
  'ac & appliance repair': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=100&q=80',
  'salon at home': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&q=80',
};

export default function HomePage() {
  const { selectedCityId, selectedCityName } = useCityStore();
  const { data: categories = [] } = useCategories();
  const { data: allServices = [], isLoading: svcLoading } = useServices(undefined, selectedCityId);
  const { data: banners = [] } = useBanners();
  const [sheetServiceId, setSheetServiceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const map = new Map<string, { category: any; services: any[] }>();
    for (const svc of allServices) {
      const catId = svc.category_id;
      if (!map.has(catId)) {
        map.set(catId, { category: (svc as any).category, services: [] });
      }
      map.get(catId)!.services.push(svc);
    }
    return Array.from(map.values()).filter(g => g.category);
  }, [allServices]);

  // Available categories (ones that have services)
  const availableCategories = useMemo(() => {
    const catIdsWithServices = new Set(allServices.map((s: any) => s.category_id));
    const seen = new Set<string>();
    return categories.filter((cat: any) => {
      if (!catIdsWithServices.has(cat.id)) return false;
      const key = cat.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categories, allServices]);

  // Top rated services
  const topRated = useMemo(() =>
    [...allServices].sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0)).slice(0, 6),
    [allServices]
  );

  return (
    <div className="min-h-screen bg-white relative pb-32 overflow-x-hidden">
      <AppHeader />

      <main className="px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-7 relative z-10 max-w-5xl mx-auto">

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A0AEC0] group-focus-within:text-[#1DA653] transition-colors" />
          <input
            type="text"
            placeholder="Search for services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-[#F7F8F9] rounded-xl border-none text-sm font-medium text-[#1F2937] placeholder:text-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#1DA653]/30"
          />
          {searchQuery && (
            <Link
              to={`/services?q=${encodeURIComponent(searchQuery)}`}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1DA653] text-xs font-bold"
            >
              Search
            </Link>
          )}
        </div>

        {/* Dynamic Banners */}
        {banners.length > 0 && (
          <section>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
              {banners.map((banner: any) => (
                <div
                  key={banner.id}
                  className="min-w-[85%] sm:min-w-[60%] snap-start bg-gradient-to-r from-[#1DA653] to-[#15803d] rounded-2xl p-5 flex-shrink-0 relative overflow-hidden"
                >
                  <h3 className="text-white font-bold text-base leading-tight mb-1">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-white/80 text-xs font-medium mb-3">{banner.subtitle}</p>
                  )}
                  {banner.link_url && (
                    <Link to={banner.link_url} className="inline-block bg-white text-[#1DA653] text-xs font-bold px-4 py-1.5 rounded-lg">
                      Explore
                    </Link>
                  )}
                  {banner.image_url && (
                    <img src={banner.image_url} alt="" className="absolute right-2 bottom-0 h-20 object-contain opacity-90" />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Fallback banner if no DB banners */}
        {banners.length === 0 && (
          <section>
            <div className="bg-[#FFF9F2] rounded-2xl p-4 flex items-stretch justify-between relative overflow-hidden border border-black/5 shadow-[0_2px_15px_rgba(0,0,0,0.03)] h-[120px]">
              <div className="z-10 flex flex-col items-start justify-between py-1 w-[60%]">
                <div>
                  <h3 className="text-[14px] font-extrabold text-[#1F2937] leading-[1.1] mb-1">Book wedding services online</h3>
                  <p className="text-[9px] text-[#718096] font-semibold leading-relaxed pr-2">Camera, Decoration, DJ, Makeup & Vehicles — all in one place!</p>
                </div>
                <Link to="/services" className="bg-[#24423A] hover:bg-[#1C332D] text-white rounded-[10px] px-4 py-2 mt-auto text-[10px] font-bold transition-colors">
                  Browse all
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Category Icons Row */}
        {availableCategories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-black text-[#1F2937]">Categories</h2>
              <Link to="/services" className="text-[#1DA653] text-xs font-bold flex items-center gap-0.5">
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
              {availableCategories.map((cat: any) => (
                <Link
                  key={cat.id}
                  to={`/services?category=${cat.id}`}
                  className="flex flex-col items-center gap-1.5 min-w-[64px] group"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#F7F8F9] overflow-hidden border border-gray-100 group-hover:border-[#1DA653]/30 transition-colors">
                    <img
                      src={cat.image_url || categoryIcons[cat.name.toLowerCase()] || ''}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-[#4A5568] text-center leading-tight line-clamp-2 max-w-[64px]">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Top Rated Section */}
        {topRated.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-black text-[#1F2937]">Top Rated</h2>
              <Link to="/services" className="text-[#1DA653] text-xs font-bold flex items-center gap-0.5">
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-5">
              {topRated.map((service: any) => (
                <ServiceCardApp
                  key={service.id}
                  id={service.id}
                  name={service.name}
                  imageUrl={service.image_url}
                  price={service.price}
                  rating={service.rating}
                  onAddClick={(id) => setSheetServiceId(id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Category-wise Sections */}
        {servicesByCategory.map(({ category, services }) => (
          <section key={category.id}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-black text-[#1F2937]">{category.name}</h2>
              <Link to={`/services?category=${category.id}`} className="text-[#1DA653] text-xs font-bold flex items-center gap-0.5">
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-5">
              {services.slice(0, 6).map((service: any) => (
                <ServiceCardApp
                  key={service.id}
                  id={service.id}
                  name={service.name}
                  imageUrl={service.image_url}
                  price={service.price}
                  rating={service.rating}
                  onAddClick={(id) => setSheetServiceId(id)}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Loading state */}
        {svcLoading && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full aspect-square bg-[#F7F8F9] rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!svcLoading && allServices.length === 0 && (
          <div className="bg-gray-50 rounded-3xl p-10 text-center border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-medium mb-4">No services available in {selectedCityName || 'your area'} yet.</p>
          </div>
        )}

        {/* See all services button */}
        {allServices.length > 0 && (
          <div className="flex justify-center">
            <Link
              to="/services"
              className="inline-flex items-center justify-center bg-white border border-gray-200 text-[#1DA653] font-bold text-[13px] px-8 py-3 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              See all services
            </Link>
          </div>
        )}
      </main>

      {/* Variant Bottom Sheet */}
      <VariantSheet
        serviceId={sheetServiceId}
        open={!!sheetServiceId}
        onOpenChange={(open) => { if (!open) setSheetServiceId(null); }}
      />
    </div>
  );
}
