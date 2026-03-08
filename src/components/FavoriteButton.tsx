import { Heart } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface FavoriteButtonProps {
  serviceId: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function FavoriteButton({ serviceId, size = 'md', className = '' }: FavoriteButtonProps) {
  const { user } = useAuthContext();
  const { data: favoriteIds = [] } = useFavoriteIds(user?.id);
  const toggle = useToggleFavorite();
  const navigate = useNavigate();
  const isFav = favoriteIds.includes(serviceId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Please log in to save favorites');
      navigate('/login');
      return;
    }
    toggle.mutate(
      { userId: user.id, serviceId, isFavorited: isFav },
      {
        onSuccess: () => toast.success(isFav ? 'Removed from wishlist' : 'Added to wishlist'),
      }
    );
  };

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <button
      onClick={handleClick}
      disabled={toggle.isPending}
      className={`p-1.5 rounded-full transition-colors ${isFav ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'} ${className}`}
      aria-label={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart className={`${iconSize} ${isFav ? 'fill-current' : ''}`} />
    </button>
  );
}
