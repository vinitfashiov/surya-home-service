import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://zgzwnbvpfebdphnajsua.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenduYnZwZmViZHBobmFqc3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjY1MDUsImV4cCI6MjA5MjgwMjUwNX0.jk0RIbcSF-Pi0m5wvwcyZTlwY4RitAt5UQu4JI2xr5I";

// ── Session Isolation ──
// Each panel (admin, provider, customer) gets its own localStorage key
// so logging in as admin does NOT wipe the provider session and vice versa.
const STORAGE_KEY = (() => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return 'sb-surya-admin';
    if (path.startsWith('/provider')) return 'sb-surya-provider';
  }
  return 'sb-surya-customer';
})();

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    storageKey: STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
  }
});