import { useAllBookings, useProviders, useCategories, useServices } from '@/hooks/useSupabaseData';
import StatusBadge from '@/components/StatusBadge';
import { CalendarDays, Building2, DollarSign, Wrench, TrendingUp, ArrowUpRight, Users, Percent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: bookings = [], isLoading } = useAllBookings();
  const { data: providers = [] } = useProviders();
  const { data: categories = [] } = useCategories();
  const { data: services = [] } = useServices();

  const totalRevenue = bookings.filter((b: any) => b.payment_status === 'paid').reduce((s: number, b: any) => s + Number(b.amount), 0);
  const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;
  const completedBookings = bookings.filter((b: any) => b.status === 'completed').length;
  const activeProviders = providers.filter((p: any) => p.status === 'active').length;
  const pendingProviders = providers.filter((p: any) => p.status === 'pending').length;

  // Commission calculation
  const totalCommission = bookings
    .filter((b: any) => b.payment_status === 'paid')
    .reduce((sum: number, b: any) => {
      const service = services.find((s: any) => s.id === b.service_id);
      const category = service ? categories.find((c: any) => c.id === service.category_id) : null;
      const rate = (category as any)?.commission_rate ?? 20;
      return sum + (Number(b.amount) * rate / 100);
    }, 0);

  // Unique customers
  const uniqueCustomers = new Set(bookings.map((b: any) => b.customer_id)).size;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Welcome back! Here's your platform overview.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-heading font-bold text-foreground mt-1">{bookings.length}</p>
                <p className="text-xs text-warning flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" /> {pendingBookings} pending
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-heading font-bold text-foreground mt-1">₹{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-success flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" /> {completedBookings} completed
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Platform Commission</p>
                <p className="text-2xl font-heading font-bold text-foreground mt-1">₹{Math.round(totalCommission).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  from paid bookings
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center">
                <Percent className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Providers</p>
                <p className="text-2xl font-heading font-bold text-foreground mt-1">{providers.length}</p>
                <p className="text-xs mt-1">
                  <span className="text-success">{activeProviders} active</span>
                  {pendingProviders > 0 && <span className="text-warning ml-2">{pendingProviders} pending</span>}
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-info/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border bg-card shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customers</p>
              <p className="text-xl font-heading font-bold text-foreground">{uniqueCustomers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border bg-card shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
              <Wrench className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Services</p>
              <p className="text-xl font-heading font-bold text-foreground">{services.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border bg-card shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-info/10 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Categories</p>
              <p className="text-xl font-heading font-bold text-foreground">{categories.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-heading">Recent Bookings</CardTitle>
            <Link to="/admin/bookings">
              <Button variant="ghost" size="sm" className="text-primary gap-1">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-48 rounded-lg" /></div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No bookings yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Customer</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Service</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bookings.slice(0, 8).map((b: any) => (
                    <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-foreground">{b.customer?.full_name || 'Customer'}</td>
                      <td className="px-6 py-3.5 text-foreground">{b.service?.name}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{b.booking_date}</td>
                      <td className="px-6 py-3.5 font-semibold text-foreground">₹{b.amount}</td>
                      <td className="px-6 py-3.5"><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
