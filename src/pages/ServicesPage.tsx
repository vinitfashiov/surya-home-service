import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCategories, useServices } from '@/hooks/useSupabaseData';
import { useSubcategories } from '@/hooks/useSubcategoriesVariants';
import { useCityStore } from '@/lib/cityStore';
import { Search, SlidersHorizontal, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import AppHeader from '@/components/v2/AppHeader';
import ServiceCardApp from '@/components/v2/ServiceCardApp';
import VariantSheet from '@/components/v2/VariantSheet';
import { cn } from '@/lib/utils';

export default function ServicesPage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  const { selectedCityId, selectedCityName } = useCityStore();
  
  const [selectedCategory, setSelectedCategory] = useState(categoryId || 'all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sheetServiceId, setSheetServiceId] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  // Fetch ALL services for the city (unfiltered by category) to know which categories have services
  const { data: allCityServices = [] } = useServices(undefined, selectedCityId);
  const { data: services = [], isLoading } = useServices(selectedCategory === 'all' ? undefined : selectedCategory, selectedCityId);
  const { data: subcategories = [] } = useSubcategories(selectedCategory === 'all' ? undefined : selectedCategory);

  // Only show categories that have at least one service in this city, deduplicated by name
  const availableCategories = useMemo(() => {
    const categoryIdsWithServices = new Set(allCityServices.map((s: any) => s.category_id));
    const seen = new Set<string>();
    return categories.filter((cat: any) => {
      if (!categoryIdsWithServices.has(cat.id)) return false;
      const lowerName = cat.name.toLowerCase();
      if (seen.has(lowerName)) return false;
      seen.add(lowerName);
      return true;
    });
  }, [categories, allCityServices]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubcategory('all');
  };

  const filteredServices = useMemo(() => {
    let result = [...services];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s: any) =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.provider?.company_name?.toLowerCase().includes(q)
      );
    }
    if (selectedSubcategory !== 'all') {
      result = result.filter((s: any) => s.subcategory_id === selectedSubcategory);
    }
    return result;
  }, [services, searchQuery, selectedSubcategory]);

  return (
    <div className="min-h-screen bg-white relative pb-32 overflow-x-hidden">
      <AppHeader />

      <main className="px-4 sm:px-6 lg:px-8 py-6 relative z-10 max-w-5xl mx-auto">
        <div className="flex flex-col gap-6">
          
          {/* Page Title & Back */}
          <div className="flex items-center gap-3">
             <button 
               onClick={() => window.history.back()}
               className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
             >
               <ArrowLeft className="h-5 w-5 text-[#1F2937]" />
             </button>
             <h1 className="text-[22px] font-black text-[#1F2937]">All services</h1>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#718096] group-focus-within:text-[#1DA653] transition-colors" />
              <Input
                placeholder="Search for any service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-[#F7F8F9] border-none rounded-xl focus-visible:ring-1 focus-visible:ring-[#1DA653] transition-all text-sm font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200"
                >
                  <X className="h-3 w-3 text-[#718096]" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-11 w-11 p-0 border-[#E2E8F0] rounded-xl transition-all shadow-sm active:scale-95",
                showFilters && "bg-[#1DA653] border-[#1DA653] text-white"
              )}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            <button
              onClick={() => handleCategoryChange('all')}
              className={cn(
                "px-5 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all border",
                selectedCategory === 'all' 
                  ? "bg-[#24423A] border-[#24423A] text-white shadow-md shadow-[#24423A]/20" 
                  : "bg-white border-[#E2E8F0] text-[#718096] hover:border-[#CBD5E0]"
              )}
            >
              All
            </button>
            {availableCategories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={cn(
                  "px-5 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all border",
                  selectedCategory === cat.id 
                    ? "bg-[#24423A] border-[#24423A] text-white shadow-md shadow-[#24423A]/20" 
                    : "bg-white border-[#E2E8F0] text-[#718096] hover:border-[#CBD5E0]"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Subcategories (if any) */}
          <AnimatePresence>
            {subcategories.length > 0 && selectedCategory !== 'all' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide"
              >
                <button
                  onClick={() => setSelectedSubcategory('all')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[12px] font-bold border transition-all",
                    selectedSubcategory === 'all'
                      ? "bg-[#1DA653]/10 border-[#1DA653] text-[#1DA653]"
                      : "bg-[#F7F8F9] border-transparent text-[#718096]"
                  )}
                >
                  All
                </button>
                {subcategories.map((sub: any) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubcategory(sub.id)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[12px] font-bold border transition-all",
                      selectedSubcategory === sub.id
                        ? "bg-[#1DA653]/10 border-[#1DA653] text-[#1DA653]"
                        : "bg-[#F7F8F9] border-transparent text-[#718096]"
                    )}
                  >
                    {sub.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Info */}
          <div className="flex items-center justify-between text-[#718096] text-[12px] font-extrabold uppercase tracking-wider">
             <span>{filteredServices.length} Results</span>
             <span className="text-[#1DA653]">Best matches</span>
          </div>

          {/* Services Grid */}
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-full aspect-square bg-[#F7F8F9] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-6">
              {filteredServices.map((service: any) => (
                <ServiceCardApp
                  key={service.id}
                  id={service.id}
                  name={service.name}
                  imageUrl={service.image_url}
                  startingPrice={service.starting_price}
                  onAddClick={(id) => setSheetServiceId(id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-[#F7F8F9] rounded-3xl border border-dashed border-[#E2E8F0]">
              <p className="text-[#718096] font-extrabold text-[15px] mb-2 uppercase tracking-tight">No matching services</p>
              <p className="text-[#718096]/60 text-[12px] font-medium max-w-[200px] mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSubcategory('all');
                  setSelectedCategory('all');
                }}
                className="mt-6 text-[#1DA653] font-bold text-sm underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </main>

      <VariantSheet
        serviceId={sheetServiceId}
        open={!!sheetServiceId}
        onOpenChange={(open) => { if (!open) setSheetServiceId(null); }}
      />
    </div>
  );
}
