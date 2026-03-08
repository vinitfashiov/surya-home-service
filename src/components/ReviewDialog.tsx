import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { useCreateReview } from '@/hooks/useReviews';
import { toast } from 'sonner';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  userId: string;
}

export default function ReviewDialog({ open, onOpenChange, booking, userId }: ReviewDialogProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const createReview = useCreateReview();

  const handleSubmit = async () => {
    try {
      await createReview.mutateAsync({
        booking_id: booking.id,
        customer_id: userId,
        serviceman_id: booking.serviceman_id || undefined,
        provider_id: booking.provider_id,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success('Review submitted! Thank you.');
      onOpenChange(false);
      setRating(5);
      setComment('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit review');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Rate Your Experience</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              How was your experience with <span className="font-medium text-foreground">{booking?.service?.name}</span>?
            </p>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-warning fill-warning'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-foreground mt-2">
              {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Write a review (optional)</label>
            <Textarea
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createReview.isPending}>
            {createReview.isPending ? 'Submitting…' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
