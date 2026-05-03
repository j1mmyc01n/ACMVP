# Acute Connect — Mental Health Support Platform

Professional mental health support and acute care management platform.
Built as a **Turborepo monorepo** for modular, production-grade architecture.

## Monorepo Structure

```
/apps/web          — Main SaaS web app (React + Vite + Tailwind)
/apps/admin        — Internal admin dashboard (Next.js, future)
/apps/aclocation   — Location provisioning scaffold
/packages          — Shared systems (@acmvp/*)
/modules           — Business feature modules
/database          — Consolidated migrations + seed data
/docs              — Architecture, API, environment docs
/tests             — Unit, integration, e2e tests
```

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the full architecture overview.

## Quick Start

### Development

```bash
# Install all workspace dependencies
npm install

# Start the web app
npm run dev:web
# or: npm run dev --workspace=apps/web
```

Visit `http://localhost:5173`

### Production Build

```bash
npm run build
# builds apps/web only (and its workspace deps)
```

### Run Unit Tests

```bash
npx vitest run tests/unit
```

## Features

- ✅ Progressive Web App (PWA) — install on any device
- ✅ Client check-in with CRN validation
- ✅ Admin triage dashboard
- ✅ Crisis event management
- ✅ Multi-centre check-in
- ✅ Location rollout & provisioning
- ✅ Audit logging with legal consent tracking
- ✅ Field agent GPS dashboard
- ✅ Push notifications
- ✅ Sponsor management & ledger

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + custom `acute.css` |
| Backend | Supabase (PostgreSQL + Auth) |
| Functions | Netlify Edge Functions |
| AI | OpenAI API (`@acmvp/ai`) |
| Monorepo | Turborepo + npm workspaces |
| Deployment | Netlify |

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Database](./docs/DATABASE.md)
- [API](./docs/API.md)
- [Environment Variables](./docs/ENVIRONMENT.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Roadmap](./docs/ROADMAP.md)

For detailed PWA testing instructions, see [PWA_TESTING.md](./PWA_TESTING.md)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run generate-icons` - Regenerate PWA icons from icon.svg

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **PWA**: vite-plugin-pwa + Workbox
- **Icons**: React Icons
- **Routing**: React Router DOM

## Deployment

The app is configured for deployment on:
- Netlify (see `netlify.toml`)
- Any static hosting with HTTPS support

Service workers require HTTPS in production.