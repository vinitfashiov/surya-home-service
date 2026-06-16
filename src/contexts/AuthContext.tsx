import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: string[];
  // OTP-based auth (customer + provider)
  sendOtp: (phone: string) => Promise<{ error: string | null }>;
  verifyOtp: (params: VerifyOtpParams) => Promise<{ error: string | null; isNewUser?: boolean }>;
  // Email/password auth (admin only)
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role?: string) => Promise<{ data: { user: User | null }; error: any }>;
  signOut: () => Promise<void>;
}

interface VerifyOtpParams {
  phone: string;
  otp: string;
  full_name?: string;
  role?: string;
  company_name?: string;
  city_id?: string;
  address?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth initialization timed out - likely a network block');
        setLoading(false);
      }
    }, 3000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(timeoutId);

      if (session?.user) {
        setTimeout(() => fetchRoles(session.user.id), 0);
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(timeoutId);
      if (session?.user) {
        fetchRoles(session.user.id);
      }
    }).catch(err => {
      console.error('Session fetch failed:', err);
      setLoading(false);
      clearTimeout(timeoutId);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    if (data) {
      setRoles(data.map((r: any) => r.role));
    }
  };

  // ─── OTP: Send OTP via Fast2SMS (edge function) ───
  const sendOtp = async (phone: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone },
      });
      if (error) return { error: error.message || 'Failed to send OTP' };
      if (data?.error) return { error: data.error };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Network error. Please try again.' };
    }
  };

  // ─── OTP: Verify OTP and sign in / create user ───
  const verifyOtp = async (params: VerifyOtpParams): Promise<{ error: string | null; isNewUser?: boolean }> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: params,
      });

      if (error) return { error: error.message || 'OTP verification failed' };
      if (data?.error) return { error: data.error };

      const { token_hash, type, is_new_user } = data;

      // Use the token to sign in
      const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: type || 'email',
      });

      if (verifyError) {
        return { error: verifyError.message || 'Failed to create session' };
      }

      if (sessionData?.user) {
        await fetchRoles(sessionData.user.id);
      }

      return { error: null, isNewUser: is_new_user };
    } catch (err: any) {
      return { error: err.message || 'Verification failed. Please try again.' };
    }
  };

  // ─── Email/Password: Admin only ───
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role || 'customer'
        },
        emailRedirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Connecting to ServisGo...</p>
        <p className="text-[10px] text-muted-foreground/50 mt-8 max-w-[200px] text-center">
          If this takes too long, please check your internet or try a VPN.
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, roles, sendOtp, verifyOtp, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
}
