// ─── Supabase client singleton ────────────────────────────────────────────────
// This is the ONLY place a Supabase client is created for the entire platform.
// All packages, apps, and modules must import `supabase` from here.
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@acmvp/config';
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
export { SUPABASE_URL, SUPABASE_ANON_KEY };
//# sourceMappingURL=client.js.map