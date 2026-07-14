import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Landmark, Percent, Calendar, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ProviderLoans() {
  const navigate = useNavigate();
  
  // Calculator States
  const [amount, setAmount] = useState<number>(30000);
  const [tenure, setTenure] = useState<number>(6); // months

  // Eligibility Check States
  const [monthlyEarnings, setMonthlyEarnings] = useState<string>('');
  const [pan, setPan] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [checking, setChecking] = useState<boolean>(false);
  const [checkResult, setCheckResult] = useState<'pending' | 'eligible' | 'rejected' | null>(null);

  // EMI math: monthly interest rate of 1.25% (15% per annum)
  const interestRate = 0.0125;
  const emi = Math.round(
    (amount * interestRate * Math.pow(1 + interestRate, tenure)) / 
    (Math.pow(1 + interestRate, tenure) - 1)
  );
  const totalRepayment = emi * tenure;
  const totalInterest = totalRepayment - amount;

  const handleCheckEligibility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyEarnings || !pan || !pincode) {
      toast.error('Sabhi details bharein');
      return;
    }
    if (pan.length !== 10) {
      toast.error('Kripya sahi PAN number daalein (10 characters)');
      return;
    }

    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      const earningsNum = Number(monthlyEarnings);
      if (earningsNum >= 15000) {
        setCheckResult('eligible');
        toast.success('Congratulations! You are eligible for a loan.');
      } else {
        setCheckResult('rejected');
        toast.error('Eligibility criteria not met.');
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b h-14 flex items-center px-4 justify-between z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/provider/profile')} className="-ml-2">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" /> Partner Loans
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {/* Banner Hero */}
        <Card className="bg-gradient-to-r from-violet-600 to-indigo-600 border-0 text-white shadow-md">
          <CardContent className="p-5 space-y-2">
            <h2 className="text-xl font-heading font-black">Sathiyo ke liye Aasan Loan</h2>
            <p className="text-xs opacity-90 leading-relaxed">
              Grow your business with Surya partner loans. Minimal documentation, interest starting at 1.25% per month, and direct bank transfer within 24 hours.
            </p>
            <div className="flex gap-4 pt-2 text-[10px] uppercase font-bold opacity-80">
              <span className="flex items-center gap-1"><Percent className="h-3 w-3" /> Low Interest</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Flexible Tenure</span>
              <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> 100% Digital</span>
            </div>
          </CardContent>
        </Card>

        {/* EMI Calculator */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading font-bold text-primary">EMI Calculator</CardTitle>
            <CardDescription className="text-xs">Estimate your monthly repayments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Amount Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Loan Amount</span>
                <span className="text-primary text-sm font-bold">₹{amount.toLocaleString('en-IN')}</span>
              </div>
              <Slider value={[amount]} onValueChange={(val) => setAmount(val[0])} min={10000} max={100000} step={5000} className="py-1" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>₹10,000</span>
                <span>₹1,00,000</span>
              </div>
            </div>

            {/* Tenure Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Tenure (Months)</span>
                <span className="text-primary text-sm font-bold">{tenure} Months</span>
              </div>
              <Slider value={[tenure]} onValueChange={(val) => setTenure(val[0])} min={3} max={12} step={1} className="py-1" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>3 Months</span>
                <span>12 Months</span>
              </div>
            </div>

            {/* Computation Display */}
            <div className="bg-muted/40 p-4 rounded-2xl grid grid-cols-2 gap-3 text-center border">
              <div className="border-r">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Monthly EMI</span>
                <span className="font-heading font-black text-foreground text-lg mt-0.5 block">₹{emi.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Interest</span>
                <span className="font-heading font-black text-primary text-lg mt-0.5 block">₹{totalInterest.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eligibility Checker */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading font-bold text-primary">Eligibility Check</CardTitle>
            <CardDescription className="text-xs">Check your eligibility instantly</CardDescription>
          </CardHeader>
          <CardContent>
            {checkResult === null ? (
              <form onSubmit={handleCheckEligibility} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="earnings" className="text-xs font-semibold">Monthly Income (Kamai)</Label>
                  <Input 
                    id="earnings" 
                    type="number" 
                    placeholder="Enter monthly earnings e.g. 25000" 
                    value={monthlyEarnings}
                    onChange={(e) => setMonthlyEarnings(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pan" className="text-xs font-semibold">PAN Card Number</Label>
                  <Input 
                    id="pan" 
                    placeholder="Enter 10-digit PAN (e.g. ABCDE1234F)" 
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    maxLength={10}
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pincode" className="text-xs font-semibold">Home Pincode</Label>
                  <Input 
                    id="pincode" 
                    placeholder="Enter 6-digit Pincode" 
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full font-semibold mt-2 h-11 text-xs" disabled={checking}>
                  {checking ? 'Checking eligibility...' : 'Check eligibility'}
                </Button>
              </form>
            ) : checkResult === 'eligible' ? (
              <div className="text-center py-6 space-y-4">
                <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-emerald-950 text-sm">You are eligible!</h4>
                  <p className="text-xs text-muted-foreground mt-1">Pre-approved loan amount up to ₹45,000 at 1.25% monthly rate.</p>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-xs font-semibold" onClick={() => toast.success('Application submitted! Our agent will contact you.')}>
                  Submit Application
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-destructive text-sm">Eligibility criteria not met</h4>
                  <p className="text-xs text-muted-foreground mt-1">We require a minimum monthly kamai of ₹15,000 for verification.</p>
                </div>
                <Button variant="outline" className="w-full text-xs" onClick={() => setCheckResult(null)}>
                  Try Again with other details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
