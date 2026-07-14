import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: string[];
  sendOtp: (phone: string) => Promise<{ error: string | null }>;
  verifyOtp: (params: VerifyOtpParams) => Promise<{ error: string | null; isNewUser?: boolean }>;
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
  // ── FIX: separate rolesLoading so ProtectedRoute waits for BOTH user AND roles ──
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);

  // Combined loading: true while auth OR roles are still fetching
  const isLoading = loading || rolesLoading;

  const fetchRoles = async (userId: string) => {
    setRolesLoading(true);
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      if (data) {
        setRoles(data.map((r: any) => r.role));
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    // Fallback timeout — in case Supabase is unreachable
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setRolesLoading(false);
    }, 5000);

    // getSession first for initial load (handles refresh correctly)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      clearTimeout(timeoutId);
      if (session?.user) {
        fetchRoles(session.user.id);
      } else {
        setRoles([]);
        setRolesLoading(false);
      }
    }).catch(err => {
      console.error('Session fetch failed:', err);
      setLoading(false);
      setRolesLoading(false);
      clearTimeout(timeoutId);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
      } else {
        setRoles([]);
        setRolesLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

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
        data: { full_name: fullName, role: role || 'customer' },
        emailRedirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setUser(null);
    setSession(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, session, loading: isLoading, roles, sendOtp, verifyOtp, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
}
