import { describe, it, expect } from 'vitest';

// Test role-based navigation logic (from Navbar)
function getLinksForRole(roles: string[]) {
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
    { to: '/provider/availability', label: 'Availability' },
    { to: '/provider/servicemen', label: 'Servicemen' },
    { to: '/provider/profile', label: 'Profile' },
  ];

  const servicemanLinks = [
    { to: '/serviceman', label: 'My Jobs' },
  ];

  if (roles.includes('admin') || roles.includes('employee')) {
    return [{ to: '/admin', label: 'Admin Panel' }, ...customerLinks];
  }
  if (roles.includes('provider')) return providerLinks;
  if (roles.includes('serviceman')) return servicemanLinks;
  return customerLinks;
}

function shouldShowCart(roles: string[], isLoggedIn: boolean): boolean {
  if (!isLoggedIn) return false;
  return !roles.includes('admin') && !roles.includes('provider') && !roles.includes('serviceman');
}

describe('Role-based Navigation', () => {
  it('customer should see customer links', () => {
    const links = getLinksForRole(['customer']);
    expect(links.map(l => l.to)).toContain('/');
    expect(links.map(l => l.to)).toContain('/services');
    expect(links.map(l => l.to)).toContain('/wishlist');
    expect(links.map(l => l.to)).toContain('/my-bookings');
  });

  it('admin should see admin panel + customer links', () => {
    const links = getLinksForRole(['admin']);
    expect(links[0]).toEqual({ to: '/admin', label: 'Admin Panel' });
    expect(links.map(l => l.to)).toContain('/services');
  });

  it('employee should see admin panel + customer links', () => {
    const links = getLinksForRole(['employee']);
    expect(links[0]).toEqual({ to: '/admin', label: 'Admin Panel' });
  });

  it('provider should see provider-specific links', () => {
    const links = getLinksForRole(['provider']);
    expect(links.map(l => l.to)).toContain('/provider');
    expect(links.map(l => l.to)).toContain('/provider/bookings');
    expect(links.map(l => l.to)).not.toContain('/services');
  });

  it('serviceman should only see jobs', () => {
    const links = getLinksForRole(['serviceman']);
    expect(links).toHaveLength(1);
    expect(links[0].to).toBe('/serviceman');
  });

  it('no roles should default to customer', () => {
    const links = getLinksForRole([]);
    expect(links).toHaveLength(4);
    expect(links.map(l => l.to)).toContain('/services');
  });
});

describe('Cart Visibility', () => {
  it('should show cart for logged-in customers', () => {
    expect(shouldShowCart(['customer'], true)).toBe(true);
  });

  it('should not show cart for providers', () => {
    expect(shouldShowCart(['provider'], true)).toBe(false);
  });

  it('should not show cart for admin', () => {
    expect(shouldShowCart(['admin'], true)).toBe(false);
  });

  it('should not show cart for serviceman', () => {
    expect(shouldShowCart(['serviceman'], true)).toBe(false);
  });

  it('should not show cart when logged out', () => {
    expect(shouldShowCart(['customer'], false)).toBe(false);
  });
});
