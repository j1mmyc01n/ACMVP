import { useEffect, useState } from 'react'
import { api } from '../../../core/api/index.js'
import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState } from '../../../core/ui/index.js'

export function BillingPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/billing-summary')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>
  if (!data?.billing) return <EmptyState title="Billing not configured" description="A super-admin must set up your plan first." />

  const b = data.billing
  const overLimit = (data.monthToDateUnits ?? 0) > (b.monthly_credit_limit ?? 0)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Billing</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-semibold text-slate-900 capitalize">{b.plan_tier}</p>
            <p className="mt-1 text-xs text-slate-500">Invoice: {b.invoice_status}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Month to date</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-semibold text-slate-900">{data.monthToDateUnits}</p>
            <p className="mt-1 text-xs text-slate-500">of {b.monthly_credit_limit} unit limit</p>
            {overLimit && (
              <Badge tone="red" className="mt-2">
                Over limit
              </Badge>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Add-ons</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-1 text-sm text-slate-700">
              <li>AI: ${b.ai_addon_fee}</li>
              <li>Field agent: ${b.field_agent_addon_fee}</li>
              <li>Push notifications: ${b.push_notification_fee}</li>
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily usage (last 30 days)</CardTitle>
        </CardHeader>
        <CardBody>
          <DailyUsageChart series={data.dailyUsage ?? []} />
        </CardBody>
      </Card>
    </div>
  )
}

function DailyUsageChart({ series }) {
  if (series.length === 0) return <p className="text-sm text-slate-500">No usage recorded yet.</p>
  const max = Math.max(...series.map((s) => s.total_units), 1)
  return (
    <div className="flex items-end gap-1 h-24">
      {series.map((s) => (
        <div key={s.day} className="flex-1 flex flex-col items-center gap-1">
          <div className="bg-brand-500 w-full rounded-t" style={{ height: `${(s.total_units / max) * 100}%` }} />
          <span className="text-[10px] text-slate-400">
            {new Date(s.day).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
          </span>
        </div>
      ))}
    </div>
  )
}
