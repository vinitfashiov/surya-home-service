import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCartCount } from '@/hooks/useCart';
import { Menu, X, User, ChevronDown, LogOut, LogIn, MapPin, ShoppingCart, Heart } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import NotificationBell from '@/components/NotificationBell';
import CitySelector from '@/components/CitySelector';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from 'sonner';

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  employee: 'Employee',
  customer: 'Customer',
  provider: 'Provider',
  provider_employee: 'Staff',
  serviceman: 'Serviceman',
};

const roleColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive',
  employee: 'bg-info/10 text-info',
  customer: 'bg-primary/10 text-primary',
  provider: 'bg-accent/10 text-accent',
  provider_employee: 'bg-accent/10 text-accent',
  serviceman: 'bg-success/10 text-success',
};

export default function Navbar() {
  const { user, roles, signOut, loading } = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = useCartCount(user?.id);

  const primaryRole = roles[0] || 'customer';

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out');
    navigate('/');
  };

  const customerLinks = [
    { to: '/', label: 'Home' },
    { to: '/services', label: 'Services' },
    { to: '/wishlist', label: 'Wishlist' },
    { to: '/my-bookings', label: 'My Bookings' },
  ];

  const providerLinks = [
    { to: '/provider', label: 'Dashboard' },
    { to: '/provider/analytics', label: 'Analytics' },
    { to: '/provider/bookings', label: 'Bookings' },
    { to: '/provider/campaigns', label: 'Campaigns' },
    { to: '/provider/availability', label: 'Availability' },
    { to: '/provider/servicemen', label: 'Servicemen' },
    { to: '/provider/team', label: 'Team' },
    { to: '/provider/profile', label: 'Profile' },
  ];

  const servicemanLinks = [
    { to: '/serviceman', label: 'My Jobs' },
  ];

  const links = roles.includes('admin') || roles.includes('employee')
    ? [{ to: '/admin', label: 'Admin Panel' }, ...customerLinks]
    : roles.includes('provider') || roles.includes('provider_employee')
    ? providerLinks
    : roles.includes('serviceman')
    ? servicemanLinks
    : customerLinks;

  const isDashboard = location.pathname.startsWith('/admin') ||
                      location.pathname.startsWith('/provider') ||
                      location.pathname.startsWith('/serviceman');

  if (isDashboard) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16 gap-1">
          {/* Logo - always visible but compact on mobile */}
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-xs md:text-sm">SG</span>
            </div>
            <span className="font-heading font-bold text-lg md:text-xl text-foreground hidden sm:inline">ServisGo</span>
          </Link>

          {/* City selector - compact on mobile */}
          <CitySelector />

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <ThemeToggle />
            {!loading && user && !roles.includes('admin') && !roles.includes('provider') && !roles.includes('serviceman') && (
              <Link to="/cart" className="relative p-1.5 md:p-2 rounded-lg hover:bg-muted transition-colors">
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            {!loading && user ? (
              <>
                <NotificationBell userId={user.id} />

                {/* Desktop user menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 md:gap-2 hidden md:flex">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <Badge className={`${roleColors[primaryRole] || roleColors.customer} border-0 text-xs`}>
                        {roleLabels[primaryRole] || 'Customer'}
                      </Badge>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {roles.length > 0 && (
                      <>
                        <DropdownMenuLabel className="text-xs text-muted-foreground">Roles</DropdownMenuLabel>
                        {roles.map((role) => (
                          <DropdownMenuItem key={role} className="cursor-default">
                            <Badge className={`${roleColors[role] || ''} border-0 text-xs`}>
                              {roleLabels[role] || role}
                            </Badge>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" /> My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/my-addresses')} className="cursor-pointer">
                      <MapPin className="h-4 w-4 mr-2" /> My Addresses
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile user icon */}
                <button
                  className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
                  onClick={() => navigate('/profile')}
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                </button>
              </>
            ) : !loading ? (
              <div className="flex items-center gap-1 md:gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs md:text-sm px-2 md:px-3">
                    <LogIn className="h-3.5 w-3.5 md:h-4 md:w-4" /> <span className="hidden sm:inline">Sign in</span>
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="text-xs md:text-sm px-2 md:px-3">Sign up</Button>
                </Link>
              </div>
            ) : null}

            <button className="lg:hidden p-1" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 space-y-1 border-t pt-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <div className="border-t pt-2 mt-2 space-y-1">
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                  <User className="h-4 w-4 inline mr-2" /> My Profile
                </Link>
                <Link to="/my-addresses" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                  <MapPin className="h-4 w-4 inline mr-2" /> My Addresses
                </Link>
                <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/5">
                  <LogOut className="h-4 w-4 inline mr-2" /> Sign out
                </button>
              </div>
            )}
            {!user && (
              <div className="pt-2 flex gap-2 px-3 border-t mt-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">Sign in</Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex-1">
                  <Button size="sm" className="w-full">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
