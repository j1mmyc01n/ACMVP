import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://amfikpnctfgesifwdkkd.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZmlrcG5jdGZnZXNpZndka2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMjQyMDAsImV4cCI6MjA5MjYwMDIwMH0.z6Cy-Nhts3F-mTrqK66P0Tz8D7AiaLcicq7hgQr1T0M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,   // ← ADDED: handles magic link redirects
    storage: window.localStorage, // ← ADDED: ensures session persists on mobile
  }
});

export default supabase;
