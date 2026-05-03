// netlify/functions/get-location-credentials.mts
//
// Server-side credential verification proxy.
// Sysadmin uses this to verify that a location's credentials are available
// server-side (i.e. in the Supabase `location_credentials` table) without
// exposing secret values to the browser.
//
// POST body: { location_id, credential_type }
// Returns: { exists: bool, service_name: string|null }  (never returns the key)

import type { Context } from '@netlify/functions';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'content-type, authorization',
    },
  });

export default async (req: Request, _ctx: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type, authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return json({ error: 'Supabase environment not configured' }, 503);
  }

  let body: { location_id?: string; credential_type?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { location_id, credential_type } = body;
  if (!location_id || !credential_type) {
    return json({ error: 'location_id and credential_type are required' }, 400);
  }

  // Query Supabase using the service-role key (not exposed to browser)
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/location_credentials?location_id=eq.${encodeURIComponent(location_id)}&credential_type=eq.${encodeURIComponent(credential_type)}&select=id,service_name`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return json({ error: `Supabase error: ${text}` }, 502);
  }

  const rows = await res.json() as Array<{ id: string; service_name?: string }>;
  const row = rows[0] ?? null;

  return json({
    exists: !!row,
    service_name: row?.service_name ?? null,
  });
};

export const config = { path: '/api/get-location-credentials' };
