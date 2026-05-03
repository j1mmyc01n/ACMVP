// GET /.netlify/functions/billing-summary
// Returns the active tenant's billing config + the last 30 days of usage,
// plus this-month total usage units.

import { handler, json } from '../_shared/response.js'
import { requireUser } from '../_shared/auth.js'
import { resolveTenant } from '../_shared/tenant.js'
import { db } from '../_shared/db.js'

export default handler(async (req) => {
  const user = await requireUser()
  const locationId = await resolveTenant(req, user)

  const [billing] = await db()
    .sql`SELECT plan_tier, monthly_credit_limit, credit_rate, ai_addon_fee,
                field_agent_addon_fee, push_notification_fee, invoice_status, due_at
         FROM location_billing WHERE location_id = ${locationId}`

  const monthly = await db()
    .sql`SELECT day, total_units FROM location_daily_usage
         WHERE location_id = ${locationId} AND day >= (CURRENT_DATE - INTERVAL '30 days')
         ORDER BY day ASC`

  const [thisMonth] = (await db()
    .sql`SELECT COALESCE(SUM(units), 0)::int AS total
         FROM location_api_usage
         WHERE location_id = ${locationId}
           AND occurred_at >= date_trunc('month', NOW())`) as { total: number }[]

  return json({ billing: billing ?? null, dailyUsage: monthly, monthToDateUnits: thisMonth.total })
})
