import { useState } from 'react';
import { useAuth, useMyProvider } from '@/hooks/useSupabaseData';
import { useCities } from '@/hooks/useCities';
import { useZones } from '@/hooks/useZones';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Map, MapPin, Calendar, Compass, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ProviderHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: provider, refetch } = useMyProvider(user?.id);
  const { data: cities = [] } = useCities();
  const { data: zones = [] } = useZones();
  
  const [online, setOnline] = useState(provider?.status === 'active');
  const [updating, setUpdating] = useState(false);

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;

  const currentCity = cities.find((c: any) => c.id === provider?.city_id);
  const currentZone = zones.find((z: any) => z.id === provider?.zone_id);

  const handleStatusToggle = async (checked: boolean) => {
    setOnline(checked);
    setUpdating(true);
    const newStatus = checked ? 'active' : 'inactive';
    try {
      const { error } = await supabase
        .from('providers')
        .update({ status: newStatus })
        .eq('id', provider.id);
      
      if (error) throw error;
      toast.success(`You are now ${checked ? 'Online' : 'Offline'}`);
      refetch();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update online status');
      setOnline(!checked);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setUpdating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const { error } = await supabase
            .from('providers')
            .update({
              latitude,
              longitude
            })
            .eq('id', provider.id);

          if (error) throw error;
          toast.success(`Location updated: Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`);
          refetch();
        } catch (e: any) {
          toast.error(e.message || 'Failed to update coordinates');
        } finally {
          setUpdating(false);
        }
      },
      (error) => {
        toast.error(`Geolocation error: ${error.message}`);
        setUpdating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b h-14 flex items-center px-4 justify-between z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/provider/profile')} className="-ml-2">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" /> Mera Hub
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {/* Status Toggle Card */}
        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-foreground text-base">Duty Status</h3>
              <p className="text-xs text-muted-foreground">
                {!provider?.is_verified 
                  ? 'Locked: Complete account verification to go online' 
                  : online 
                    ? 'You are active and receiving booking requests' 
                    : 'Go online to start receiving requests'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold ${online ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {!provider?.is_verified ? 'LOCKED' : online ? 'ONLINE' : 'OFFLINE'}
              </span>
              <Switch checked={online} onCheckedChange={handleStatusToggle} disabled={updating || !provider?.is_verified} />
            </div>
          </CardContent>
        </Card>

        {/* Hub Location Details */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading font-bold flex items-center gap-2 text-primary">
              <MapPin className="h-4 w-4" /> Registered Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-muted-foreground">Service City</span>
              <span className="font-semibold text-foreground">{currentCity?.name || 'Not Assigned'}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-muted-foreground">Operating Zone</span>
              <span className="font-semibold text-foreground">{currentZone?.name || 'Not Assigned'}</span>
            </div>
            <div className="flex justify-between items-start text-sm">
              <span className="text-muted-foreground mt-0.5">Address Hub</span>
              <span className="font-medium text-foreground text-right max-w-[200px] break-words">
                {provider?.address || 'No Address Set'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* GPS Coordinates */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading font-bold flex items-center gap-2 text-primary">
              <Compass className="h-4 w-4" /> GPS Coordinates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              These coordinates are used to automatically assign you bookings closest to your current location.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm pt-1">
              <div className="p-3 bg-muted rounded-xl text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Latitude</span>
                <span className="font-mono font-bold text-foreground mt-1 block">
                  {provider?.latitude ? Number(provider.latitude).toFixed(6) : 'Not Set'}
                </span>
              </div>
              <div className="p-3 bg-muted rounded-xl text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Longitude</span>
                <span className="font-mono font-bold text-foreground mt-1 block">
                  {provider?.longitude ? Number(provider.longitude).toFixed(6) : 'Not Set'}
                </span>
              </div>
            </div>
            {!provider?.latitude && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-amber-700 text-xs border border-amber-200">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Coordinates missing. Update profile coordinates to get bookings.</span>
              </div>
            )}
            <Button
              className="w-full mt-2 h-9 text-xs font-semibold gap-1.5"
              onClick={handleUpdateGPS}
              disabled={updating}
            >
              <MapPin className="h-3.5 w-3.5" />
              Update Current GPS Location
            </Button>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-2">
            <Button variant="outline" className="w-full justify-between items-center h-12" onClick={() => navigate('/provider/availability')}>
              <span className="flex items-center gap-2.5 text-sm font-semibold">
                <Calendar className="h-5 w-5 text-primary" /> Availability Slots
              </span>
              <Badge variant="outline" className="text-[10px] uppercase border-emerald-500/30 text-emerald-600 bg-emerald-50/50">
                Configure
              </Badge>
            </Button>
          </CardContent>
        </Card>

        {/* Verification Status Banner */}
        <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-heading font-bold text-emerald-950 text-sm">Hub Operational & Verified</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Your Hub coordinates match our coverage area. You will receive active booking alerts directly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
