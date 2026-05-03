# API Reference

## Netlify Functions

All functions are deployed from `apps/web/netlify/functions/`. They map to `/api/*` routes via the `config: Config` export.

### `POST /api/provision-location`

Server-side proxy for Management API calls during location provisioning. Avoids browser CORS restrictions.

**Actions:**
| `action` | Description |
|---------|-------------|
| `list_supabase_orgs` | List Supabase orgs accessible to the management token |
| `create_github_repo` | Fork template repo into new private repo |
| `create_supabase_project` | Create new Supabase project |
| `get_supabase_keys` | Retrieve anon key for a project |
| `configure_supabase_auth` | Set site_url and redirect URLs |
| `create_netlify_site` | Create new Netlify site |
| `configure_netlify_env` | Set `VITE_*` env vars on a site |
| `trigger_github_deploy` | Dispatch `workflow_dispatch` event |
| `trigger_backup` | Dispatch backup.yml workflow on a location repo |

**Required env vars:** `SUPABASE_MANAGEMENT_TOKEN`, `NETLIFY_AUTH_TOKEN`, `GITHUB_TOKEN`

---

### `GET /api/get-location-credentials`

Returns decrypted credentials for a location instance. Server-side only to prevent credential exposure.

---

### `POST /api/seed-test-location`

Seeds a test location with demo data. Development/staging only.

---

### `POST /api/request-crn`

Processes a CRN request from the client check-in flow. Routes clients by `care_centres_1777090000.service_types`.

---

### `POST /api/github-agent`

Proxies requests to the GitHub agent (AI code assistant). Requires `GITHUB_TOKEN` and `OPENAI_API_KEY`.

---

## Edge Functions

`apps/web/netlify/edge-functions/markdown.ts` — Serves Markdown when `Accept: text/markdown` header is present. Used by AI agents to read page content.

Routes covered: `/`, `/checkin`, `/resources`, `/professionals`, `/request_access`, `/join_provider`, `/join_sponsor`, `/legal`, `/legal/*`
