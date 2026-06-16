import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, ShieldAlert, RotateCw } from 'lucide-react';

export default function AdminLoginPage() {
  const { signIn } = useAuthContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);

    if (error) {
      toast.error(error.message || 'Login failed');
      setLoading(false);
      return;
    }

    // Verify admin role
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

      if (!roles.includes('admin')) {
        // Not admin — sign them out
        await supabase.auth.signOut();
        toast.error('Access denied. This login is for administrators only.');
        setLoading(false);
        return;
      }

      toast.success('Welcome, Admin! 🔑');
      navigate('/admin');
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-background to-background" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-700 flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-foreground">Admin Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Surya Home Service — Secure Admin Access
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 border border-border/60 shadow-2xl space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@suryahome.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10 h-12"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 font-semibold text-base" disabled={loading}>
            {loading
              ? <span className="flex items-center gap-2"><RotateCw className="h-4 w-4 animate-spin" /> Signing in...</span>
              : <span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Sign In as Admin</span>
            }
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          🔒 This page is for authorized administrators only.
          <br />
          Customer / Partner login is at{' '}
          <a href="/login" className="text-primary hover:underline">ServisGo App</a>
        </p>
      </div>
    </div>
  );
}
