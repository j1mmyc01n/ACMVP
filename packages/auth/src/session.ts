import { supabase } from '@acmvp/database';
import type { Session } from '@acmvp/types';

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  const s = data.session;
  if (!s) return null;
  return {
    userId: s.user.id,
    email: s.user.email ?? '',
    role: (s.user.user_metadata?.role ?? 'user') as Session['role'],
    expiresAt: new Date(s.expires_at! * 1000).toISOString(),
  };
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function onAuthChange(
  callback: (event: string, session: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange((event, s) => {
    const mapped: Session | null = s
      ? {
          userId: s.user.id,
          email: s.user.email ?? '',
          role: (s.user.user_metadata?.role ?? 'user') as Session['role'],
          expiresAt: new Date(s.expires_at! * 1000).toISOString(),
        }
      : null;
    callback(event, mapped);
  });
}
