import { db } from './db.js';
/**
 * Increment the per-location request counter. Called from a route's handler
 * to drive billing and quota enforcement. Failure is non-fatal.
 */
export async function recordUsage(locationId, route, billableUnits = 1) {
    try {
        await db().sql `
      INSERT INTO location_api_usage (location_id, route, units, occurred_at)
      VALUES (${locationId}, ${route}, ${billableUnits}, NOW())
    `;
    }
    catch (err) {
        console.warn('[usage] failed to record', err);
    }
}
//# sourceMappingURL=usage.js.map