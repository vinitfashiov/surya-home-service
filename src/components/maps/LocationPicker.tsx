import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Crosshair, Search } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '300px',
};

const defaultCenter = { lat: 28.6139, lng: 77.209 }; // Delhi

interface LocationPickerProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
    pincode?: string;
    state?: string;
    city?: string;
  }) => void;
  className?: string;
}

export default function LocationPicker({
  initialLocation,
  onLocationSelect,
  className,
}: LocationPickerProps) {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );
  const [address, setAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const geocodeLocation = useCallback(
    async (lat: number, lng: number) => {
      const geocoder = new google.maps.Geocoder();
      
      try {
        const response = await geocoder.geocode({ location: { lat, lng } });
        
        if (response.results[0]) {
          const result = response.results[0];
          const addressComponents = result.address_components;
          
          let pincode = '';
          let state = '';
          let city = '';
          
          addressComponents.forEach((component) => {
            if (component.types.includes('postal_code')) {
              pincode = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              state = component.long_name;
            }
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
          });
          
          setAddress(result.formatted_address);
          onLocationSelect({
            lat,
            lng,
            address: result.formatted_address,
            pincode,
            state,
            city,
          });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    },
    [onLocationSelect]
  );

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarker({ lat, lng });
        geocodeLocation(lat, lng);
      }
    },
    [geocodeLocation]
  );

  const handlePlaceSelect = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      setMarker({ lat, lng });
      mapRef.current?.panTo({ lat, lng });
      mapRef.current?.setZoom(15);
      geocodeLocation(lat, lng);
    }
  }, [geocodeLocation]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setMarker({ lat, lng });
        mapRef.current?.panTo({ lat, lng });
        mapRef.current?.setZoom(15);
        geocodeLocation(lat, lng);
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
        alert('Unable to get your location. Please select manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [geocodeLocation]);

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Autocomplete
            onLoad={(autocomplete) => {
              autocompleteRef.current = autocomplete;
            }}
            onPlaceChanged={handlePlaceSelect}
            options={{
              componentRestrictions: { country: 'in' },
            }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for your address..."
                className="pl-10 pr-24"
              />
            </div>
          </Autocomplete>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 gap-1 text-xs"
            onClick={getCurrentLocation}
            disabled={isLocating}
          >
            <Crosshair className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            {isLocating ? 'Locating...' : 'Use GPS'}
          </Button>
        </div>

        {/* Map */}
        <div className="rounded-lg overflow-hidden border">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={marker || defaultCenter}
            zoom={marker ? 15 : 5}
            onClick={handleMapClick}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            options={{
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              zoomControl: true,
            }}
          >
            {marker && (
              <Marker
                position={marker}
                draggable
                onDragEnd={(e) => {
                  if (e.latLng) {
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    setMarker({ lat, lng });
                    geocodeLocation(lat, lng);
                  }
                }}
              />
            )}
          </GoogleMap>
        </div>

        {/* Selected address */}
        {address && (
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{address}</p>
          </div>
        )}
      </div>
    </div>
  );
}
