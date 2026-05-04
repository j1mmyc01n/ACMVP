import type { Session } from '@acmvp/types';
export declare function getSession(): Promise<Session | null>;
export declare function signOut(): Promise<{
    error: import("@supabase/auth-js").AuthError | null;
}>;
export declare function onAuthChange(callback: (event: string, session: Session | null) => void): {
    data: {
        subscription: import("@supabase/auth-js").Subscription;
    };
};
//# sourceMappingURL=session.d.ts.map