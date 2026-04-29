# ACMVP — Environment Setup

## Required Environment Variables

Create a `.env` file in the project root (never commit it):

```env
VITE_SUPABASE_URL=https://amfikpnctfgesifwdkkd.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Both variables have hardcoded fallbacks in `src/supabase/supabase.js` pointing
to the production project, so local dev works without a `.env` file. Set them
anyway to make the active project explicit.

### Netlify / CI

Set these in Netlify → Site → Environment Variables:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key (safe to expose in browser) |

### Edge Function (Supabase-managed, not Netlify)

The `create-client-account` Edge Function uses Supabase's built-in secrets.
Set via Supabase Dashboard → Project → Edge Functions → Secrets, or CLI:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
supabase secrets set SITE_URL=https://your-netlify-domain.netlify.app
```

**Never** put `SUPABASE_SERVICE_ROLE_KEY` in frontend code or Netlify env vars
that are accessible at build time.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Create .env
cp .env.example .env   # then fill in values, or leave for hardcoded defaults

# 3. Start dev server
npm run dev
# → http://localhost:5173
```

The dev server has `historyApiFallback: true` so React's custom routing works
on reload.

---

## Build & Validation

```bash
npm run build     # production build → dist/
npm run preview   # serve dist/ locally for smoke-testing
```

There is no lint or test script configured yet. Check `FEATURE_BACKLOG.md`
for the tracking item.

---

## Supabase CLI (optional, for migrations)

```bash
npm install -g supabase
supabase login
supabase link --project-ref amfikpnctfgesifwdkkd

# Push local migration files
supabase db push

# Generate a new migration
supabase migration new <description>
```

Migration files live in `src/supabase/migrations/`. Apply them in
chronological order; they are timestamped.

---

## Netlify Deploy

Automatic deploys are triggered by pushes to `main`. Pull requests generate
deploy previews automatically (Netlify bot posts the URL as a PR comment).

Manual deploy:
```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

---

## Default Login Credentials (seeded)

| Email | Password | Role |
|---|---|---|
| `ops@acuteconnect.health` | `password` | admin |
| `sysadmin@acuteconnect.health` | `password` | sysadmin |

Change these after first deploy. The seed is in migration
`1777100002000-ensure-default-admin-accounts.sql`.

---

## Browser Support

Targets modern evergreen browsers. PWA install and service worker require
HTTPS (satisfied by Netlify and by `localhost` for dev).
