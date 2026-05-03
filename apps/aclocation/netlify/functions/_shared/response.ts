import { HttpError } from './auth.js'

export function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  })
}

/**
 * Wrap a handler so thrown HttpError instances become typed JSON responses
 * and any other failure becomes a 500 without leaking internals.
 */
export function handler(fn: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    try {
      return await fn(req)
    } catch (err) {
      if (err instanceof HttpError) {
        return json({ error: err.message, details: err.details ?? null }, { status: err.status })
      }
      console.error('[function]', err)
      return json({ error: 'internal_error' }, { status: 500 })
    }
  }
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T
  } catch {
    throw new HttpError(400, 'invalid_json_body')
  }
}
