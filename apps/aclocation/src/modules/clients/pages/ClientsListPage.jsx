import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clientsApi } from '../lib/api.js'
import { Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Field, Input } from '../../../core/ui/index.js'
import { ClientCreateForm } from '../components/ClientCreateForm.jsx'

export function ClientsListPage() {
  const [q, setQ] = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  async function refresh(query = '') {
    setLoading(true)
    try {
      const data = await clientsApi.list(query)
      setClients(data.clients ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Clients</h1>
        <Button onClick={() => setShowCreate((s) => !s)}>{showCreate ? 'Close' : 'New client'}</Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>New client</CardTitle>
          </CardHeader>
          <CardBody>
            <ClientCreateForm
              onCreated={() => {
                setShowCreate(false)
                refresh(q)
              }}
            />
          </CardBody>
        </Card>
      )}

      <form
        className="max-w-sm"
        onSubmit={(e) => {
          e.preventDefault()
          refresh(q)
        }}
      >
        <Field label="Search">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name…" />
        </Field>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : clients.length === 0 ? (
        <EmptyState title="No clients yet" description="Create your first client record to get started." />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{c.full_name}</td>
                  <td className="px-4 py-2 text-slate-600">{c.email ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600">{c.status}</td>
                  <td className="px-4 py-2 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <Link to={`/clients/${c.id}`} className="text-sm text-brand-600 hover:underline">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
