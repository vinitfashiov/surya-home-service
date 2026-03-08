import { useAuth, useServicemanBookings, useUpdateBookingStatus } from '@/hooks/useSupabaseData';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { MapPin, CalendarDays, Navigation, Play, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const nextStatus: Record<string, { status: string; label: string; icon: React.ElementType } | undefined> = {
  assigned: { status: 'on_the_way', label: 'Start Navigation', icon: Navigation },
  accepted: { status: 'on_the_way', label: 'On the Way', icon: Navigation },
  on_the_way: { status: 'started', label: 'Start Service', icon: Play },
  started: { status: 'completed', label: 'Complete', icon: CheckCircle },
};

export default function ServicemanDashboard() {
  const { user } = useAuth();
  const { data: bookings = [], isLoading } = useServicemanBookings(user?.id);
  const updateStatus = useUpdateBookingStatus();

  const handleUpdate = (id: string, status: string) => {
    updateStatus.mutate({ bookingId: id, status }, {
      onSuccess: () => toast.success(`Job updated to ${status.replace('_', ' ')}`),
      onError: (err) => toast.error(err.message),
    });
  };

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a serviceman.</div>;
  if (isLoading) return <div className="container mx-auto px-4 py-8"><Skeleton className="h-96 rounded-xl" /></div>;

  const activeJobs = bookings.filter((b: any) => !['completed', 'cancelled', 'pending'].includes(b.status));
  const completedJobs = bookings.filter((b: any) => b.status === 'completed');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">My Jobs</h1>
      <p className="text-muted-foreground mt-1">View and manage your assigned jobs</p>

      {activeJobs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Active Jobs</h2>
          <div className="space-y-4">
            {activeJobs.map((job: any) => {
              const next = nextStatus[job.status];
              return (
                <div key={job.id} className="bg-card rounded-xl p-5 shadow-card border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">{job.service?.name}</h3>
                      <p className="text-sm text-muted-foreground">{job.customer?.full_name}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {job.booking_date} at {job.booking_time}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {job.address}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-heading font-bold text-primary">${job.amount}</span>
                    {next && (
                      <Button size="sm" onClick={() => handleUpdate(job.id, next.status)}>
                        <next.icon className="h-4 w-4 mr-1" /> {next.label}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completedJobs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Completed</h2>
          <div className="space-y-3">
            {completedJobs.map((job: any) => (
              <div key={job.id} className="bg-card rounded-xl p-4 shadow-card border flex items-center justify-between opacity-70">
                <div>
                  <p className="font-medium text-foreground">{job.service?.name}</p>
                  <p className="text-sm text-muted-foreground">{job.customer?.full_name} · {job.booking_date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold text-primary">${job.amount}</span>
                  <StatusBadge status={job.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">No jobs assigned yet.</div>
      )}
    </div>
  );
}
