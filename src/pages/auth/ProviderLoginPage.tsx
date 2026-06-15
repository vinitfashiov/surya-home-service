import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, Building2, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export default function ProviderLoginPage() {
  const { signIn, signOut } = useAuthContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await signIn(result.data.email, result.data.password);

    if (error) {
      toast.error(error.message || 'Login failed');
      setLoading(false);
      return;
    }

    try {
      // Fetch user's current session & check roles immediately
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('Session not initialized');
        setLoading(false);
        return;
      }

      // Check roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const roles = userRoles?.map((r) => r.role) || [];
      const isAuthorized = roles.includes('provider') || roles.includes('provider_employee') || roles.includes('serviceman') || roles.includes('admin');

      if (!isAuthorized) {
        // Log out customer trying to enter provider portal
        toast.error('This account is a customer account. Please register as a partner to login.');
        await signOut();
        setLoading(false);
        return;
      }

      toast.success('Successfully logged in to Partner Portal!');
      if (roles.includes('serviceman') && !roles.includes('provider') && !roles.includes('admin')) {
        navigate('/serviceman');
      } else {
        navigate('/provider');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during verification');
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background gradients for premium feel */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />

      <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 relative z-10 w-full max-w-md mx-auto">
        
        {/* Logo / Header */}
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

        {/* Tab System for Login vs Apply */}
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6 p-1 bg-muted/60 rounded-xl">
            <TabsTrigger value="signin" className="rounded-lg py-2.5 font-medium">Sign In</TabsTrigger>
            <TabsTrigger value="apply" className="rounded-lg py-2.5 font-medium">Apply Now</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="focus-visible:outline-none">
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-xl border border-border/60 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Partner Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="partner@suryahome.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-muted/30 focus-visible:ring-1"
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-muted/30 focus-visible:ring-1"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full h-11 mt-2 text-sm font-semibold shadow-md shadow-primary/10" disabled={loading}>
                {loading ? 'Logging in...' : 'Sign In to Portal'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="apply" className="focus-visible:outline-none">
            <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/60 space-y-6">
              <h2 className="text-lg font-heading font-bold text-foreground">Why join Surya Home Service?</h2>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Grow Your Income</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Direct bookings from verified local customers with low platform commissions.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Complete Control</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Define your zones, services, pricing, and timing directly from the app.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Serviceman Dispatcher</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Add staff members, allocate jobs, and track live booking status instantly.</p>
                  </div>
                </div>
              </div>

              <Button onClick={() => navigate('/provider-signup')} className="w-full h-11 font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-primary/10">
                Start Partner Registration <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Support Footer */}
        <div className="text-center mt-8 text-xs text-muted-foreground/60">
          Need help? Contact our Partner Support Helpline at <span className="font-semibold text-primary">support@suryahomeservice.in</span>
        </div>
      </div>
    </div>
  );
}
