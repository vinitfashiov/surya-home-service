import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Building2, Phone, User, MapPin, ShieldCheck, ArrowRight, RotateCw, CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ProviderDocuments from '@/components/provider/ProviderDocuments';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function ProviderSignupPage() {
  const { sendOtp, verifyOtp } = useAuthContext();
  const navigate = useNavigate();
  const { data: cities = [] } = useCities();

  const [step, setStep] = useState<'details' | 'otp' | 'documents' | 'success'>('details');
  const [providerId, setProviderId] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    companyName: '',
    address: '',
    cityId: '',
  });
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2)
      errs.fullName = 'Enter your full name';
    const clean = form.phone.replace(/\D/g, '');
    if (clean.length !== 10) errs.phone = 'Enter a valid 10-digit mobile number';
    if (!form.companyName.trim() || form.companyName.trim().length < 2)
      errs.companyName = 'Enter your company or business name';
    if (!form.address.trim() || form.address.trim().length < 5)
      errs.address = 'Enter your full business address';
    if (!form.cityId) errs.cityId = 'Select your city';
    return errs;
  };

  const handleSendOtp = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    const { error } = await sendOtp(form.phone.replace(/\D/g, ''));
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`OTP sent to +91 ${form.phone}`);
      setStep('otp');
      setCountdown(RESEND_COOLDOWN);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digits = [...otpDigits];
    digits[index] = value.slice(-1);
    setOtpDigits(digits);
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (digits.every(d => d) && digits.join('').length === OTP_LENGTH) {
      handleVerifyOtp(digits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      setTimeout(() => handleVerifyOtp(pasted), 50);
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const otp = otpValue || otpDigits.join('');
    if (otp.length !== OTP_LENGTH) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    const { error } = await verifyOtp({
      phone: form.phone.replace(/\D/g, ''),
      otp,
      full_name: form.fullName.trim(),
      role: 'provider',
      company_name: form.companyName.trim(),
      city_id: form.cityId,
      address: form.address.trim(),
    });
    setLoading(false);
    if (error) {
      toast.error(error);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } else {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: prov } = await supabase
            .from('providers')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (prov) {
            setProviderId(prov.id);
            setStep('documents');
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch provider ID:', err);
      }
      setStep('success');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setLoading(true);
    const { error } = await sendOtp(form.phone.replace(/\D/g, ''));
    setLoading(false);
    if (error) toast.error(error);
    else { toast.success('OTP resent!'); setCountdown(RESEND_COOLDOWN); }
  };

  // ─── Documents Screen ───
  if (step === 'documents') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl space-y-6">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Upload Verification Documents</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Please upload verification documents for your company to complete the registration.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card border space-y-5">
            {providerId ? (
              <ProviderDocuments providerId={providerId} />
            ) : (
              <p className="text-center py-4 text-muted-foreground">Initializing provider details...</p>
            )}

            <div className="pt-4 border-t flex justify-end">
              <Button onClick={() => setStep('success')} className="gap-2 font-semibold">
                Submit Application <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success Screen ───
  if (step === 'success') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <div className="bg-card rounded-2xl p-10 shadow-card border space-y-5">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Application Submitted!</h1>
            <p className="text-muted-foreground">
              Your partner account for{' '}
              <span className="font-semibold text-foreground">{form.companyName}</span> is under review.
              You'll be notified once the admin approves your application.
            </p>
            <Button onClick={() => navigate('/provider/login')} className="w-full">
              Go to Partner Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {step === 'details' ? 'Register as Partner' : 'Verify your number'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {step === 'details' ? 'Start offering your services on our platform' : `OTP sent to +91 ${form.phone}`}
          </p>
        </div>

        {step === 'details' ? (
          <form
            onSubmit={e => { e.preventDefault(); handleSendOtp(); }}
            className="bg-card rounded-2xl p-8 shadow-card border space-y-5"
          >
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal Details</h2>

            <div className="space-y-2">
              <Label>Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rahul Sharma"
                  value={form.fullName}
                  onChange={e => update('fullName', e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm font-semibold text-foreground/60 select-none">+91</span>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="pl-12 text-lg tracking-wider"
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            <div className="border-t pt-5">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Business Details</h2>
            </div>

            <div className="space-y-2">
              <Label>Company / Business Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sharma Home Services"
                  value={form.companyName}
                  onChange={e => update('companyName', e.target.value)}
                  className="pl-10"
                />
              </div>
              {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Select value={form.cityId} onValueChange={v => update('cityId', v)}>
                <SelectTrigger><SelectValue placeholder="Select your city" /></SelectTrigger>
                <SelectContent>
                  {(cities as any[]).filter(c => c.is_active).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cityId && <p className="text-xs text-destructive">{errors.cityId}</p>}
            </div>

            <div className="space-y-2">
              <Label>Business Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  placeholder="Full business address..."
                  value={form.address}
                  onChange={e => update('address', e.target.value)}
                  className="pl-10 min-h-[70px]"
                />
              </div>
              {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              ⏳ After registration, your account will be reviewed by an admin. You'll be notified once approved.
            </div>

            <Button type="submit" className="w-full h-12 font-semibold" disabled={loading}>
              {loading
                ? <span className="flex items-center gap-2"><RotateCw className="h-4 w-4 animate-spin" /> Sending OTP...</span>
                : <span className="flex items-center gap-2">Send OTP to Verify <ArrowRight className="h-4 w-4" /></span>
              }
            </Button>
          </form>
        ) : (
          <div className="bg-card rounded-2xl p-8 shadow-card border space-y-5">
            <div className="space-y-3">
              <Label>Enter 6-digit OTP</Label>
              <p className="text-sm text-muted-foreground">Sent to +91 {form.phone}</p>
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpInput(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-border bg-muted/30 focus:border-primary focus:outline-none focus:ring-0 transition-colors"
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">OTP valid for 10 minutes</p>
            </div>

            <Button
              onClick={() => handleVerifyOtp()}
              className="w-full h-12 font-semibold"
              disabled={loading || otpDigits.some(d => !d)}
            >
              {loading
                ? <span className="flex items-center gap-2"><RotateCw className="h-4 w-4 animate-spin" /> Submitting...</span>
                : <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Verify & Submit Application</span>
              }
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => { setStep('details'); setOtpDigits(Array(OTP_LENGTH).fill('')); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Go back
              </button>
              <button
                onClick={handleResend}
                disabled={countdown > 0}
                className={`font-medium ${countdown > 0 ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-primary hover:underline'}`}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
