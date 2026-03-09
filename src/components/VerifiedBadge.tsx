import { ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export default function VerifiedBadge({ className = '', size = 'sm' }: VerifiedBadgeProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-0.5 text-primary ${className}`}>
          <ShieldCheck className={`${iconSize} fill-primary/20`} />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">Verified Provider</p>
      </TooltipContent>
    </Tooltip>
  );
}
