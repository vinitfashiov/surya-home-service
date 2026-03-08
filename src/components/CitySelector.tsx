import { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useCities } from '@/hooks/useCities';
import { useCityStore } from '@/lib/cityStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function CitySelector() {
  const { data: cities = [] } = useCities();
  const { selectedCityName, setCity, clearCity } = useCityStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-sm max-w-[160px]">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">{selectedCityName || 'Select City'}</span>
          <ChevronDown className="h-3 w-3 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Your Location</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {cities.map((city: any) => (
          <DropdownMenuItem
            key={city.id}
            onClick={() => setCity(city.id, city.name)}
            className="cursor-pointer gap-2"
          >
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            {city.name}
            {city.state && <span className="text-xs text-muted-foreground ml-auto">{city.state}</span>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={clearCity} className="cursor-pointer text-muted-foreground text-xs">
          Change location
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
