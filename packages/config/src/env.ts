// ─── Supabase environment config ─────────────────────────────────────────────
//
// This is the single source of truth for Supabase connection settings.
// All packages and apps must import from here — never instantiate a client
// with hardcoded URLs/keys directly.

const DEFAULT_SUPABASE_URL = 'https://amfikpnctfgesifwdkkd.supabase.co';
// The anon key is a public-by-design JWT — safe to ship in client bundles.
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZmlrcG5jdGZnZXNpZndka2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDgwMDAwMDAsImV4cCI6MjAyMzYwMDAwMH0.placeholder';

/**
 * Returns true only if the raw value is a valid Supabase project URL.
 * Guards against misconfiguration (e.g. Netlify site URL set by mistake).
 */
export function isSupabaseHost(raw: string | undefined): boolean {
  if (!raw || typeof raw !== 'string') return false;
  try {
    const u = new URL(raw);
    return /\.supabase\.(co|in)$/i.test(u.hostname);
  } catch {
    return false;
  }
}

const rawUrl =
  typeof import.meta !== 'undefined'
    ? (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL
    : process.env.VITE_SUPABASE_URL;

const rawKey =
  typeof import.meta !== 'undefined'
    ? (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY
    : process.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_URL: string = isSupabaseHost(rawUrl)
  ? rawUrl!.replace(/\/+$/, '')
  : DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY: string = rawKey || DEFAULT_SUPABASE_ANON_KEY;

if (rawUrl && !isSupabaseHost(rawUrl) && typeof console !== 'undefined') {
  console.warn(
    `[config] VITE_SUPABASE_URL ("${rawUrl}") is not a Supabase host; falling back to ${DEFAULT_SUPABASE_URL}`,
  );
}

// ─── Netlify function base URL ────────────────────────────────────────────────

export const NETLIFY_FUNCTIONS_BASE =
  typeof import.meta !== 'undefined'
    ? ((import.meta as { env?: Record<string, string> }).env?.VITE_FUNCTIONS_BASE ?? '/api')
    : '/api';
