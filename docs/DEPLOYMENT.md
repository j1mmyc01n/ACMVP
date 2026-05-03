# Deployment

## Web App (apps/web) — Netlify

### Build Configuration

The root `netlify.toml` configures:
```toml
[build]
  command  = "npm run build --workspace=apps/web"
  publish  = "apps/web/dist"
  functions = "apps/web/netlify/functions"
```

### Required Environment Variables on Netlify

Set these in **Site Settings → Environment Variables**:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_MANAGEMENT_TOKEN  (for provision-location function)
NETLIFY_AUTH_TOKEN          (for provision-location function)
GITHUB_TOKEN                (for provision-location + github-agent)
OPENAI_API_KEY              (for github-agent)
```

### Deploy Flow

1. Push to `main` triggers a Netlify build.
2. Turborepo builds `apps/web` (and its workspace dependencies).
3. Netlify deploys the `apps/web/dist/` folder.
4. Netlify functions in `apps/web/netlify/functions/` are deployed automatically.

## Supabase Migrations

Run migrations via the Supabase CLI from the repo root:

```bash
supabase db push          # Apply all pending migrations
supabase db reset         # Reset local DB and re-apply all migrations
```

The canonical migration folder is `/database/migrations/`. The `supabase/` folder at root contains the Supabase CLI config and edge functions.

## `apps/aclocation` — Netlify (separate deployment)

`apps/aclocation/` is deployed independently as a Netlify site. It has its own `netlify.toml` and does **not** share the root build config. See `apps/aclocation/README.md` for provisioning steps.

## `apps/admin` — Vercel or Netlify (future)

`apps/admin/` will be deployed separately. It is a Next.js app — use Vercel for optimal Next.js support.

## CI/CD

See `.github/workflows/` for GitHub Actions pipelines:
- `build.yml` — Turborepo-aware build, runs on all PRs.
- `deploy.yml` — Netlify deploy on merge to `main`.
