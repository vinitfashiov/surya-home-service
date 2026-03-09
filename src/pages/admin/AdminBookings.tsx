import { useAllBookings, useUpdateBookingStatus, useProviders, useServicemen } from '@/hooks/useSupabaseData';
import { useAssignProvider, useAssignServiceman, useToggleEmergency } from '@/hooks/useBookingAssignment';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CalendarDays, AlertTriangle, UserCog, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

const statusFilters = ['all', 'pending', 'accepted', 'assigned', 'on_the_way', 'started', 'completed', 'cancelled'] as const;

export default function AdminBookings() {
  const { data: bookings = [], isLoading, error: bookingsError } = useAllBookings();
  const { data: providers = [] } = useProviders();
  const updateStatus = useUpdateBookingStatus();
  const assignProvider = useAssignProvider();
  const toggleEmergency = useToggleEmergency();
  
  const [filter, setFilter] = useState('all');
  const [assigningBooking, setAssigningBooking] = useState<any>(null);
  const [assignServicemanBooking, setAssignServicemanBooking] = useState<any>(null);

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
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Serviceman</th>
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
                            <span className="text-muted-foreground">{b.provider?.company_name || '—'}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setAssigningBooking(b)}
                            >
                              <UserCog className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{b.serviceman?.name || '—'}</span>
                            {b.provider_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setAssignServicemanBooking(b)}
                              >
                                <Users className="h-3.5 w-3.5 text-primary" />
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          <div>{b.booking_date}</div>
                          <div className="text-xs">{b.booking_time}</div>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-foreground">${b.amount}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {b.status === 'pending' && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(b.id, 'accepted')}>Accept</Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleStatusChange(b.id, 'cancelled')}>Cancel</Button>
                              </>
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

      {/* Assign Serviceman Dialog */}
      <AssignServicemanDialog
        open={!!assignServicemanBooking}
        onOpenChange={(open) => !open && setAssignServicemanBooking(null)}
        booking={assignServicemanBooking}
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

function AssignServicemanDialog({ open, onOpenChange, booking }: { open: boolean; onOpenChange: (open: boolean) => void; booking: any }) {
  const { data: servicemen = [] } = useServicemen(booking?.provider_id);
  const assignServiceman = useAssignServiceman();
  const [selectedServiceman, setSelectedServiceman] = useState<string>('');

  useEffect(() => {
    if (booking) {
      setSelectedServiceman(booking.serviceman_id || '');
    }
  }, [booking]);

  const handleAssign = () => {
    if (!booking || !selectedServiceman) return;
    
    assignServiceman.mutate(
      { bookingId: booking.id, servicemanId: selectedServiceman },
      {
        onSuccess: () => {
          toast.success('Serviceman assigned');
          onOpenChange(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Serviceman</DialogTitle>
          <DialogDescription>
            Select a serviceman from {booking?.provider?.company_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Serviceman</label>
            <Select value={selectedServiceman} onValueChange={setSelectedServiceman}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a serviceman..." />
              </SelectTrigger>
              <SelectContent>
                {servicemen.filter((s: any) => s.status === 'available').map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} {s.rating ? `(⭐ ${s.rating})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {servicemen.filter((s: any) => s.status === 'available').length === 0 && (
              <p className="text-xs text-muted-foreground">No available servicemen for this provider</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedServiceman || assignServiceman.isPending}
            >
              {assignServiceman.isPending ? 'Assigning...' : 'Assign Serviceman'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
