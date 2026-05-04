import type { UserRole } from '@acmvp/types';
import { signOut } from '../session';
export declare function useAuth(): {
    signOut: typeof signOut;
    isAuthenticated: boolean;
    userId: string | null;
    email: string | null;
    role: UserRole | null;
    loading: boolean;
};
//# sourceMappingURL=useAuth.d.ts.map