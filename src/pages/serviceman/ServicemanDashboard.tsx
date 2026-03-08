import { useAppStore } from '@/lib/store';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { BookingStatus } from '@/lib/types';
import { MapPin, CalendarDays, Clock, Navigation, Play, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const nextStatus: Partial<Record<BookingStatus, { status: BookingStatus; label: string; icon: React.ElementType }>> = {
  assigned: { status: 'on_the_way', label: 'Start Navigation', icon: Navigation },
  accepted: { status: 'on_the_way', label: 'On the Way', icon: Navigation },
  on_the_way: { status: 'started', label: 'Start Service', icon: Play },
  started: { status: 'completed', label: 'Complete', icon: CheckCircle },
};

export default function ServicemanDashboard() {
  const { bookings, updateBookingStatus } = useAppStore();
  const myJobs = bookings.filter((b) => b.servicemanId === 'SM1' || b.servicemanId === 'SM3' || b.servicemanId === 'SM5');

  const handleUpdate = (id: string, status: BookingStatus) => {
    updateBookingStatus(id, status);
    toast.success(`Job updated to ${status.replace('_', ' ')}`);
  };

  const activeJobs = myJobs.filter(b => !['completed', 'cancelled', 'pending'].includes(b.status));
  const completedJobs = myJobs.filter(b => b.status === 'completed');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">My Jobs</h1>
      <p className="text-muted-foreground mt-1">View and manage your assigned jobs</p>

      {activeJobs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">Active Jobs</h2>
          <div className="space-y-4">
            {activeJobs.map((job) => {
              const next = nextStatus[job.status];
              return (
                <div key={job.id} className="bg-card rounded-xl p-5 shadow-card border">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">{job.serviceName}</h3>
                      <p className="text-sm text-muted-foreground">{job.customerName}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {job.date} at {job.time}</p>
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
            {completedJobs.map((job) => (
              <div key={job.id} className="bg-card rounded-xl p-4 shadow-card border flex items-center justify-between opacity-70">
                <div>
                  <p className="font-medium text-foreground">{job.serviceName}</p>
                  <p className="text-sm text-muted-foreground">{job.customerName} · {job.date}</p>
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

      {myJobs.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">No jobs assigned yet.</div>
      )}
    </div>
  );
}
