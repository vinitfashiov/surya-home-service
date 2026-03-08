import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, Mail, Lock, User, Phone, MapPin, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { z } from 'zod';

const providerSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  confirmPassword: z.string(),
  companyName: z.string().trim().min(2, 'Company name is required').max(200),
  phone: z.string().trim().min(10, 'Valid phone number required').max(15),
  address: z.string().trim().min(5, 'Address is required').max(500),
  cityId: z.string().min(1, 'City is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function ProviderSignupPage() {
  const { signUp } = useAuthContext();
  const navigate = useNavigate();
  const { data: cities = [] } = useCities();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    companyName: '', phone: '', address: '', cityId: '',
  });

  const updateField = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = providerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      // 1. Create user account
      const { error: signUpError } = await signUp(form.email, form.password, form.fullName);
      if (signUpError) throw signUpError;

      // 2. Get the newly created user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Account created but unable to fetch user');

      // 3. Add provider role
      await supabase.from('user_roles').insert({ user_id: user.id, role: 'provider' as any });

      // 4. Create provider record (pending approval)
      const { error: providerError } = await supabase.from('providers').insert({
        user_id: user.id,
        company_name: form.companyName,
        owner_name: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city_id: form.cityId,
        status: 'pending',
      });
      if (providerError) throw providerError;

      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <div className="bg-card rounded-2xl p-10 shadow-card border space-y-5">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Application Submitted!</h1>
            <p className="text-muted-foreground">
              Your provider account for <span className="font-semibold text-foreground">{form.companyName}</span> is under review.
              You'll receive a notification once the admin approves your application.
            </p>
            <p className="text-sm text-muted-foreground">Please check your email to verify your account.</p>
            <Button onClick={() => navigate('/login')} className="w-full">Go to Login</Button>
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
          <h1 className="text-2xl font-heading font-bold text-foreground">Register as Provider</h1>
          <p className="text-muted-foreground mt-1">Start offering your services on our platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-card border space-y-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Account Details</h2>
          
          <div className="space-y-2">
            <Label>Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="John Doe" value={form.fullName} onChange={e => updateField('fullName', e.target.value)} className="pl-10" />
            </div>
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="you@company.com" value={form.email} onChange={e => updateField('email', e.target.value)} className="pl-10" />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => updateField('password', e.target.value)} className="pl-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} className="pl-10" />
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="border-t pt-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Company Details</h2>
          </div>

          <div className="space-y-2">
            <Label>Company Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Your Company Pvt Ltd" value={form.companyName} onChange={e => updateField('companyName', e.target.value)} className="pl-10" />
            </div>
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="+91 9876543210" value={form.phone} onChange={e => updateField('phone', e.target.value)} className="pl-10" />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Select value={form.cityId} onValueChange={v => updateField('cityId', v)}>
                <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>
                  {cities.filter((c: any) => c.is_active).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cityId && <p className="text-xs text-destructive">{errors.cityId}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Business Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea placeholder="Full business address..." value={form.address} onChange={e => updateField('address', e.target.value)} className="pl-10 min-h-[70px]" />
            </div>
            {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            ⏳ After registration, your account will be reviewed by an admin. You'll be notified once approved.
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting application...' : 'Submit Provider Application'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Want a customer account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">Sign up here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
