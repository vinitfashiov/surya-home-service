import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/provider', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/provider/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/provider/servicemen', label: 'Servicemen', icon: Users },
  { to: '/provider/team', label: 'Team', icon: Shield },
  { to: '/provider/profile', label: 'Profile', icon: User },
];

export default function ProviderBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = item.to === '/provider'
            ? location.pathname === '/provider' || location.pathname === '/provider/'
            : location.pathname.startsWith(item.to);
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
