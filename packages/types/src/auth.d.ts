export type UserRole = 'user' | 'staff' | 'admin' | 'super_admin' | 'sysadmin' | 'field_agent' | 'client';
export interface Session {
    userId: string;
    email: string;
    role: UserRole;
    expiresAt: string;
}
export interface Permission {
    action: string;
    resource: string;
}
//# sourceMappingURL=auth.d.ts.map