import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { UserRole } from '@/lib/types';
import { Menu, X, Search, Bell, User, ChevronDown } from 'lucide-react';
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

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  employee: 'Employee',
  customer: 'Customer',
  provider: 'Provider',
  serviceman: 'Serviceman',
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-destructive/10 text-destructive',
  employee: 'bg-info/10 text-info',
  customer: 'bg-primary/10 text-primary',
  provider: 'bg-accent/10 text-accent',
  serviceman: 'bg-success/10 text-success',
};

export default function Navbar() {
  const { currentRole, setCurrentRole } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const customerLinks = [
    { to: '/', label: 'Home' },
    { to: '/services', label: 'Services' },
    { to: '/my-bookings', label: 'My Bookings' },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/bookings', label: 'Bookings' },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/admin/providers', label: 'Providers' },
    { to: '/admin/employees', label: 'Employees' },
  ];

  const providerLinks = [
    { to: '/provider', label: 'Dashboard' },
    { to: '/provider/bookings', label: 'Bookings' },
    { to: '/provider/servicemen', label: 'Servicemen' },
  ];

  const servicemanLinks = [
    { to: '/serviceman', label: 'My Jobs' },
  ];

  const links =
    currentRole === 'admin' || currentRole === 'employee'
      ? adminLinks
      : currentRole === 'provider'
      ? providerLinks
      : currentRole === 'serviceman'
      ? servicemanLinks
      : customerLinks;

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-sm">SG</span>
            </div>
            <span className="font-heading font-bold text-xl text-foreground">ServisGo</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
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

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Bell className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Badge className={`${roleColors[currentRole]} border-0 text-xs`}>
                    {roleLabels[currentRole]}
                  </Badge>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Role (Demo)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => setCurrentRole(role)}
                    className={currentRole === role ? 'bg-muted' : ''}
                  >
                    <Badge className={`${roleColors[role]} border-0 text-xs mr-2`}>
                      {roleLabels[role]}
                    </Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
