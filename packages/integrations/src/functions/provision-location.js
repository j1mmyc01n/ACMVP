// netlify/functions/provision-location.mts
//
// Server-side proxy for all Management-API calls made during location
// provisioning.  These APIs (Supabase Management, Netlify, GitHub
// template/dispatch) do NOT allow direct browser fetch due to CORS
// restrictions, so the browser forwards the request body here and this
// function executes the call from a trusted server origin.
//
// Actions handled:
//   list_supabase_orgs        – list orgs the management token can access
//   create_github_repo        – fork template into new private repo
//   create_supabase_project   – create new Supabase project
//   get_supabase_keys         – retrieve anon key for a project
//   configure_supabase_auth   – set site_url & redirect URLs
//   create_netlify_site       – create new Netlify site
//   configure_netlify_env     – set VITE_* env vars on a site
//   trigger_github_deploy     – dispatch workflow_dispatch event
//   trigger_backup            – dispatch backup.yml workflow_dispatch on a location repo
const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type',
    },
});
// Safely read a response body: returns a parsed JSON object when possible, or
// wraps the raw text in { message } so callers always get a consistent shape.
const readBody = async (res) => {
    const text = await res.text();
    try {
        return JSON.parse(text);
    }
    catch {
        return { message: text.trim() || res.statusText };
    }
};
export default async (req, _ctx) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'content-type',
            },
        });
    }
    if (req.method !== 'POST') {
        return json({ error: 'Method Not Allowed' }, 405);
    }
    let body;
    try {
        body = await req.json();
    }
    catch {
        return json({ error: 'Invalid JSON body' }, 400);
    }
    const { action, ...params } = body;
    if (!action) {
        return json({ error: 'action is required' }, 400);
    }
    try {
        switch (action) {
            // ── Supabase: list organizations the token can access ───────────────────
            case 'list_supabase_orgs': {
                const { supabaseToken } = params;
                if (!supabaseToken) {
                    return json({ error: 'supabaseToken is required' }, 400);
                }
                const res = await fetch('https://api.supabase.com/v1/organizations', {
                    headers: {
                        Authorization: `Bearer ${supabaseToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                const text = await res.text();
                let parsed;
                try {
                    parsed = JSON.parse(text);
                }
                catch {
                    parsed = null;
                }
                if (!res.ok) {
                    const msg = (parsed && typeof parsed === 'object' && 'message' in parsed
                        ? String(parsed.message)
                        : '') ||
                        text.trim() ||
                        res.statusText;
                    return json({ error: `Supabase: ${msg}` }, res.status);
                }
                const orgs = Array.isArray(parsed)
                    ? parsed.map(o => ({ id: o.id, name: o.name }))
                    : [];
                return json({ orgs });
            }
            // ── GitHub: create repo from template ───────────────────────────────────
            case 'create_github_repo': {
                const { githubToken, templateRepo, githubOrg, repoName, description } = params;
                if (!githubToken || !templateRepo || !githubOrg || !repoName) {
                    return json({ error: 'githubToken, templateRepo, githubOrg, repoName are required' }, 400);
                }
                const res = await fetch(`https://api.github.com/repos/${templateRepo}/generate`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: 'application/vnd.github+json',
                        'Content-Type': 'application/json',
                        'X-GitHub-Api-Version': '2022-11-28',
                        'User-Agent': 'AcuteConnect-Provisioner/1.0',
                    },
                    body: JSON.stringify({
                        owner: githubOrg,
                        name: repoName,
                        description: description ?? `Acute Connect — ${repoName}`,
                        private: true,
                    }),
                });
                const data = await readBody(res);
                if (!res.ok) {
                    // 422 "already exists" — repo was created in a previous attempt; fetch and reuse it
                    if (res.status === 422 &&
                        typeof data.message === 'string' &&
                        /already exists/i.test(data.message)) {
                        const existingRes = await fetch(`https://api.github.com/repos/${githubOrg}/${repoName}`, {
                            headers: {
                                Authorization: `Bearer ${githubToken}`,
                                Accept: 'application/vnd.github+json',
                                'X-GitHub-Api-Version': '2022-11-28',
                                'User-Agent': 'AcuteConnect-Provisioner/1.0',
                            },
                        });
                        if (existingRes.ok) {
                            const existing = await readBody(existingRes);
                            return json({
                                html_url: existing.html_url,
                                full_name: existing.full_name,
                                clone_url: existing.clone_url,
                                reused: true,
                            });
                        }
                    }
                    return json({ error: `GitHub: ${data.message || res.statusText}` }, res.status);
                }
                return json({
                    html_url: data.html_url,
                    full_name: data.full_name,
                    clone_url: data.clone_url,
                });
            }
            // ── Supabase: create project ─────────────────────────────────────────────
            case 'create_supabase_project': {
                const { supabaseToken, name, organization_id, plan, region, db_pass } = params;
                if (!supabaseToken || !name || !organization_id || !db_pass) {
                    return json({ error: 'supabaseToken, name, organization_id, db_pass are required' }, 400);
                }
                const res = await fetch('https://api.supabase.com/v1/projects', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${supabaseToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name,
                        organization_id,
                        plan: plan ?? 'pro',
                        region: region ?? 'ap-southeast-2',
                        db_pass,
                    }),
                });
                const data = await readBody(res);
                if (!res.ok) {
                    return json({ error: `Supabase: ${data.message || res.statusText}` }, res.status);
                }
                return json({ id: data.id, name: data.name, region: data.region });
            }
            // ── Supabase: get API keys ───────────────────────────────────────────────
            case 'get_supabase_keys': {
                const { supabaseToken, projectRef } = params;
                if (!supabaseToken || !projectRef) {
                    return json({ error: 'supabaseToken and projectRef are required' }, 400);
                }
                const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, { headers: { Authorization: `Bearer ${supabaseToken}` } });
                if (!res.ok) {
                    return json({ error: `Supabase: failed to retrieve API keys (${res.status})` }, res.status);
                }
                const keysText = await res.text();
                let keys = [];
                try {
                    keys = JSON.parse(keysText);
                }
                catch {
                    return json({ error: `Supabase: unexpected response retrieving API keys — ${keysText.slice(0, 120)}` }, 502);
                }
                const anon = keys.find(k => k.name === 'anon')?.api_key ?? null;
                const service = keys.find(k => k.name === 'service_role')?.api_key ?? null;
                return json({ anon_key: anon, service_role_key: service });
            }
            // ── Supabase: configure auth URLs ────────────────────────────────────────
            case 'configure_supabase_auth': {
                const { supabaseToken, projectRef, site_url, additional_redirect_urls } = params;
                if (!supabaseToken || !projectRef || !site_url) {
                    return json({ error: 'supabaseToken, projectRef, site_url are required' }, 400);
                }
                const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${supabaseToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        site_url,
                        additional_redirect_urls: additional_redirect_urls ?? [`${site_url}/**`, site_url],
                    }),
                });
                if (!res.ok) {
                    const err = await readBody(res);
                    return json({ error: `Supabase: ${err.message || res.statusText}` }, res.status);
                }
                return json({ ok: true });
            }
            // ── Netlify: create site ─────────────────────────────────────────────────
            case 'create_netlify_site': {
                const { netlifyToken, name } = params;
                if (!netlifyToken || !name) {
                    return json({ error: 'netlifyToken and name are required' }, 400);
                }
                const res = await fetch('https://api.netlify.com/api/v1/sites', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${netlifyToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name }),
                });
                const data = await readBody(res);
                if (!res.ok) {
                    return json({ error: `Netlify: ${data.message || res.statusText}` }, res.status);
                }
                return json({ id: data.id, ssl_url: data.ssl_url, url: data.url, name: data.name, account_id: data.account_id });
            }
            // ── Netlify: set env vars ────────────────────────────────────────────────
            // Uses the new Environment Variables API (not the deprecated Sites API
            // build_settings.env patch, which Netlify rejects on newer sites).
            case 'configure_netlify_env': {
                const { netlifyToken, siteId, accountId, env } = params;
                if (!netlifyToken || !siteId || !accountId || !env) {
                    return json({ error: 'netlifyToken, siteId, accountId, env are required' }, 400);
                }
                // The new Env Vars API expects an array of objects.
                const envVars = Object.entries(env).map(([key, value]) => ({
                    key,
                    scopes: ['builds', 'functions', 'runtime', 'post_processing'],
                    values: [{ context: 'all', value }],
                }));
                const res = await fetch(`https://api.netlify.com/api/v1/accounts/${accountId}/env?site_id=${siteId}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${netlifyToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(envVars),
                });
                if (!res.ok) {
                    const err = await readBody(res);
                    return json({ error: `Netlify: ${err.message || res.statusText}` }, res.status);
                }
                return json({ ok: true });
            }
            // ── GitHub: trigger workflow dispatch ────────────────────────────────────
            case 'trigger_github_deploy': {
                const { githubToken, repoFullName, workflow = 'deploy.yml', ref = 'main' } = params;
                if (!githubToken || !repoFullName) {
                    return json({ error: 'githubToken and repoFullName are required' }, 400);
                }
                const res = await fetch(`https://api.github.com/repos/${repoFullName}/actions/workflows/${workflow}/dispatches`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: 'application/vnd.github+json',
                        'Content-Type': 'application/json',
                        'X-GitHub-Api-Version': '2022-11-28',
                        'User-Agent': 'AcuteConnect-Provisioner/1.0',
                    },
                    body: JSON.stringify({ ref }),
                });
                // 204 = dispatch accepted, 422 = workflow file doesn't exist yet (non-fatal)
                if (res.status === 204) {
                    return json({ ok: true, message: 'Deploy triggered successfully' });
                }
                if (res.status === 422) {
                    return json({ ok: false, message: 'Workflow file not yet present in repo — deploy manually after pushing code' });
                }
                const err = await readBody(res);
                return json({ error: `GitHub: ${err.message || res.statusText}` }, res.status);
            }
            // ── GitHub: trigger backup workflow dispatch ──────────────────────────────
            case 'trigger_backup': {
                const { githubToken, repoFullName, ref = 'main', reason = 'Manual trigger from SysAdmin' } = params;
                if (!githubToken || !repoFullName) {
                    return json({ error: 'githubToken and repoFullName are required' }, 400);
                }
                const res = await fetch(`https://api.github.com/repos/${repoFullName}/actions/workflows/backup.yml/dispatches`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: 'application/vnd.github+json',
                        'Content-Type': 'application/json',
                        'X-GitHub-Api-Version': '2022-11-28',
                        'User-Agent': 'AcuteConnect-Provisioner/1.0',
                    },
                    body: JSON.stringify({ ref, inputs: { reason } }),
                });
                if (res.status === 204) {
                    return json({ ok: true, message: 'Backup workflow triggered successfully' });
                }
                if (res.status === 422) {
                    return json({ ok: false, message: 'backup.yml not yet present in repo — push the workflow file first' });
                }
                const err = await readBody(res);
                return json({ error: `GitHub: ${err.message || res.statusText}` }, res.status);
            }
            default:
                return json({ error: `Unknown action: ${action}` }, 400);
        }
    }
    catch (err) {
        const e = err;
        return json({ error: e.message || 'Internal server error' }, 500);
    }
};
//# sourceMappingURL=provision-location.js.map