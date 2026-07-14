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
import { Building2, Phone, User, MapPin, ShieldCheck, ArrowRight, RotateCw, Sparkles } from 'lucide-react';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function ProviderSignupPage() {
  const { sendOtp, verifyOtp } = useAuthContext();
  const navigate = useNavigate();
  const { data: cities = [] } = useCities();

  const [step, setStep] = useState<'details' | 'otp'>('details');
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
      toast.success('Account created! Now complete your profile setup.');
      // Go to the dedicated onboarding wizard page (not inside dashboard)
      navigate('/provider/onboarding');
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

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />

      <div className="flex-1 flex flex-col justify-center items-center px-4 py-10 relative z-10 w-full max-w-lg mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground tracking-tight flex items-center justify-center gap-2">
            Join as Partner <Sparkles className="h-5 w-5 text-primary fill-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-[280px] mx-auto">
            {step === 'details'
              ? 'Create your partner account and start getting bookings'
              : `Enter the OTP sent to +91 ${form.phone}`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 text-xs font-medium">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${step === 'details' ? 'bg-primary text-primary-foreground' : 'bg-emerald-500 text-white'}`}>
            {step === 'otp' ? '✓' : '1'} Basic Info
          </div>
          <div className="h-px w-6 bg-border" />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${step === 'otp' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            2 Verify OTP
          </div>
          <div className="h-px w-6 bg-border" />
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
            3 Setup Profile
          </div>
        </div>

        {step === 'details' ? (
          <form
            onSubmit={e => { e.preventDefault(); handleSendOtp(); }}
            className="bg-card rounded-2xl p-6 shadow-xl border border-border/60 space-y-4 w-full"
          >
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  placeholder="Rahul Sharma"
                  value={form.fullName}
                  onChange={e => update('fullName', e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile Number</Label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm font-semibold text-foreground/60 select-none">+91</span>
                <Input
                  id="phone"
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

            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Business Details</p>
            </div>

            {/* Company Name */}
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company / Business Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="companyName"
                  placeholder="Sharma Home Services"
                  value={form.companyName}
                  onChange={e => update('companyName', e.target.value)}
                  className="pl-9"
                />
              </div>
              {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <Label>Service City</Label>
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

            {/* Address (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="address">Business Address <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  placeholder="Full business address..."
                  value={form.address}
                  onChange={e => update('address', e.target.value)}
                  className="pl-9 min-h-[60px] resize-none"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              ⏳ After registration, your account will be reviewed by admin. You'll be notified once approved.
            </div>

            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading
                ? <span className="flex items-center gap-2"><RotateCw className="h-4 w-4 animate-spin" /> Sending OTP...</span>
                : <span className="flex items-center gap-2">Get OTP <ArrowRight className="h-4 w-4" /></span>
              }
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already a partner?{' '}
              <button type="button" onClick={() => navigate('/provider/login')} className="text-primary font-semibold hover:underline">
                Sign In
              </button>
            </p>
          </form>
        ) : (
          <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/60 space-y-5 w-full">
            <div className="space-y-3">
              <Label>Enter 6-digit OTP</Label>
              <p className="text-sm text-muted-foreground">Sent to +91 {form.phone} · Use <strong>123456</strong> if SMS is delayed</p>
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
              className="w-full h-11 font-semibold"
              disabled={loading || otpDigits.some(d => !d)}
            >
              {loading
                ? <span className="flex items-center gap-2"><RotateCw className="h-4 w-4 animate-spin" /> Verifying...</span>
                : <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Verify & Continue</span>
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
