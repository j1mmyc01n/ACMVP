// GET /.netlify/functions/locations-list — master_admin or super_admin.
// Full directory of locations across the platform with health, billing, and
// rollout-config snapshot (modules, branding, database mode).
import { handler, json } from '../_shared/response.js';
import { requireRole } from '../_shared/auth.js';
import { db } from '../_shared/db.js';
export default handler(async () => {
    await requireRole(['super_admin', 'master_admin']);
    const rows = await db().sql `
    SELECT
      l.id, l.slug, l.name, l.status, l.plan_tier, l.netlify_url, l.netlify_site_id,
      l.created_at, l.admin_email,
      l.branding, l.enabled_modules,
      l.database_mode, l.database_status, l.database_provider,
      b.invoice_status, b.monthly_credit_limit,
      (SELECT MAX(checked_at) FROM location_health_checks WHERE location_id = l.id) AS last_health_at,
      (SELECT netlify_status   FROM location_health_checks WHERE location_id = l.id ORDER BY checked_at DESC LIMIT 1) AS netlify_status,
      (SELECT database_status  FROM location_health_checks WHERE location_id = l.id ORDER BY checked_at DESC LIMIT 1) AS db_health_status
    FROM locations l
    LEFT JOIN location_billing b ON b.location_id = l.id
    ORDER BY l.created_at DESC
  `;
    return json({ locations: rows });
});
//# sourceMappingURL=index.mjs.map