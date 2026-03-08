import { Badge } from '@/components/ui/badge';
import { statusColors } from '@/lib/mock-data';
import { BookingStatus } from '@/lib/types';

const statusLabels: Record<BookingStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  assigned: 'Assigned',
  on_the_way: 'On the Way',
  started: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge className={`${statusColors[status]} border-0 font-medium`}>
      {statusLabels[status]}
    </Badge>
  );
}
