import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://akxcyibzrmqvbojwbfqz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreGN5aWJ6cm1xdmJvandiZnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMTc3ODMsImV4cCI6MjEwNTc5Mzc4M30.AuCBQmbPyjlZ7Hjz10Isi7l8Rgf0Rx7VxF2NR6eIS14";

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