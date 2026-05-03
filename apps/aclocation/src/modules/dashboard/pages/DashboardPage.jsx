import { useEffect, useState } from 'react'
import { useAuth } from '../../../core/auth/index.js'
import { useTenant } from '../../../core/tenancy/index.js'
import { api } from '../../../core/api/index.js'
import { Card, CardBody, CardHeader, CardTitle, Badge, EmptyState } from '../../../core/ui/index.js'

export function DashboardPage() {
  const { user, roles } = useAuth()
  const { active } = useTenant()
  const [billing, setBilling] = useState(null)
  const [crisisOpen, setCrisisOpen] = useState(0)
  const [pendingCrn, setPendingCrn] = useState(0)

  useEffect(() => {
    if (!active) return
    Promise.allSettled([
      api.get('/billing-summary'),
      api.get('/crisis-list?status=open'),
      api.get('/crn-list?status=pending'),
    ]).then(([b, c, r]) => {
      if (b.status === 'fulfilled') setBilling(b.value)
      if (c.status === 'fulfilled') setCrisisOpen(c.value.events?.length ?? 0)
      if (r.status === 'fulfilled') setPendingCrn(r.value.requests?.length ?? 0)
    })
  }, [active?.id])

  if (!active) {
    return (
      <EmptyState
        title="No location selected"
        description="A super-admin must add you to a location before you can use the workspace."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Welcome back, {user?.user_metadata?.full_name ?? user?.email}.</p>
        <h1 className="text-2xl font-semibold text-slate-900">{active.name}</h1>
        <div className="mt-1 flex items-center gap-2">
          <Badge tone="blue">{active.plan_tier ?? 'starter'}</Badge>
          <span className="text-xs text-slate-500">{roles.join(', ') || 'no roles'}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Open crises</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{crisisOpen}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending CRN requests</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{pendingCrn}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Month-to-date usage</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-3xl font-semibold text-slate-900">{billing?.monthToDateUnits ?? 0}</p>
            <p className="text-xs text-slate-500">
              of {billing?.billing?.monthly_credit_limit ?? '—'} unit limit
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
