import { supabase } from '@acmvp/database';
export async function getSession() {
    const { data } = await supabase.auth.getSession();
    const s = data.session;
    if (!s)
        return null;
    return {
        userId: s.user.id,
        email: s.user.email ?? '',
        role: (s.user.user_metadata?.role ?? 'user'),
        expiresAt: new Date(s.expires_at * 1000).toISOString(),
    };
}
export async function signOut() {
    return supabase.auth.signOut();
}
export function onAuthChange(callback) {
    return supabase.auth.onAuthStateChange((event, s) => {
        const mapped = s
            ? {
                userId: s.user.id,
                email: s.user.email ?? '',
                role: (s.user.user_metadata?.role ?? 'user'),
                expiresAt: new Date(s.expires_at * 1000).toISOString(),
            }
            : null;
        callback(event, mapped);
    });
}
//# sourceMappingURL=session.js.map