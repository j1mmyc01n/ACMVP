import { createClient } from '@supabase/supabase-js';

// Hardcoded fallbacks for the project these tables live in. The anon key is a
// public-by-design JWT — safe to ship in client bundles.
const DEFAULT_SUPABASE_URL = 'https://amfikpnctfgesifwdkkd.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZmlrcG5jdGZnZXNpZndka2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjQyMDAsImV4cCI6MjA5MjYwMDIwMH0.z6Cy-Nhts3F-mTrqK66P0Tz8D7AiaLcicq7hgQr1T0M';

// Only accept a Supabase project URL. If the env var was misconfigured (e.g.
// pointed at the Netlify site), fall back so requests don't get routed into
// the SPA and return an HTML 404 page instead of JSON.
const isSupabaseHost = (raw) => {
  if (!raw || typeof raw !== 'string') return false;
  try {
    const u = new URL(raw);
    return /\.supabase\.(co|in)$/i.test(u.hostname);
  } catch {
    return false;
  }
};

const RAW_URL = import.meta.env.VITE_SUPABASE_URL;
const RAW_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_URL = isSupabaseHost(RAW_URL)
  ? RAW_URL.replace(/\/+$/, '')
  : DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY = RAW_KEY || DEFAULT_SUPABASE_ANON_KEY;

if (RAW_URL && !isSupabaseHost(RAW_URL) && typeof console !== 'undefined') {
  console.warn(
    `[supabase] VITE_SUPABASE_URL ("${RAW_URL}") is not a Supabase host; falling back to ${DEFAULT_SUPABASE_URL}`,
  );
}

const storage = typeof window !== 'undefined' ? window.localStorage : undefined;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage,
  },
});

export default supabase;
