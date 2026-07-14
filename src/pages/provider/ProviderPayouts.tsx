import { useAuth, useMyProvider, useProviderBookings } from '@/hooks/useSupabaseData';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { useProviderTranslation } from '@/hooks/useProviderTranslation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, Wallet, TrendingUp, Landmark, ShieldCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProviderPayouts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useProviderTranslation();

  const { data: provider, isLoading: providerLoading } = useMyProvider(user?.id);
  const { data: bookings = [], isLoading: bookingsLoading } = useProviderBookings(user?.id);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  // 1. Fetch payout requests from database (with mock fallback if table doesn't exist yet)
  const { data: payoutRequests = [], isLoading: payoutsLoading, refetch: refetchPayouts } = useQuery({
    queryKey: ['provider-payout-requests', provider?.id],
    queryFn: async () => {
      if (!provider?.id) return [];
      try {
        const { data, error } = await supabase
          .from('payout_requests')
          .select('*')
          .eq('provider_id', provider.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err: any) {
        console.warn('payout_requests table not accessible, using mock fallback. Run create_payout_requests.sql in your Supabase SQL editor to create it.', err);
        // Fallback to simulated data from local storage
        const localRequests = JSON.parse(localStorage.getItem(`mock_payouts_${provider.id}`) || '[]');
        return localRequests;
      }
    },
    enabled: !!provider?.id,
  });

  // Calculate statistics from completed bookings
  const completedBookings = bookings.filter((b: any) => b.status === 'completed');
  const totalSales = completedBookings.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);
  const platformCommission = totalSales * 0.20;
  const netEarnings = totalSales * 0.80;

  // Calculate payout status
  const totalWithdrawn = payoutRequests
    .filter((req: any) => req.status === 'approved')
    .reduce((sum: number, req: any) => sum + (Number(req.amount) || 0), 0);

  const totalPending = payoutRequests
    .filter((req: any) => req.status === 'pending')
    .reduce((sum: number, req: any) => sum + (Number(req.amount) || 0), 0);

  const availableBalance = Math.max(0, netEarnings - totalWithdrawn - totalPending);

  // 2. Withdrawal request mutation
  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount < 500) {
      toast.error(t('payouts.withdraw_limit'));
      return;
    }
    if (amount > availableBalance) {
      toast.error('Withdrawal amount exceeds your available balance.');
      return;
    }

    setRequesting(true);
    try {
      // Check if we can write to DB, otherwise write to mock localStorage
      const { data, error } = await supabase
        .from('payout_requests')
        .insert({
          provider_id: provider.id,
          amount: amount,
          status: 'pending'
        } as any)
        .select();

      if (error) throw error;
      toast.success('Payout request submitted successfully');
      setWithdrawAmount('');
      refetchPayouts();
    } catch (err: any) {
      console.warn('Inserting payout_request to DB failed, fallback to simulated storage.', err);
      // Simulate insert in localStorage
      const localRequests = JSON.parse(localStorage.getItem(`mock_payouts_${provider.id}`) || '[]');
      const newMockRequest = {
        id: crypto.randomUUID(),
        provider_id: provider.id,
        amount: amount,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      localRequests.unshift(newMockRequest);
      localStorage.setItem(`mock_payouts_${provider.id}`, JSON.stringify(localRequests));

      toast.success('Payout request simulated successfully! (Database table not created yet)');
      setWithdrawAmount('');
      refetchPayouts();
    } finally {
      setRequesting(false);
    }
  };

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;
  if (providerLoading || bookingsLoading || payoutsLoading) return <div className="container mx-auto px-4 py-8 max-w-lg space-y-4"><div className="h-48 bg-muted rounded-xl animate-pulse" /></div>;

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b h-14 flex items-center px-4 justify-between z-30 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/provider/profile')} className="-ml-2">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" /> {t('payouts.title')}
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {/* Earnings Card */}
        <Card className="border shadow-sm overflow-hidden bg-primary text-primary-foreground">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-primary-foreground/75 font-bold uppercase tracking-wider block">
                {t('payouts.balance')}
              </span>
              <h2 className="text-3xl font-heading font-black">₹{availableBalance.toLocaleString()}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-primary-foreground/15 pt-3.5 text-xs text-primary-foreground/90">
              <div>
                <span className="block text-primary-foreground/70 mb-0.5">{t('payouts.sales')}</span>
                <span className="font-bold text-sm">₹{totalSales.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-primary-foreground/70 mb-0.5">{t('payouts.net')}</span>
                <span className="font-bold text-sm text-emerald-300">₹{netEarnings.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Card */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center text-muted-foreground pb-2 border-b">
              <span>{t('payouts.commission')}</span>
              <span className="font-medium text-foreground">₹{platformCommission.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground pb-2 border-b">
              <span>Pending Withdrawals</span>
              <span className="font-medium text-foreground">₹{totalPending.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Paid Out (Transferred)</span>
              <span className="font-bold text-emerald-600">₹{totalWithdrawn.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading font-bold flex items-center gap-2 text-foreground">
              <Landmark className="h-4.5 w-4.5 text-primary" /> {t('payouts.request_title')}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('payouts.request_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitRequest} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs text-muted-foreground">Amount to Withdraw</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    className="pl-7 h-10 font-bold"
                    min={500}
                    max={availableBalance}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  {t('payouts.withdraw_limit')}
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-lg text-xs"
                disabled={requesting || availableBalance < 500}
              >
                {t('payouts.request_btn')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Request History Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading font-bold flex items-center gap-2 text-foreground">
              <Clock className="h-4.5 w-4.5 text-primary" /> {t('payouts.history')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {payoutRequests.map((req: any) => (
                <div key={req.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-1 min-w-0">
                    <p className="font-heading font-black text-sm text-foreground">₹{Number(req.amount).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Requested: {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {req.status === 'pending' && (
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded uppercase">
                        Pending
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded uppercase flex items-center gap-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Paid
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-destructive/10 text-destructive border border-destructive/20 rounded uppercase flex items-center gap-0.5">
                        <XCircle className="h-2.5 w-2.5" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {payoutRequests.length === 0 && (
                <div className="text-center py-10 px-4">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{t('payouts.no_history')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
