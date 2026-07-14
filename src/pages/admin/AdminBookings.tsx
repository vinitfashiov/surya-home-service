import { useAllBookings, useUpdateBookingStatus, useProviders } from '@/hooks/useSupabaseData';
import { useAssignProvider, useToggleEmergency } from '@/hooks/useBookingAssignment';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CalendarDays, AlertTriangle, UserCog, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

const statusFilters = ['all', 'pending', 'accepted', 'on_the_way', 'started', 'completed', 'cancelled'] as const;

export default function AdminBookings() {
  const { data: bookings = [], isLoading, error: bookingsError } = useAllBookings();
  const { data: providers = [] } = useProviders();
  const updateStatus = useUpdateBookingStatus();
  const assignProvider = useAssignProvider();
  const toggleEmergency = useToggleEmergency();
  
  const [filter, setFilter] = useState('all');
  const [assigningBooking, setAssigningBooking] = useState<any>(null);

  useEffect(() => {
    if (bookingsError) toast.error(`Failed to load bookings: ${bookingsError.message}`);
  }, [bookingsError]);

  const filteredBookings = filter === 'all' ? bookings : bookings.filter((b: any) => b.status === filter);

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ bookingId: id, status }, {
      onSuccess: () => toast.success(`Booking updated to ${status}`),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleAssignProvider = (bookingId: string, providerId: string) => {
    assignProvider.mutate({ bookingId, providerId }, {
      onSuccess: () => {
        toast.success('Provider assigned successfully');
        setAssigningBooking(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleAutoAssign = async (booking: any) => {
    // 1. Filter online/active providers
    const activeProviders = providers.filter((p: any) => p.status === 'active');
    if (activeProviders.length === 0) {
      toast.error('No active/online providers available.');
      return;
    }

    // 2. Find closest provider
    let chosenProvider: any = null;
    let minDistance = Infinity;

    const bLat = booking.latitude ? Number(booking.latitude) : null;
    const bLng = booking.longitude ? Number(booking.longitude) : null;

    if (bLat && bLng) {
      // Calculate distance using Haversine formula
      const toRad = (x: number) => (x * Math.PI) / 180;
      activeProviders.forEach((prov: any) => {
        const pLat = prov.latitude ? Number(prov.latitude) : null;
        const pLng = prov.longitude ? Number(prov.longitude) : null;

        if (pLat && pLng) {
          const R = 6371; // Earth's radius in km
          const dLat = toRad(pLat - bLat);
          const dLng = toRad(pLng - bLng);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(bLat)) *
              Math.cos(toRad(pLat)) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const d = R * c;

          if (d < minDistance) {
            minDistance = d;
            chosenProvider = prov;
          }
        }
      });
    }

    // 3. Fallback: match by city_id
    if (!chosenProvider) {
      const cityId = booking.service?.provider?.city_id || booking.city_id;
      const cityProviders = activeProviders.filter((p: any) => p.city_id === cityId);
      if (cityProviders.length > 0) {
        chosenProvider = cityProviders[0];
      }
    }

    // 4. Fallback 2: pick the first active provider
    if (!chosenProvider && activeProviders.length > 0) {
      chosenProvider = activeProviders[0];
    }

    if (!chosenProvider) {
      toast.error('No suitable online provider found in this area.');
      return;
    }

    // Execute assignment
    assignProvider.mutate({ bookingId: booking.id, providerId: chosenProvider.id }, {
      onSuccess: () => {
        toast.success(`Assigned to ${chosenProvider.company_name} ${minDistance === Infinity ? '' : `(${minDistance.toFixed(2)} km away)`}`);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleToggleEmergency = (bookingId: string, current: boolean) => {
    toggleEmergency.mutate({ bookingId, isEmergency: !current }, {
      onSuccess: () => toast.success(current ? 'Emergency flag removed' : 'Marked as emergency'),
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all platform bookings</p>
        </div>
        <Badge variant="outline" className="text-sm gap-1.5 py-1.5 px-3">
          <CalendarDays className="h-3.5 w-3.5" /> {bookings.length} total
        </Badge>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No bookings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Customer</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Service</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Provider</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredBookings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-foreground">{b.customer?.full_name || 'Customer'}</div>
                          {b.is_emergency && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 mt-1">
                              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> EMERGENCY
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-foreground">{b.service?.name}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {b.provider?.company_name ? (
                              <>
                                <span className="text-muted-foreground">{b.provider.company_name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => setAssigningBooking(b)}
                                >
                                  <UserCog className="h-3.5 w-3.5 text-primary" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold uppercase text-[9px] px-1.5 py-0.5">
                                  Unassigned
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => setAssigningBooking(b)}
                                >
                                  <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          <div>{b.booking_date}</div>
                          <div className="text-xs">{b.booking_time}</div>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-foreground">₹{b.amount}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {b.status === 'pending' && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(b.id, 'accepted')}>Accept</Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleStatusChange(b.id, 'cancelled')}>Cancel</Button>
                              </>
                            )}
                            {!b.provider_id && b.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100/80 border border-emerald-200/50 gap-1 font-bold"
                                onClick={() => handleAutoAssign(b)}
                                disabled={assignProvider.isPending}
                              >
                                <Zap className="h-3 w-3 fill-emerald-600" />
                                Auto-Assign
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant={b.is_emergency ? 'destructive' : 'outline'}
                              className="h-7 text-xs"
                              onClick={() => handleToggleEmergency(b.id, b.is_emergency)}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {b.is_emergency ? 'Remove' : 'Emergency'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assign Provider Dialog */}
      <AssignProviderDialog
        open={!!assigningBooking}
        onOpenChange={(open) => !open && setAssigningBooking(null)}
        booking={assigningBooking}
        providers={providers.filter((p: any) => p.status === 'active')}
        onAssign={handleAssignProvider}
        isLoading={assignProvider.isPending}
      />
    </div>
  );
}

interface AssignProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  providers: any[];
  onAssign: (bookingId: string, providerId: string) => void;
  isLoading: boolean;
}

function AssignProviderDialog({ open, onOpenChange, booking, providers, onAssign, isLoading }: AssignProviderDialogProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  useEffect(() => {
    if (booking) {
      setSelectedProvider(booking.provider_id || '');
    }
  }, [booking]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Provider</DialogTitle>
          <DialogDescription>
            Select a provider for this booking: {booking?.service?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Provider</label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a provider..." />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.company_name} ({p.owner_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => booking && onAssign(booking.id, selectedProvider)}
              disabled={!selectedProvider || isLoading}
            >
              {isLoading ? 'Assigning...' : 'Assign Provider'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
