import { useAuth, useProviderBookings, useMyProvider, useServices, useCategories } from '@/hooks/useSupabaseData';
import { useReviewsForProvider } from '@/hooks/useReviews';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { DollarSign, TrendingUp, CalendarDays, Star } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { useEffect } from 'react';
import { toast } from 'sonner';

const COLORS = [
  'hsl(168, 80%, 36%)', 'hsl(30, 95%, 55%)', 'hsl(217, 91%, 60%)',
  'hsl(142, 71%, 45%)', 'hsl(0, 72%, 51%)', 'hsl(280, 65%, 60%)',
];

export default function ProviderAnalytics() {
  const { user } = useAuth();
  const { data: provider, error: providerError } = useMyProvider(user?.id);
  const { data: bookings = [], isLoading, error: bookingsError } = useProviderBookings(user?.id);
  const { data: reviews = [], error: reviewsError } = useReviewsForProvider(provider?.id);
  const { data: services = [] } = useServices();
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    if (providerError) toast.error(`Failed to load provider: ${providerError.message}`);
    if (bookingsError) toast.error(`Failed to load bookings: ${bookingsError.message}`);
    if (reviewsError) toast.error(`Failed to load reviews: ${reviewsError.message}`);
  }, [providerError, bookingsError, reviewsError]);

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in.</div>;
  if (isLoading) return <div className="container mx-auto px-4 py-8"><Skeleton className="h-96 rounded-xl" /></div>;

  const paidBookings = bookings.filter((b: any) => b.payment_status === 'paid');
  const totalRevenue = paidBookings.reduce((s: number, b: any) => s + Number(b.amount), 0);
  const completedCount = bookings.filter((b: any) => b.status === 'completed').length;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  // Monthly revenue trend (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const monthBookings = paidBookings.filter((b: any) => {
      try {
        const d = parseISO(b.created_at);
        return isWithinInterval(d, { start, end });
      } catch { return false; }
    });
    return {
      month: format(month, 'MMM'),
      revenue: monthBookings.reduce((s: number, b: any) => s + Number(b.amount), 0),
      bookings: monthBookings.length,
    };
  });

  // Booking status distribution
  const statusCounts: Record<string, number> = {};
  bookings.forEach((b: any) => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1; });
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Top services by revenue
  const serviceRevenue: Record<string, { name: string; revenue: number; count: number }> = {};
  paidBookings.forEach((b: any) => {
    const sName = b.service?.name || 'Unknown';
    if (!serviceRevenue[sName]) serviceRevenue[sName] = { name: sName, revenue: 0, count: 0 };
    serviceRevenue[sName].revenue += Number(b.amount);
    serviceRevenue[sName].count += 1;
  });
  const topServicesData = Object.values(serviceRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // Rating distribution
  const ratingDist = [1, 2, 3, 4, 5].map((r) => ({
    rating: `${r}★`,
    count: reviews.filter((rv: any) => rv.rating === r).length,
  }));

  // Commission calculation
  const totalCommission = paidBookings.reduce((sum: number, b: any) => {
    const service = services.find((s: any) => s.id === b.service_id);
    const category = service ? categories.find((c: any) => c.id === (service as any).category_id) : null;
    const rate = (category as any)?.commission_rate ?? 20;
    return sum + (Number(b.amount) * rate / 100);
  }, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold text-foreground">Analytics</h1>
      <p className="text-muted-foreground mt-1 mb-8">Revenue insights, booking trends, and performance metrics</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={DollarSign} />
        <StatCard title="Net Earnings" value={`₹${Math.round(totalRevenue - totalCommission).toLocaleString()}`} icon={TrendingUp} />
        <StatCard title="Completed Jobs" value={completedCount} icon={CalendarDays} />
        <StatCard title="Avg Rating" value={avgRating} icon={Star} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-heading">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(168, 80%, 36%)" strokeWidth={2} dot={{ fill: 'hsl(168, 80%, 36%)' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking Trends */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-heading">Monthly Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="bookings" fill="hsl(30, 95%, 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-heading">Top Services by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topServicesData.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground text-sm">No paid bookings yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topServicesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="revenue" fill="hsl(168, 80%, 36%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Booking Status Pie */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-heading">Booking Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground text-sm">No bookings yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card className="border shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-heading">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ratingDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="rating" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="hsl(38, 92%, 50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
