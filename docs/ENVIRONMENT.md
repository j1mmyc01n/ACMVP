# Environment Variables

All variables are defined in `.env.example` at the repo root. Copy it to `.env` for local development.

## Required

| Variable | Used By | Description |
|----------|---------|-------------|
| `VITE_SUPABASE_URL` | `@acmvp/config`, `apps/web` | Supabase project URL. Must end in `.supabase.co` or `.supabase.in`. |
| `VITE_SUPABASE_ANON_KEY` | `@acmvp/config`, `apps/web` | Supabase anon/public key. Safe in client bundles. |

## Optional — Server (Netlify Functions)

| Variable | Used By | Description |
|----------|---------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Netlify functions | Full DB access. **Never expose in client code.** |
| `SUPABASE_MANAGEMENT_TOKEN` | `provision-location` | Supabase Management API token for creating projects. |
| `NETLIFY_AUTH_TOKEN` | `provision-location` | Creates new Netlify sites during location rollout. |
| `GITHUB_TOKEN` | `provision-location`, `github-agent` | Manages repos and dispatches workflows. |
| `GITHUB_TEMPLATE_OWNER` | `provision-location` | Owner of the template repo (reserved — not yet wired). |
| `GITHUB_TEMPLATE_REPO` | `provision-location` | Template repo name (reserved — not yet wired). |
| `OPENAI_API_KEY` | `github-agent`, `@acmvp/ai` | OpenAI API key for AI features. Also used by Supabase Studio. |

## Optional — Billing (Phase 2)

| Variable | Used By | Description |
|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | `@acmvp/billing` | Stripe server-side key. |
| `STRIPE_WEBHOOK_SECRET` | `@acmvp/billing` | Stripe webhook signature verification. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `apps/admin` | Stripe publishable key for client-side. |

## Validation

`@acmvp/config` validates `VITE_SUPABASE_URL` at startup — it must be a Supabase host or the client falls back to the hardcoded production default. A console warning is emitted if a non-Supabase URL is detected.
