import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Star, ArrowRight, Scissors, Zap, Droplets, SprayCan, Wrench, Paintbrush, Bug, Hammer, Clock, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories, useServices } from '@/hooks/useSupabaseData';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: Record<string, React.ElementType> = {
  Scissors, Zap, Droplets, SprayCan, Wrench, Paintbrush, Bug, Hammer,
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: services = [], isLoading: svcLoading } = useServices();
  const topServices = services.slice(0, 6);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-hero py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-foreground leading-tight">
              Home services,{' '}
              <span className="text-primary">delivered.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto">
              Book trusted professionals for salon, repairs, cleaning and more — at your doorstep.
            </p>
            <div className="mt-8 flex gap-2 max-w-md mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search for a service..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-12 bg-card" />
              </div>
              <Button size="lg" className="h-12 px-6">Search</Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> Verified Pros</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> On-time</span>
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-primary" /> 4.8★ Avg</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
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
          ) : categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No categories yet. Admin needs to add service categories.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat: any, i: number) => {
                const Icon = iconMap[cat.icon] || Wrench;
                return (
                  <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                    <Link to={`/services?category=${cat.id}`} className="block bg-card rounded-xl p-5 shadow-card border hover:shadow-card-hover transition-shadow group">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-heading font-semibold text-foreground">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-8">Popular Services</h2>
          {svcLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : topServices.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No services available yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {topServices.map((service: any, i: number) => (
                <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                  <Link to={`/book/${service.id}`} className="block bg-card rounded-xl shadow-card border overflow-hidden hover:shadow-card-hover transition-shadow">
                    <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <span className="text-4xl opacity-30">🔧</span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-heading font-semibold text-foreground">{service.name}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{service.provider?.company_name}</p>
                        </div>
                        <p className="font-heading font-bold text-primary text-lg">${service.price}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{service.description}</p>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 text-warning fill-warning" />
                          <span className="font-medium text-foreground">{service.rating}</span>
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
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-2xl p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground">Are you a service provider?</h2>
            <p className="text-primary-foreground/80 mt-3 max-w-md mx-auto">Join thousands of professionals and grow your business with ServisGo.</p>
            <div className="mt-8 flex gap-3 justify-center">
              <Link to="/provider/register">
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
