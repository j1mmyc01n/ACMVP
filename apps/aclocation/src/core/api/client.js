import { getActiveLocationId } from '../tenancy/TenantProvider.jsx'

const BASE = '/.netlify/functions'

class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.error ?? `request_failed_${status}`)
    this.status = status
    this.payload = payload
  }
}

async function request(method, path, body) {
  const headers = { accept: 'application/json' }
  const locationId = getActiveLocationId()
  if (locationId) headers['x-aclocation-id'] = locationId
  if (body !== undefined) headers['content-type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const contentType = res.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text()

  if (!res.ok) throw new ApiError(res.status, payload)
  return payload
}

/**
 * Thin fetch wrapper used by every module. Automatically attaches the active
 * tenant id and the Identity cookie. Modules should not call `fetch` directly.
 */
export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  patch: (path, body) => request('PATCH', path, body ?? {}),
  del: (path) => request('DELETE', path),
}

export { ApiError }
