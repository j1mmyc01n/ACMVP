import type { Context } from "@netlify/functions";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') return json({}, 200);
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

  let body: { abn?: string };
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const abn = (body.abn || '').replace(/\s/g, '');
  if (!abn) return json({ error: 'ABN required' }, 400);

  const guid = process.env.ABN_API_GUID;
  if (!guid) {
    return json({ status: 'manual', message: 'Will be verified manually' });
  }

  try {
    const url = `https://api.abn.business.gov.au/abn/v3/abn?abn=${encodeURIComponent(abn)}&guid=${guid}&includeHistoricalDetails=N`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return json({ status: 'manual', message: 'Will be verified manually' });
    const data = await res.json();
    if (data?.Abn && data?.EntityName) {
      return json({ status: 'valid', businessName: data.EntityName, abn: data.Abn });
    }
    return json({ status: 'invalid', message: 'Not found' });
  } catch {
    return json({ status: 'manual', message: 'Will be verified manually' });
  }
};
