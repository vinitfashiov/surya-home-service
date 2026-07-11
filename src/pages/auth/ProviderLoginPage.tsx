import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Building2, Phone, ShieldCheck, ArrowRight, RotateCw, Sparkles
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function ProviderLoginPage() {
  const { sendOtp, verifyOtp, signOut } = useAuthContext();
  const navigate = useNavigate();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [phoneError, setPhoneError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }
    setPhoneError('');
    setLoading(true);
    const { error } = await sendOtp(clean);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`OTP sent to +91 ${phone}`);
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
    const clean = phone.replace(/\D/g, '');
    setLoading(true);
    const { error } = await verifyOtp({ phone: clean, otp });

    if (error) {
      setLoading(false);
      toast.error(error);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      return;
    }

    // Check partner role
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('Session not initialized');
        setLoading(false);
        return;
      }

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const roles = userRoles?.map(r => r.role) || [];
      const isAuthorized =
        roles.includes('provider') ||
        roles.includes('provider_employee') ||
        roles.includes('admin');

      if (!isAuthorized) {
        toast.error('This account is a customer account. Please register as a partner.');
        await signOut();
        setLoading(false);
        return;
      }

      toast.success('Welcome to Partner Portal! 🚀');
      navigate('/provider');
    } catch (err: any) {
      toast.error(err.message || 'Verification error');
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setLoading(true);
    const { error } = await sendOtp(phone.replace(/\D/g, ''));
    setLoading(false);
    if (error) toast.error(error);
    else { toast.success('OTP resent!'); setCountdown(RESEND_COOLDOWN); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />

      <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 relative z-10 w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-foreground tracking-tight flex items-center justify-center gap-2">
            Surya Partner <Sparkles className="h-5 w-5 text-primary fill-primary animate-pulse" />
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-[280px] mx-auto">
            Manage your jobs, bookings, and team in one powerful app.
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6 p-1 bg-muted/60 rounded-xl">
            <TabsTrigger value="signin" className="rounded-lg py-2.5 font-medium">Sign In</TabsTrigger>
            <TabsTrigger value="apply" className="rounded-lg py-2.5 font-medium">Apply Now</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="focus-visible:outline-none">
            <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/60 space-y-5">
              {step === 'phone' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="partner-phone">Partner Mobile Number</Label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-sm font-semibold text-foreground/60 select-none">+91</span>
                      <Input
                        id="partner-phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder="9876543210"
                        value={phone}
                        onChange={e => {
                          setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                          if (phoneError) setPhoneError('');
                        }}
                        onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                        className="pl-12 h-11 bg-muted/30 text-lg tracking-wider"
                        autoFocus
                      />
                    </div>
                    {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                  </div>

                  <Button onClick={handleSendOtp} className="w-full h-11 font-semibold" disabled={loading}>
                    {loading
                      ? <span className="flex items-center gap-2"><RotateCw className="h-4 w-4 animate-spin" /> Sending OTP...</span>
                      : <span className="flex items-center gap-2">Get OTP <ArrowRight className="h-4 w-4" /></span>
                    }
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <Label>Enter 6-digit OTP</Label>
                    <p className="text-sm text-muted-foreground">Sent to +91 {phone}</p>
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
                      : <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Verify & Login</span>
                    }
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      onClick={() => { setStep('phone'); setOtpDigits(Array(OTP_LENGTH).fill('')); }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Change number
                    </button>
                    <button
                      onClick={handleResend}
                      disabled={countdown > 0}
                      className={`font-medium ${countdown > 0 ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-primary hover:underline'}`}
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="apply" className="focus-visible:outline-none">
            <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/60 space-y-6">
              <h2 className="text-lg font-heading font-bold text-foreground">Why join Surya Home Service?</h2>
              <div className="space-y-4">
                {[
                  { title: 'Grow Your Income', desc: 'Direct bookings from verified local customers with low platform commissions.' },
                  { title: 'Complete Control', desc: 'Define your zones, services, pricing, and timing directly from the app.' },
                  { title: 'Serviceman Dispatcher', desc: 'Add staff members, allocate jobs, and track live booking status instantly.' },
                ].map(item => (
                  <div key={item.title} className="flex gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={() => navigate('/provider-signup')} className="w-full h-11 font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-primary/10">
                Start Partner Registration <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-8 text-xs text-muted-foreground/60">
          Need help? Contact <span className="font-semibold text-primary">support@suryahomeservice.in</span>
        </div>
      </div>
    </div>
  );
}
