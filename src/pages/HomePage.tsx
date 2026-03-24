import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, ArrowRight, Scissors, Zap, Droplets, SprayCan, Wrench, Paintbrush, Bug, Hammer, Clock, ShieldCheck, MapPin, ChevronRight, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories, useServices } from '@/hooks/useSupabaseData';
import { useCities } from '@/hooks/useCities';
import { useBanners } from '@/hooks/useBanners';
import { useCityStore } from '@/lib/cityStore';
import FavoriteButton from '@/components/FavoriteButton';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import PromotionalCarousel from '@/components/PromotionalCarousel';

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

  // Auto-rotate static banners
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

  const filteredCategories = categories.slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      {/* Enterprise Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-background">
        {/* Very subtle background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-4xl mx-auto"
          >
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-xs md:text-sm border-primary/20 text-primary bg-primary/5 rounded-full font-medium">
              <TrendingUp className="h-3.5 w-3.5 mr-2" /> India's Premium Service Network
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-extrabold text-foreground tracking-tight leading-[1.1] mb-6">
              Expert home services, <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">
                delivered seamlessly.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              Book verified, top-tier professionals for specialized repairs, aesthetic grooming, and premium deep cleaning.
            </p>
            
            {/* Search Bar Container */}
            <div className="max-w-2xl mx-auto bg-card p-2 flex items-center gap-2 rounded-2xl shadow-elevated border transition-all focus-within:ring-2 focus-within:ring-primary/20">
              <div className="pl-4">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                placeholder="What do you need help with today?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="border-0 focus-visible:ring-0 shadow-none text-base h-12 bg-transparent w-full"
              />
              <Button size="lg" className="rounded-xl px-8 h-12 text-sm font-semibold shrink-0" onClick={handleSearch}>
                Search
              </Button>
            </div>
            
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-2 transition-colors hover:text-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> 100% Verified Pros</span>
              <span className="flex items-center gap-2 transition-colors hover:text-foreground"><Clock className="h-4 w-4 text-primary" /> On-time Guarantee</span>
              <span className="flex items-center gap-2 transition-colors hover:text-foreground"><Star className="h-4 w-4 text-primary" /> 4.9/5 Average Rating</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Legacy Banners Carousel (If any exist) */}
      {banners.length > 0 && (
        <section className="py-8 bg-background border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="relative rounded-2xl overflow-hidden bg-muted/30 border border-border/50">
              <AnimatePresence mode="wait">
                <motion.div
                  key={bannerIdx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 flex items-center justify-between min-h-[120px]"
                >
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground">
                      {banners[bannerIdx]?.title}
                    </h3>
                    {banners[bannerIdx]?.subtitle && (
                      <p className="text-muted-foreground mt-1 font-medium">{banners[bannerIdx].subtitle}</p>
                    )}
                    {banners[bannerIdx]?.link_url && (
                      <Link to={banners[bannerIdx].link_url}>
                        <Button variant="outline" size="sm" className="mt-4 rounded-full">
                          Learn More <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                  {banners[bannerIdx]?.image_url && (
                    <img
                      src={banners[bannerIdx].image_url}
                      alt={banners[bannerIdx].title}
                      className="hidden md:block w-32 h-24 object-cover rounded-xl ml-6 shadow-sm"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
              {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {banners.map((_: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setBannerIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? 'bg-primary w-6' : 'bg-muted-foreground/30 w-1.5 hover:bg-muted-foreground/50'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Advanced Promotional Ads (Bidding System) */}
      <div className="bg-background pt-10 pb-4">
        <PromotionalCarousel />
      </div>

      {/* City indicator */}
      {selectedCityName && (
        <section className="py-2 bg-background">
          <div className="container mx-auto px-4 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-muted/50 rounded-full px-5 py-2 border text-sm text-muted-foreground font-medium shadow-sm transition-all hover:bg-muted">
              <MapPin className="h-4 w-4 text-primary" />
              Showing services in <span className="text-foreground font-semibold">{selectedCityName}</span>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end md:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">Explore Categories</h2>
              <p className="text-muted-foreground mt-2 text-lg font-medium">Comprehensive solutions for your home and lifestyle.</p>
            </div>
            <Link to="/services">
              <Button variant="outline" className="rounded-full shadow-sm hover:bg-secondary">
                View All Categories <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {catLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-muted/30 rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground font-medium">No categories available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredCategories.map((cat: any, i: number) => {
                const Icon = iconMap[cat.icon] || Wrench;
                return (
                  <motion.div key={cat.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                    <Link
                      to={`/services?category=${cat.id}`}
                      className="group block bg-card rounded-2xl p-6 border border-border/60 hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-300 h-full"
                    >
                      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors duration-300">
                        <Icon className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <h3 className="font-heading font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors tracking-tight">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium">{cat.description}</p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Featured / Popular Services */}
      <section className="py-24 bg-muted/20 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end md:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">Popular Services</h2>
              <p className="text-muted-foreground mt-2 text-lg font-medium">Top-rated services delivered by industry experts.</p>
            </div>
            <Link to="/services">
              <Button variant="outline" className="rounded-full shadow-sm bg-card hover:bg-secondary">
                Explore Services <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {svcLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[340px] rounded-2xl" />)}
            </div>
          ) : topServices.length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground font-medium">No popular services available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topServices.map((service: any, i: number) => (
                <motion.div key={service.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }} className="h-full">
                  <Link to={`/service/${service.id}`} className="group block h-full bg-card rounded-2xl border border-border/60 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-border">
                    <div className="h-48 bg-muted relative overflow-hidden">
                      {service.image_url ? (
                        <img src={service.image_url} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted/60">
                           <Wrench className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      
                      <div className="absolute top-3 left-3 bg-card/95 backdrop-blur-md shadow-sm rounded-full px-3 py-1 flex items-center gap-1.5 border border-white/10">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold">{service.duration}m</span>
                      </div>
                      <div className="absolute top-3 right-3 shadow-sm rounded-full bg-card/95 backdrop-blur-md border border-white/10 p-0.5">
                        <FavoriteButton serviceId={service.id} size="sm" />
                      </div>
                    </div>
                    
                    <div className="p-6 flex flex-col justify-between h-[calc(100%-12rem)]">
                      <div>
                        <h3 className="font-heading font-bold text-foreground text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors mb-3">
                          {service.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                          <span className="line-clamp-1 font-medium">{service.provider?.company_name}</span>
                          {service.provider?.is_verified && <ShieldCheck className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Starting at</span>
                          <span className="font-heading font-extrabold text-xl text-foreground">₹{service.price}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-lg border border-border/50">
                          <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                          <span className="font-bold text-sm text-foreground">{service.rating || 'New'}</span>
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
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground tracking-tight">How ServisGo Works</h2>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto font-medium">We've simplified the process of getting things done. From booking to completion, it's seamless.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-[44px] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-border to-transparent" />
            
            {[
              { step: '01', title: 'Select Service', desc: 'Browse our extensive catalog and choose the service that fits your needs.' },
              { step: '02', title: 'Schedule Slot', desc: 'Pick a date and time that works best for your schedule.' },
              { step: '03', title: 'Relax & Enjoy', desc: 'Our verified professional will arrive and complete the task to perfection.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="text-center relative z-10"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-card border shadow-sm flex items-center justify-center mx-auto mb-6 transform hover:scale-105 transition-transform duration-300">
                  <span className="text-2xl md:text-3xl font-heading font-extrabold text-primary">{item.step}</span>
                </div>
                <h3 className="font-heading font-bold text-xl text-foreground mb-3">{item.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed px-4 font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner CTA Section */}
      <section className="py-12 pb-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-[2.5rem] p-10 md:p-16 lg:p-20 border shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
            {/* Decorative background circle */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
            
            <div className="max-w-2xl text-center md:text-left relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-extrabold text-foreground tracking-tight leading-[1.15]">
                Scale your service business with ServisGo.
              </h2>
              <p className="text-lg text-muted-foreground mt-6 mb-10 leading-relaxed font-medium">
                Join our network of elite professionals. Get more bookings, manage your schedule, and grow your revenue effortlessly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link to="/provider-signup">
                  <Button size="lg" className="rounded-full px-8 h-14 text-base font-semibold w-full sm:w-auto shadow-lg shadow-primary/20">
                    Become a Partner <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              
              <div className="mt-10 flex items-center justify-center md:justify-start gap-6">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-muted-foreground">Zero setup fees</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-muted-foreground">Flexible hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Refined Footer */}
      <footer className="py-12 md:py-16 bg-muted/20 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col items-center justify-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-heading font-black text-lg tracking-tight">SG</span>
            </div>
            <span className="font-heading font-extrabold text-2xl tracking-tight text-foreground">ServisGo</span>
          </div>
          
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto mb-10 font-medium leading-relaxed">
            The premier destination for premium, reliable home services. Experience quality without compromise.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm font-semibold text-muted-foreground mb-12">
            <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
            <Link to="/services" className="hover:text-primary transition-colors">All Services</Link>
            <Link to="/provider-signup" className="hover:text-primary transition-colors">Become a Partner</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
          
          <div className="pt-8 border-t border-border/40">
            <p className="text-sm text-muted-foreground font-medium">
              © {new Date().getFullYear()} ServisGo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
