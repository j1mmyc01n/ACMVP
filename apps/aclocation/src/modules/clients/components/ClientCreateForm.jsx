import { useState } from 'react'
import { clientsApi } from '../lib/api.js'
import { Button, Field, Input } from '../../../core/ui/index.js'

export function ClientCreateForm({ onCreated }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await clientsApi.create({
        fullName,
        email: email || null,
        phone: phone || null,
        dateOfBirth: dob || null,
      })
      onCreated?.()
    } catch (err) {
      setError(err?.payload?.error ?? err.message ?? 'Could not save client.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
      {error && <p className="sm:col-span-2 text-sm text-rose-600" role="alert">{error}</p>}
      <Field label="Full name" htmlFor="full_name" required>
        <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
      </Field>
      <Field label="Date of birth" htmlFor="dob">
        <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} autoComplete="bday" />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </Field>
      <Field label="Phone" htmlFor="phone">
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
      </Field>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Saving…' : 'Create client'}
        </Button>
      </div>
    </form>
  )
}
