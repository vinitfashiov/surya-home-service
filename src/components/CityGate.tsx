import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Navigation, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCities } from '@/hooks/useCities';
import { useCityStore } from '@/lib/cityStore';
import { Skeleton } from '@/components/ui/skeleton';

export default function CityGate() {
  const { data: cities = [], isLoading } = useCities();
  const { setCity, setHasChecked } = useCityStore();
  const [search, setSearch] = useState('');
  const [notServiceable, setNotServiceable] = useState(false);
  const [enteredLocation, setEnteredLocation] = useState('');

  const filteredCities = cities.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectCity = (city: any) => {
    setCity(city.id, city.name);
  };

  const handleSearchSubmit = () => {
    const trimmed = search.trim();
    if (!trimmed) return;

    // Check if the searched text matches any active city
    const match = cities.find((c: any) =>
      c.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (match) {
      handleSelectCity(match);
    } else {
      setEnteredLocation(trimmed);
      setNotServiceable(true);
    }
  };

  if (notServiceable) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-4 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-warning" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            We're not in {enteredLocation} yet
          </h1>
          <p className="text-muted-foreground mt-3 max-w-sm mx-auto">
            Sorry for the inconvenience! We're expanding fast and will be in your city soon. Stay tuned!
          </p>
          <div className="mt-8 space-y-3">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => { setNotServiceable(false); setSearch(''); }}
            >
              <MapPin className="h-4 w-4" /> Try a different city
            </Button>
          </div>

          {cities.length > 0 && (
            <div className="mt-8">
              <p className="text-sm text-muted-foreground mb-3">We currently serve:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {cities.map((city: any) => (
                  <Button
                    key={city.id}
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleSelectCity(city)}
                  >
                    {city.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-lg w-full mx-4"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-heading font-bold text-lg">SG</span>
          </div>
          <span className="font-heading font-bold text-2xl text-foreground">ServisGo</span>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Where do you need service?
          </h1>
          <p className="text-muted-foreground mt-2">
            Select your city so we can show you available services in your area
          </p>
        </div>

        {/* Search input */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for your city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
            className="pl-10 h-12 text-base"
            autoFocus
          />
        </div>

        {/* City grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : filteredCities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No matching city found for "<span className="font-medium text-foreground">{search}</span>"
            </p>
            <Button onClick={handleSearchSubmit} variant="outline" className="gap-2">
              <Navigation className="h-4 w-4" /> Check availability for "{search}"
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredCities.map((city: any) => (
              <motion.button
                key={city.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectCity(city)}
                className="bg-card rounded-xl p-4 border shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-foreground">{city.name}</p>
                    {city.state && (
                      <p className="text-xs text-muted-foreground">{city.state}</p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
