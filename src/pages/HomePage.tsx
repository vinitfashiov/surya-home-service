import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, ArrowRight, Scissors, Zap, Droplets, SprayCan, Wrench, Paintbrush, Bug, Hammer, Clock, Shield, ChevronRight, ChevronLeft, MapPin, TrendingUp, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories, useServices } from '@/hooks/useSupabaseData';
import { useCities } from '@/hooks/useCities';
import { useBanners } from '@/hooks/useBanners';
import { useCityStore } from '@/lib/cityStore';
import FavoriteButton from '@/components/FavoriteButton';
import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const iconMap: Record<string, React.ElementType> = {
  Scissors, Zap, Droplets, SprayCan, Wrench, Paintbrush, Bug, Hammer,
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { selectedCityId, selectedCityName } = useCityStore();
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: services = [], isLoading: svcLoading } = useServices(undefined, selectedCityId);
  const { data: cities = [] } = useCities();
  const { data: banners = [] } = useBanners();
  const [bannerIdx, setBannerIdx] = useState(0);
  const topServices = services.slice(0, 8);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const filteredCategories = categories;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-12 md:py-20 lg:py-28">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-2xl mx-auto text-center"
          >
            <Badge variant="secondary" className="mb-4 text-xs font-medium px-3 py-1">
              <TrendingUp className="h-3 w-3 mr-1" /> Trusted by 10,000+ customers
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-heading font-extrabold text-foreground leading-tight">
              Home services,{' '}
              <span className="text-primary relative">
                delivered.
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M1 5.5Q50 1 100 5t99 -1" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
                </svg>
              </span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto">
              Book trusted professionals for salon, repairs, cleaning and more — at your doorstep.
            </p>
            <div className="mt-8 flex gap-2 max-w-md mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for a service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 h-12 bg-card"
                />
              </div>
              <Button size="lg" className="h-12 px-6" onClick={handleSearch}>Search</Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" /> Verified Pros</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" /> On-time</span>
              <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" /> 4.8★ Avg</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Promotional Banners Carousel */}
      {banners.length > 0 && (
        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary/10 to-accent/10 border">
              <AnimatePresence mode="wait">
                <motion.div
                  key={bannerIdx}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.4 }}
                  className="p-8 md:p-12 flex items-center justify-between min-h-[140px]"
                >
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground">
                      {banners[bannerIdx]?.title}
                    </h3>
                    {banners[bannerIdx]?.subtitle && (
                      <p className="text-muted-foreground mt-1">{banners[bannerIdx].subtitle}</p>
                    )}
                    {banners[bannerIdx]?.link_url && (
                      <Link to={banners[bannerIdx].link_url}>
                        <Button size="sm" className="mt-4">
                          Learn More <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                  {banners[bannerIdx]?.image_url && (
                    <img
                      src={banners[bannerIdx].image_url}
                      alt={banners[bannerIdx].title}
                      className="hidden md:block w-40 h-28 object-cover rounded-xl ml-6"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
              {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {banners.map((_: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setBannerIdx(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === bannerIdx ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* City indicator */}
      {selectedCityName && (
        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 bg-primary/5 rounded-xl px-4 py-3 border border-primary/10">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">Showing services in <span className="font-semibold text-primary">{selectedCityName}</span></span>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground">Browse Categories</h2>
              <p className="text-muted-foreground mt-1">Find the right service for your needs</p>
            </div>
            <Link to="/services" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {catLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : filteredCategories.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No categories yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredCategories.map((cat: any, i: number) => {
                const Icon = iconMap[cat.icon] || Wrench;
                return (
                  <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.4 }}>
                    <Link
                      to={`/services?category=${cat.id}`}
                      className="block bg-card rounded-xl p-5 shadow-card border hover:shadow-card-hover transition-all group hover:-translate-y-0.5"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-heading font-semibold text-foreground">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description}</p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Featured Services Carousel */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground">Popular Services</h2>
              <p className="text-muted-foreground mt-1">Top-rated services from verified providers</p>
            </div>
            <Link to="/services" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {svcLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : topServices.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No services available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {topServices.map((service: any, i: number) => (
                <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                  <Link to={`/service/${service.id}`} className="block bg-card rounded-xl shadow-card border overflow-hidden hover:shadow-card-hover transition-all hover:-translate-y-0.5 group">
                    <div className="h-28 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative overflow-hidden">
                      {service.image_url ? (
                        <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl opacity-20">🔧</span>
                      )}
                      <Badge className="absolute top-2 left-2 bg-card/90 text-foreground border-0 text-xs">
                        <Clock className="h-3 w-3 mr-1" />{service.duration}m
                      </Badge>
                      <div className="absolute top-2 right-2 bg-card/90 rounded-full">
                        <FavoriteButton serviceId={service.id} size="sm" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading font-semibold text-foreground text-sm line-clamp-1 flex items-center gap-1">
                        {service.name}
                        {service.provider?.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-primary fill-primary/20 shrink-0" />}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{service.provider?.company_name}</p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="font-heading font-bold text-primary">₹{service.price}</p>
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                          <span className="font-medium text-foreground">{service.rating || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-heading font-bold text-foreground text-center mb-10">How ServisGo Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: '1', title: 'Choose a Service', desc: 'Browse categories and pick what you need.' },
              { step: '2', title: 'Book a Slot', desc: 'Select a convenient date, time, and address.' },
              { step: '3', title: 'Get it Done', desc: 'A verified professional arrives at your doorstep.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-heading font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="font-heading font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-2xl p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary-foreground/5 -translate-y-1/2 translate-x-1/2" />
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground relative">Are you a service provider?</h2>
            <p className="text-primary-foreground/80 mt-3 max-w-md mx-auto relative">Join thousands of professionals and grow your business with ServisGo.</p>
            <div className="mt-8 flex gap-3 justify-center relative">
              <Link to="/provider-signup">
                <Button size="lg" variant="secondary" className="font-semibold">
                  Register as Provider <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-xs">SG</span>
              </div>
              <span className="font-heading font-bold text-foreground">ServisGo</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 ServisGo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
