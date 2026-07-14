import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useMyProvider } from '@/hooks/useSupabaseData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProviderTranslation } from '@/hooks/useProviderTranslation';
import { ChevronLeft, FileSpreadsheet, Building, CreditCard, User, Landmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ProviderFinancialDetails() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: provider, refetch } = useMyProvider(user?.id);
  const { t } = useProviderTranslation();

  // Form edit modal states
  const [activeModal, setActiveModal] = useState<'gst' | 'pan' | 'bank' | 'payment' | 'personal' | null>(null);

  // Profile data state (combines DB fields and local fallback)
  const [gst, setGst] = useState('');
  const [pan, setPan] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAcc, setBankAcc] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');

  // Load initial data
  useEffect(() => {
    if (provider) {
      const localData = JSON.parse(localStorage.getItem(`provider_fin_${provider.id}`) || '{}');
      setGst(provider.gst_number || localData.gst || '');
      setPan(provider.pan_number || localData.pan || 'ISLPK3218M');
      setBankName(provider.bank_name || localData.bankName || 'State Bank of India');
      setBankAcc(provider.bank_account_number || localData.bankAcc || '38294829381');
      setBankIfsc(provider.bank_ifsc || localData.bankIfsc || 'SBIN0004928');
      setBankHolder(provider.bank_account_name || localData.bankHolder || provider.owner_name || '');
      setPaymentMode(localData.paymentMode || 'Bank Transfer');
      setDob(provider.date_of_birth || localData.dob || '1992-08-14');
      setGender(localData.gender || 'Male');
    }
  }, [provider]);

  // Handle saving data to DB (or localStorage)
  const handleSave = async (fieldsToUpdate: Record<string, any>, localUpdate: Record<string, any>) => {
    if (!provider) return;

    try {
      const { error } = await supabase
        .from('providers')
        .update(fieldsToUpdate as any)
        .eq('id', provider.id);

      if (error) throw error;
      toast.success('Details saved in database!');
      refetch();
    } catch (err) {
      const currentLocal = JSON.parse(localStorage.getItem(`provider_fin_${provider.id}`) || '{}');
      localStorage.setItem(`provider_fin_${provider.id}`, JSON.stringify({
        ...currentLocal,
        ...localUpdate
      }));
      toast.success('Details saved locally!');
    }
    setActiveModal(null);
  };

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
            <Landmark className="h-5 w-5 text-primary" /> {t('profile.financial_details')}
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {/* GST SECTION */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5" /> {t('finance.gst')}
              </span>
              <Button variant="link" className="text-primary text-xs font-semibold p-0 h-auto" onClick={() => setActiveModal('gst')}>
                {gst ? 'Parivartan kare' : 'Daale +'}
              </Button>
            </div>
            <p className="font-heading font-bold text-sm text-foreground">
              {gst ? gst : 'Not Added'}
            </p>
          </CardContent>
        </Card>

        {/* PAN CARD SECTION */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5" /> {t('finance.pan')}
              </span>
              <Button variant="link" className="text-primary text-xs font-semibold p-0 h-auto" onClick={() => setActiveModal('pan')}>
                Parivartan kare
              </Button>
            </div>
            <p className="font-heading font-bold text-sm text-foreground font-mono">
              {pan ? pan : 'Not Added'}
            </p>
          </CardContent>
        </Card>

        {/* BANK ACCOUNT SECTION */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5" /> {t('finance.bank')}
              </span>
              <Button variant="link" className="text-primary text-xs font-semibold p-0 h-auto" onClick={() => setActiveModal('bank')}>
                Parivartan kare
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div>
                <p className="text-muted-foreground">{t('finance.bank_name')}</p>
                <p className="font-semibold text-foreground mt-0.5">{bankName || 'Not Added'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('finance.ac_no')}</p>
                <p className="font-mono font-semibold text-foreground mt-0.5">
                  {bankAcc ? `******${bankAcc.slice(-4)}` : 'Not Added'}
                </p>
              </div>
              <div className="pt-2">
                <p className="text-muted-foreground">{t('finance.ifsc')}</p>
                <p className="font-mono font-semibold text-foreground mt-0.5">{bankIfsc || 'Not Added'}</p>
              </div>
              <div className="pt-2">
                <p className="text-muted-foreground">{t('finance.holder')}</p>
                <p className="font-semibold text-foreground mt-0.5 truncate">{bankHolder || 'Not Added'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PAYMENT OPTION SECTION */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" /> Bhugtan vikalp (Payout Mode)
              </span>
              <Button variant="link" className="text-primary text-xs font-semibold p-0 h-auto" onClick={() => setActiveModal('payment')}>
                Parivartan kare
              </Button>
            </div>
            <p className="font-heading font-bold text-sm text-foreground">
              {paymentMode}
            </p>
          </CardContent>
        </Card>

        {/* PERSONAL DETAILS SECTION */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Personal details
              </span>
              <Button variant="link" className="text-primary text-xs font-semibold p-0 h-auto" onClick={() => setActiveModal('personal')}>
                Parivartan kare
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div>
                <p className="text-muted-foreground">Date of Birth</p>
                <p className="font-semibold text-foreground mt-0.5">{dob || 'Not Added'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gender</p>
                <p className="font-semibold text-foreground mt-0.5">{gender}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 1. GST EDIT DIALOG */}
      <Dialog open={activeModal === 'gst'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-sm text-foreground">GST Details Daalein</DialogTitle>
            <DialogDescription className="text-xs">
              Enter your corporate Goods and Services Tax ID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="gstInput" className="text-xs font-semibold">{t('finance.gst')}</Label>
              <Input id="gstInput" value={gst} onChange={(e) => setGst(e.target.value.toUpperCase())} placeholder="e.g. 07AAAAA1111A1Z1" maxLength={15} />
            </div>
            <Button className="w-full text-xs font-semibold h-10" onClick={() => handleSave({ gst_number: gst }, { gst })}>
              {t('finance.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. PAN EDIT DIALOG */}
      <Dialog open={activeModal === 'pan'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-sm text-foreground">PAN Card Details Parivartan Karein</DialogTitle>
            <DialogDescription className="text-xs">
              Enter your Permanent Account Number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="panInput" className="text-xs font-semibold">{t('finance.pan')}</Label>
              <Input id="panInput" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="e.g. ABCDE1234F" maxLength={10} />
            </div>
            <Button className="w-full text-xs font-semibold h-10" onClick={() => handleSave({ pan_number: pan }, { pan })}>
              {t('finance.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. BANK EDIT DIALOG */}
      <Dialog open={activeModal === 'bank'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-sm text-foreground">Bank Account details update karein</DialogTitle>
            <DialogDescription className="text-xs">
              Enter details for receiving your payouts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label htmlFor="bName" className="text-[10px] font-semibold">{t('finance.bank_name')}</Label>
              <Input id="bName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="State Bank of India" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bAcc" className="text-[10px] font-semibold">{t('finance.ac_no')}</Label>
              <Input id="bAcc" value={bankAcc} onChange={(e) => setBankAcc(e.target.value.replace(/\D/g, ''))} placeholder="3294829381" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bIfsc" className="text-[10px] font-semibold">{t('finance.ifsc')}</Label>
              <Input id="bIfsc" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} placeholder="SBIN0004928" maxLength={11} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bHolder" className="text-[10px] font-semibold">{t('finance.holder')}</Label>
              <Input id="bHolder" value={bankHolder} onChange={(e) => setBankHolder(e.target.value)} placeholder="Full Name" />
            </div>
            <Button className="w-full text-xs font-semibold h-10 mt-2" onClick={() => handleSave({
              bank_name: bankName,
              bank_account_number: bankAcc,
              bank_ifsc: bankIfsc,
              bank_account_name: bankHolder
            }, { bankName, bankAcc, bankIfsc, bankHolder })}>
              {t('finance.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. PAYMENT EDIT DIALOG */}
      <Dialog open={activeModal === 'payment'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-sm text-foreground">Bhugtan Vikalp Parivartan</DialogTitle>
            <DialogDescription className="text-xs">
              Select your preferred payout schedule method.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <div 
                onClick={() => setPaymentMode('Bank Transfer')}
                className={`border p-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  paymentMode === 'Bank Transfer' ? 'border-primary bg-primary/5 text-primary' : 'bg-card hover:bg-muted/30'
                }`}
              >
                Direct Bank Transfer (NEFT/RTGS)
              </div>
              <div 
                onClick={() => setPaymentMode('UPI Transfer')}
                className={`border p-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  paymentMode === 'UPI Transfer' ? 'border-primary bg-primary/5 text-primary' : 'bg-card hover:bg-muted/30'
                }`}
              >
                UPI Payouts (Instant)
              </div>
            </div>
            <Button className="w-full text-xs font-semibold h-10 mt-2" onClick={() => handleSave({}, { paymentMode })}>
              {t('finance.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. PERSONAL EDIT DIALOG */}
      <Dialog open={activeModal === 'personal'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-sm text-foreground">Personal Details update karein</DialogTitle>
            <DialogDescription className="text-xs">
              Update Date of Birth & gender details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label htmlFor="dobInput" className="text-xs font-semibold">Date of Birth</Label>
              <Input id="dobInput" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold block mb-1">Gender</Label>
              <div className="flex gap-2">
                {['Male', 'Female', 'Other'].map((g) => (
                  <Button 
                    key={g}
                    type="button" 
                    variant={gender === g ? 'default' : 'outline'} 
                    className="flex-1 text-xs h-9 rounded-lg"
                    onClick={() => setGender(g)}
                  >
                    {g}
                  </Button>
                ))}
              </div>
            </div>
            <Button className="w-full text-xs font-semibold h-10 mt-2" onClick={() => handleSave({ date_of_birth: dob }, { dob, gender })}>
              {t('finance.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
