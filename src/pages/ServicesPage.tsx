import { useSearchParams, Link } from 'react-router-dom';
import { useCategories, useServices } from '@/hooks/useSupabaseData';
import { Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function ServicesPage() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState(categoryId || 'all');

  const { data: categories = [] } = useCategories();
  const { data: services = [], isLoading } = useServices(selectedCategory);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">All Services</h1>
      <p className="text-muted-foreground mt-1">Browse and book professional services near you</p>

      <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
        <Button variant={selectedCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory('all')}>All</Button>
        {categories.map((cat: any) => (
          <Button key={cat.id} variant={selectedCategory === cat.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat.id)} className="whitespace-nowrap">
            {cat.name}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {services.map((service: any, i: number) => (
            <motion.div key={service.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/book/${service.id}`} className="block bg-card rounded-xl shadow-card border overflow-hidden hover:shadow-card-hover transition-shadow">
                <div className="h-28 bg-gradient-to-br from-primary/10 to-accent/10" />
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">{service.name}</h3>
                      <p className="text-sm text-muted-foreground">{service.provider?.company_name}</p>
                    </div>
                    <span className="font-heading font-bold text-primary">${service.price}</span>
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

      {!isLoading && services.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No services found in this category.</p>
        </div>
      )}
    </div>
  );
}
