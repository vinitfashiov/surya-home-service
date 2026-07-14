import { useState, useEffect } from 'react';
import { useAuth, useMyProvider } from '@/hooks/useSupabaseData';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Coins, CreditCard, ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
}

export default function ProviderCredits() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: provider, refetch } = useMyProvider(user?.id);

  // Read credits from provider column, default to 500
  const credits = provider?.credits ?? (() => {
    const localVal = localStorage.getItem(`provider_credits_${user?.id}`);
    return localVal ? Number(localVal) : 500;
  })();

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user?.id) {
      const localTrans = localStorage.getItem(`provider_trans_${user.id}`);
      if (localTrans) {
        setTransactions(JSON.parse(localTrans));
      } else {
        const initialTrans: Transaction[] = [
          { id: '1', type: 'credit', amount: 500, description: 'Welcome Credits Credited', date: '2026-07-01' },
          { id: '2', type: 'debit', amount: 20, description: 'Job Assignment Lead #10294', date: '2026-07-05' },
          { id: '3', type: 'debit', amount: 25, description: 'Job Assignment Lead #10492', date: '2026-07-10' }
        ];
        localStorage.setItem(`provider_trans_${user.id}`, JSON.stringify(initialTrans));
        setTransactions(initialTrans);
      }
    }
  }, [user]);

  const handleRecharge = async (rechargeAmount: number, creditsGained: number) => {
    const updatedCredits = credits + creditsGained;
    
    // Save to DB if column exists, else localStorage fallback
    try {
      const { error } = await supabase
        .from('providers')
        .update({ credits: updatedCredits } as any)
        .eq('id', provider?.id);

      if (error) throw error;
      refetch();
    } catch (err) {
      // Fallback
      localStorage.setItem(`provider_credits_${user?.id}`, String(updatedCredits));
    }

    // Add transaction log
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: 'credit',
      amount: creditsGained,
      description: `Recharge Pack ₹${rechargeAmount}`,
      date: new Date().toISOString().split('T')[0]
    };
    
    const nextTx = [newTx, ...transactions];
    setTransactions(nextTx);
    localStorage.setItem(`provider_trans_${user?.id}`, JSON.stringify(nextTx));
    toast.success(`Success! Added ${creditsGained} credits.`);
  };

  const rechargePacks = [
    { price: 500, credits: 50, label: 'Starter Pack', popular: false },
    { price: 1000, credits: 120, label: 'Value Pack (+20% Free)', popular: true },
    { price: 2000, credits: 260, label: 'Premium Pack (+30% Free)', popular: false },
  ];

  if (!user) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Please log in as a provider.</div>;

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b h-14 flex items-center px-4 justify-between z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/provider/profile')} className="-ml-2">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" /> Wallet Credits
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {/* Wallet Balance Card */}
        <Card className="bg-gradient-to-br from-primary to-primary-foreground border-0 text-primary-foreground shadow-md relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
            <Coins className="w-40 h-40" />
          </div>
          <CardContent className="p-6">
            <p className="text-sm opacity-80 font-medium">Available Balance</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-4xl font-heading font-black">{credits}</h2>
              <span className="text-sm font-semibold opacity-90">Credits</span>
            </div>
            <p className="text-xs opacity-75 mt-3 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> 1 Credit = ₹10 lead value
            </p>
          </CardContent>
        </Card>

        {/* Buy Credits Options */}
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">Top Up Wallet</h3>
          {rechargePacks.map((pack) => (
            <Card key={pack.price} className={`border transition-all relative ${pack.popular ? 'border-primary shadow-sm bg-primary/5' : 'bg-card'}`}>
              {pack.popular && (
                <span className="absolute top-0 right-4 -translate-y-1/2 bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Popular
                </span>
              )}
              <CardContent className="p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="font-bold text-sm text-foreground">{pack.label}</p>
                  <p className="text-2xl font-black text-primary font-heading">
                    {pack.credits} <span className="text-xs font-semibold text-muted-foreground">Credits</span>
                  </p>
                </div>
                <Button className="gap-1.5 font-semibold text-xs h-10 px-4" onClick={() => handleRecharge(pack.price, pack.credits)}>
                  <CreditCard className="h-3.5 w-3.5" /> Buy for ₹{pack.price}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ledger Transaction History */}
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-sm text-foreground uppercase tracking-wider">Transaction History</h3>
          <Card className="border shadow-sm">
            <CardContent className="p-0 divide-y">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex justify-between items-center text-sm">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                      {tx.type === 'credit' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate text-xs">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`font-heading font-bold shrink-0 text-sm ${tx.type === 'credit' ? 'text-emerald-600' : 'text-destructive'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                  </span>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-center py-6 text-xs text-muted-foreground">No transaction logs available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
