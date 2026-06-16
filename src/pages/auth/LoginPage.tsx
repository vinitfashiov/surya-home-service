import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Phone, ShieldCheck, ArrowRight, RotateCw } from 'lucide-react';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function LoginPage() {
  const { sendOtp, verifyOtp } = useAuthContext();
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

  const validatePhone = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length !== 10) return 'Please enter a valid 10-digit mobile number';
    return '';
  };

  const handleSendOtp = async () => {
    const err = validatePhone(phone);
    if (err) { setPhoneError(err); return; }
    setPhoneError('');
    setLoading(true);
    const { error } = await sendOtp(phone.replace(/\D/g, ''));
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
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all filled
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
    const { error } = await verifyOtp({ phone: phone.replace(/\D/g, ''), otp });
    setLoading(false);
    if (error) {
      toast.error(error);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } else {
      toast.success('Welcome to ServisGo! 🎉');
      navigate('/');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setLoading(true);
    const { error } = await sendOtp(phone.replace(/\D/g, ''));
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('OTP resent!');
      setCountdown(RESEND_COOLDOWN);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Phone className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {step === 'phone' ? 'Welcome to ServisGo' : 'Verify your number'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {step === 'phone'
              ? 'Enter your mobile number to continue'
              : `OTP sent to +91 ${phone}`}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-card border space-y-5">
          {step === 'phone' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-sm font-semibold text-foreground/60 select-none pointer-events-none">+91</span>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="9876543210"
                    value={phone}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(val);
                      if (phoneError) setPhoneError('');
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    className="pl-12 h-12 text-lg tracking-wider"
                    autoComplete="tel"
                    autoFocus
                  />
                </div>
                {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
              </div>

              <Button onClick={handleSendOtp} className="w-full h-12 text-base font-semibold" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2"><RotateCw className="h-4 w-4 animate-spin" /> Sending OTP...</span>
                ) : (
                  <span className="flex items-center gap-2">Get OTP <ArrowRight className="h-4 w-4" /></span>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                New user?{' '}
                <Link to="/signup" className="text-primary font-medium hover:underline">Create account</Link>
              </p>
            </>
          ) : (
            <>
              {/* OTP Input Boxes */}
              <div className="space-y-3">
                <Label>Enter 6-digit OTP</Label>
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
                <p className="text-xs text-muted-foreground text-center">
                  OTP valid for 10 minutes
                </p>
              </div>

              <Button
                onClick={() => handleVerifyOtp()}
                className="w-full h-12 text-base font-semibold"
                disabled={loading || otpDigits.some(d => !d)}
              >
                {loading ? (
                  <span className="flex items-center gap-2"><RotateCw className="h-4 w-4 animate-spin" /> Verifying...</span>
                ) : (
                  <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Verify & Login</span>
                )}
              </Button>

              {/* Resend + Change number */}
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
                  className={`font-medium transition-colors ${countdown > 0 ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-primary hover:underline'}`}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="hover:text-primary">Terms</Link> &{' '}
          <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
