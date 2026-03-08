import { useAllBookings, useUpdateBookingStatus } from '@/hooks/useSupabaseData';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const statusFilters = ['all', 'pending', 'accepted', 'assigned', 'on_the_way', 'started', 'completed', 'cancelled'] as const;

export default function AdminBookings() {
  const { data: bookings = [], isLoading } = useAllBookings();
  const updateStatus = useUpdateBookingStatus();
  const [filter, setFilter] = useState('all');

  const filteredBookings = filter === 'all' ? bookings : bookings.filter((b: any) => b.status === filter);

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ bookingId: id, status }, {
      onSuccess: () => toast.success(`Booking updated to ${status}`),
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
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Customer</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Service</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Provider</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Date & Time</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredBookings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-foreground">{b.customer?.full_name || 'Customer'}</td>
                        <td className="px-6 py-3.5 text-foreground">{b.service?.name}</td>
                        <td className="px-6 py-3.5 text-muted-foreground">{b.provider?.company_name}</td>
                        <td className="px-6 py-3.5 text-muted-foreground">
                          <div>{b.booking_date}</div>
                          <div className="text-xs">{b.booking_time}</div>
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-foreground">${b.amount}</td>
                        <td className="px-6 py-3.5"><StatusBadge status={b.status} /></td>
                        <td className="px-6 py-3.5">
                          {b.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(b.id, 'accepted')}>Accept</Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleStatusChange(b.id, 'cancelled')}>Cancel</Button>
                            </div>
                          )}
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
    </div>
  );
}
