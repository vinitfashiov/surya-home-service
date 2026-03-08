import { useAuthContext } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import FavoriteButton from '@/components/FavoriteButton';
import { Link } from 'react-router-dom';
import { Star, Clock, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function WishlistPage() {
  const { user } = useAuthContext();
  const { data: favorites = [], isLoading } = useFavorites(user?.id);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
        Please log in to view your wishlist.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-8">
        <Heart className="h-6 w-6 text-destructive" />
        <h1 className="text-3xl font-heading font-bold text-foreground">My Wishlist</h1>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-xl font-heading font-semibold text-foreground">Your wishlist is empty</h2>
          <p className="text-muted-foreground mt-2">Browse services and tap the heart icon to save your favorites.</p>
          <Link to="/services" className="inline-block mt-4">
            <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
              Browse Services
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((fav: any, i: number) => {
            const service = fav.service;
            if (!service) return null;
            return (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <Link
                  to={`/service/${service.id}`}
                  className="block bg-card rounded-xl shadow-card border overflow-hidden hover:shadow-card-hover transition-all hover:-translate-y-0.5"
                >
                  <div className="h-28 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative overflow-hidden">
                    {service.image_url ? (
                      <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl opacity-20">🔧</span>
                    )}
                    <div className="absolute top-2 right-2 bg-card/90 rounded-full">
                      <FavoriteButton serviceId={service.id} size="sm" />
                    </div>
                    <Badge className="absolute top-2 left-2 bg-card/90 text-foreground border-0 text-xs">
                      <Clock className="h-3 w-3 mr-1" />{service.duration}m
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-heading font-semibold text-foreground text-sm line-clamp-1">{service.name}</h3>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
