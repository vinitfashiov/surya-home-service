import { useSearchParams, Link } from 'react-router-dom';
import { useCategories, useServices } from '@/hooks/useSupabaseData';
import { useCities } from '@/hooks/useCities';
import { useSubcategories } from '@/hooks/useSubcategoriesVariants';
import { useCityStore } from '@/lib/cityStore';
import { Star, Clock, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import FavoriteButton from '@/components/FavoriteButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'duration_low', label: 'Shortest Duration' },
  { value: 'newest', label: 'Newest First' },
];

export default function ServicesPage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  const { selectedCityId } = useCityStore();
  const [selectedCategory, setSelectedCategory] = useState(categoryId || 'all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [minRating, setMinRating] = useState(0);
  const [maxDuration, setMaxDuration] = useState(480);
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data: cities = [] } = useCities();
  const { data: services = [], isLoading } = useServices(selectedCategory);
  const { data: subcategories = [] } = useSubcategories(selectedCategory === 'all' ? undefined : selectedCategory);

  // Reset subcategory when category changes
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubcategory('all');
  };

  // Compute max price for slider
  const maxPrice = useMemo(() => {
    const prices = services.map((s: any) => Number(s.price));
    return prices.length ? Math.max(...prices, 1000) : 50000;
  }, [services]);

  // Filter and sort
  const filteredServices = useMemo(() => {
    let result = [...services];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s: any) =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.provider?.company_name?.toLowerCase().includes(q) ||
        s.category?.name?.toLowerCase().includes(q)
      );
    }

    // City
    if (selectedCity !== 'all') {
      result = result.filter((s: any) => s.city_id === selectedCity);
    }

    // Subcategory
    if (selectedSubcategory !== 'all') {
      result = result.filter((s: any) => s.subcategory_id === selectedSubcategory);
    }

    // Price range
    result = result.filter((s: any) => {
      const p = Number(s.price);
      return p >= priceRange[0] && p <= priceRange[1];
    });

    // Rating
    if (minRating > 0) {
      result = result.filter((s: any) => Number(s.rating || 0) >= minRating);
    }

    // Duration
    if (maxDuration < 480) {
      result = result.filter((s: any) => Number(s.duration) <= maxDuration);
    }

    // Sort
    switch (sortBy) {
      case 'price_low': result.sort((a: any, b: any) => a.price - b.price); break;
      case 'price_high': result.sort((a: any, b: any) => b.price - a.price); break;
      case 'duration_low': result.sort((a: any, b: any) => a.duration - b.duration); break;
      case 'newest': result.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      default: result.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [services, searchQuery, selectedCity, selectedSubcategory, priceRange, minRating, maxDuration, sortBy]);

  const activeFilterCount = [
    selectedCity !== 'all',
    minRating > 0,
    maxDuration < 480,
    priceRange[0] > 0 || priceRange[1] < maxPrice,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setMaxDuration(480);
    setSelectedCity('all');
    setSearchQuery('');
    setSelectedSubcategory('all');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">All Services</h1>
      <p className="text-muted-foreground mt-1">Browse and book professional services near you</p>

      {/* Search bar */}
      <div className="mt-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services, providers, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Advanced filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-xl border shadow-card p-6 mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* City */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">City</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Price Range: ₹{priceRange[0]} – ₹{priceRange[1]}
                </Label>
                <Slider
                  min={0}
                  max={maxPrice}
                  step={100}
                  value={priceRange}
                  onValueChange={(v) => setPriceRange(v as [number, number])}
                  className="mt-3"
                />
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Min Rating: {minRating}★</Label>
                <Slider
                  min={0}
                  max={5}
                  step={0.5}
                  value={[minRating]}
                  onValueChange={([v]) => setMinRating(v)}
                  className="mt-3"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Max Duration: {maxDuration >= 480 ? 'Any' : `${maxDuration} min`}
                </Label>
                <Slider
                  min={15}
                  max={480}
                  step={15}
                  value={[maxDuration]}
                  onValueChange={([v]) => setMaxDuration(v)}
                  className="mt-3"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  Clear all filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-5">
        <Button variant={selectedCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => handleCategoryChange('all')}>All</Button>
        {categories.map((cat: any) => (
          <Button key={cat.id} variant={selectedCategory === cat.id ? 'default' : 'outline'} size="sm" onClick={() => handleCategoryChange(cat.id)} className="whitespace-nowrap">
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Subcategory pills */}
      {subcategories.length > 0 && selectedCategory !== 'all' && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-2">
          <Button variant={selectedSubcategory === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setSelectedSubcategory('all')}>All Sub</Button>
          {subcategories.map((sub) => (
            <Button key={sub.id} variant={selectedSubcategory === sub.id ? 'secondary' : 'ghost'} size="sm" onClick={() => setSelectedSubcategory(sub.id)} className="whitespace-nowrap">
              {sub.name}
            </Button>
          ))}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between mt-4 mb-2">
        <p className="text-sm text-muted-foreground">
          {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
          {searchQuery && <> for "<span className="text-foreground font-medium">{searchQuery}</span>"</>}
        </p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
          {filteredServices.map((service: any, i: number) => (
            <motion.div key={service.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/service/${service.id}`} className="block bg-card rounded-xl shadow-card border overflow-hidden hover:shadow-card-hover transition-shadow group">
                <div className="h-28 bg-gradient-to-br from-primary/10 to-accent/10 relative">
                  {service.image_url && (
                    <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                  )}
                  <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                    {service.category?.name}
                  </Badge>
                  <div className="absolute top-2 right-2 bg-card/90 rounded-full">
                    <FavoriteButton serviceId={service.id} size="sm" />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading font-semibold text-foreground truncate group-hover:text-primary transition-colors">{service.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{service.provider?.company_name}</p>
                    </div>
                    <span className="font-heading font-bold text-primary ml-2 shrink-0">₹{service.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{service.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 text-warning fill-warning" />
                      <span className="font-medium">{service.rating}</span>
                      <span className="text-muted-foreground">({service.review_count})</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {service.duration} min
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filteredServices.length === 0 && (
        <div className="text-center py-20">
          <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">No services found for the selected filters.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>Clear filters</Button>
        </div>
      )}
    </div>
  );
}
