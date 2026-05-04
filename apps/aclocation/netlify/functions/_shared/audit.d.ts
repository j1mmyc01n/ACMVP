import type { AuthedUser } from './auth.js';
export type AuditEntry = {
    locationId: string | null;
    actor: AuthedUser | null;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Record<string, unknown> | null;
};
/**
 * Append a row to `audit_log`. Audit writes never throw — a logging failure
 * must not break the user-facing operation that triggered it.
 */
export declare function audit(entry: AuditEntry): Promise<void>;
//# sourceMappingURL=audit.d.ts.map