import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '@/hooks/useSupabaseData';
import { useCityStore } from '@/lib/cityStore';
import AppHeader from '@/components/v2/AppHeader';
import ServiceCardApp from '@/components/v2/ServiceCardApp';
import VariantSheet from '@/components/v2/VariantSheet';

export default function HomePage() {
  const { selectedCityId, selectedCityName } = useCityStore();
  const { data: services = [], isLoading: svcLoading } = useServices(undefined, selectedCityId);
  const [sheetServiceId, setSheetServiceId] = useState<string | null>(null);

  const mainServices = services.slice(0, 12);

  return (
    <div className="min-h-screen bg-white relative pb-32 overflow-x-hidden">
      <AppHeader />

      <main className="px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8 relative z-10 max-w-5xl mx-auto">
        {/* Exclusive Bundle */}
        <section>
          <h2 className="text-[17px] font-black text-[#1F2937] mb-3.5">Exclusive bundle</h2>
          <div className="bg-[#FFF9F2] rounded-2xl p-4 flex items-stretch justify-between relative overflow-hidden border border-black/5 shadow-[0_2px_15px_rgba(0,0,0,0.03)] h-[130px]">
             <div className="z-10 flex flex-col items-start justify-between py-1 w-[55%]">
               <div>
                 <h3 className="text-[15px] font-extrabold text-[#1F2937] leading-[1.1] mb-1">Daily essential cleaning bundle</h3>
                 <p className="text-[9px] text-[#718096] font-semibold leading-relaxed pr-2">Sweeping, mopping and utensils with a single booking!</p>
               </div>
               <button className="bg-[#24423A] hover:bg-[#1C332D] text-white rounded-[10px] px-4 py-2 mt-auto text-[10px] font-bold transition-colors">
                 Know more
               </button>
             </div>
             <div className="absolute right-0 top-0 bottom-0 w-[50%] h-full flex items-end justify-end">
                <img
                  src="/cleaning_bundle.png"
                  alt="Cleaning bundle"
                  className="h-full object-contain object-bottom mix-blend-multiply"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=800&q=80";
                    e.currentTarget.className = "h-full w-full object-cover rounded-r-2xl";
                  }}
                />
             </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="relative z-10 bg-white">
          <h2 className="text-[17px] font-black text-[#1F2937] mb-4">All services</h2>

          {svcLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-full aspect-square bg-[#F7F8F9] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : mainServices.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
              {mainServices.map((service: any, index: number) => (
                <ServiceCardApp
                  key={service.id}
                  id={service.id}
                  name={service.name}
                  imageUrl={service.image_url}
                  price={service.price}
                  tag={index === 4 ? '₹30 OFF' : undefined}
                  onAddClick={(id) => setSheetServiceId(id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-3xl p-10 text-center border-2 border-dashed border-gray-100">
               <p className="text-gray-400 font-medium mb-4">No services available in {selectedCityName || 'your area'} yet.</p>
               <button
                 onClick={() => window.location.reload()}
                 className="text-[#1DA653] font-bold text-sm underline"
               >
                 Change City
               </button>
            </div>
          )}

          {services.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Link
                to="/services"
                className="inline-flex items-center justify-center bg-white border border-gray-200 text-[#1DA653] font-bold text-[13px] px-8 py-3 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                See all services
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* Variant Bottom Sheet */}
      <VariantSheet
        serviceId={sheetServiceId}
        open={!!sheetServiceId}
        onOpenChange={(open) => { if (!open) setSheetServiceId(null); }}
      />

      {/* Decorative Bottom Bubbles */}
      <div className="fixed bottom-0 left-0 right-0 h-40 bg-[#1DA653] z-0 opacity-10 pointer-events-none rounded-t-[100%]" style={{ transform: 'translateY(40%) scale(1.5)' }}></div>
      <div className="fixed bottom-0 left-0 right-0 h-40 bg-[#1DA653] z-0 opacity-20 pointer-events-none rounded-t-[100%]" style={{ transform: 'translateY(60%) scale(1.8)' }}></div>
    </div>
  );
}
