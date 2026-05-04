import type { UserRole } from '@acmvp/types';
interface LoginFormProps {
    type?: 'admin' | 'sysadmin';
    onLogin: (role: UserRole, email: string) => void;
    onCancel: () => void;
}
export declare function LoginForm({ type, onLogin, onCancel }: LoginFormProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=LoginForm.d.ts.map