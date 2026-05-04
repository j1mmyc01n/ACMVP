// GET /.netlify/functions/field-agents-checkins
// Recent check-ins for the active tenant. Filter by agentId via query param.
import { handler, json } from '../_shared/response.js';
import { requireUser } from '../_shared/auth.js';
import { resolveTenant } from '../_shared/tenant.js';
import { recordUsage } from '../_shared/usage.js';
import { db } from '../_shared/db.js';
export default handler(async (req) => {
    const user = await requireUser();
    const locationId = await resolveTenant(req, user);
    await recordUsage(locationId, 'field-agents-checkins');
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agentId');
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200);
    const rows = agentId
        ? await db().sql `
        SELECT c.id, c.agent_id, c.client_id, c.kind, c.notes,
               c.latitude, c.longitude, c.occurred_at,
               a.full_name AS agent_name
        FROM field_agent_check_ins c
        JOIN field_agents a ON a.id = c.agent_id
        WHERE c.location_id = ${locationId} AND c.agent_id = ${agentId}
        ORDER BY c.occurred_at DESC
        LIMIT ${limit}
      `
        : await db().sql `
        SELECT c.id, c.agent_id, c.client_id, c.kind, c.notes,
               c.latitude, c.longitude, c.occurred_at,
               a.full_name AS agent_name
        FROM field_agent_check_ins c
        JOIN field_agents a ON a.id = c.agent_id
        WHERE c.location_id = ${locationId}
        ORDER BY c.occurred_at DESC
        LIMIT ${limit}
      `;
    return json({ checkIns: rows });
});
//# sourceMappingURL=index.mjs.map