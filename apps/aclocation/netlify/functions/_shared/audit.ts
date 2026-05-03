import { db } from './db.js'
import type { AuthedUser } from './auth.js'

export type AuditEntry = {
  locationId: string | null
  actor: AuthedUser | null
  action: string
  entityType?: string | null
  entityId?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * Append a row to `audit_log`. Audit writes never throw — a logging failure
 * must not break the user-facing operation that triggered it.
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await db().sql`
      INSERT INTO audit_log (location_id, actor_id, actor_email, action, entity_type, entity_id, metadata)
      VALUES (
        ${entry.locationId},
        ${entry.actor?.id ?? null},
        ${entry.actor?.email ?? null},
        ${entry.action},
        ${entry.entityType ?? null},
        ${entry.entityId ?? null},
        ${JSON.stringify(entry.metadata ?? {})}::jsonb
      )
    `
  } catch (err) {
    console.warn('[audit] failed to write audit row', err)
  }
}
