# Acute Connect — Architecture

## Overview

Acute Connect is a professional mental health support and acute care management platform, structured as a **Turborepo monorepo**.

```
/acmvp
├── /apps
│   ├── /web            — Main SaaS web app (Vite + React + Tailwind)
│   ├── /admin          — Internal admin dashboard (Next.js — future)
│   └── /aclocation     — Location provisioning scaffold (Netlify-native)
│
├── /packages
│   ├── /types          — Shared TypeScript types (domain, auth, API)
│   ├── /config         — Env vars, legal constants, app settings
│   ├── /database       — Single Supabase client + typed query helpers
│   ├── /auth           — Session, roles, OTP, useAuth hook, LoginForm
│   ├── /ui             — Shared design system components + styles
│   ├── /ai             — Triage engine, agent stubs, prompt templates
│   ├── /api            — Shared API utilities (stub)
│   ├── /billing        — Stripe/subscription logic (stub)
│   ├── /notifications  — Push, email, SMS services
│   └── /integrations   — GitHub, Netlify, Supabase management APIs
│
├── /modules
│   ├── /dashboard      — Admin + sys dashboards, metrics
│   ├── /triage         — Clinical triage workflows
│   ├── /clients        — Patient directory, CRM, profiles
│   ├── /crn            — CRN generation, search, revocation
│   ├── /crisis         — Crisis event management
│   ├── /checkin        — Client check-in flow
│   ├── /reports        — Clinical reports, export
│   ├── /analytics      — Heat maps, finance, provider metrics
│   ├── /locations      — Location rollout, feature flags
│   ├── /audit          — Audit log viewer
│   ├── /users          — Staff management
│   ├── /settings       — App settings, feedback
│   ├── /chat-agent     — JaxAI + GitHub agent panels
│   ├── /billing        — Invoicing, sponsor ledger
│   ├── /documents      — Document storage (future)
│   └── /teams          — Team management (future)
│
├── /database           — Consolidated migrations + seed data
├── /supabase           — Supabase CLI config + edge functions
├── /docs               — Architecture, API, database, deployment docs
└── /tests              — Unit, integration, e2e test suites
```

## Key Architectural Rules

1. **Apps display things** — `apps/` contains deployable applications that compose modules and packages.
2. **Modules own features** — `modules/` contains business logic. Each module has components, hooks, services, types, validation, and routes.
3. **Packages share reusable logic** — `packages/` contains code reused across apps and modules. No business logic here.

## Dependency Graph

```
apps/web
  └── modules/*         (feature modules)
  └── @acmvp/auth       (auth gate, login form, useAuth)
  └── @acmvp/ui         (design system)

modules/*
  └── @acmvp/database   (Supabase queries)
  └── @acmvp/types      (shared types)
  └── @acmvp/ai         (where relevant)

packages/auth, notifications, integrations, billing
  └── @acmvp/database
  └── @acmvp/types
  └── @acmvp/config

packages/database, ai, ui
  └── @acmvp/types
  └── @acmvp/config

packages/config, types            ← leaf packages (no internal deps)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + custom `acute.css` design tokens |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Functions | Netlify Edge Functions (TypeScript) |
| Auth | Supabase Auth + OTP (MVP) |
| AI | OpenAI API (stub — see `@acmvp/ai`) |
| Billing | Stripe (stub — see `@acmvp/billing`) |
| PWA | vite-plugin-pwa + Workbox |
| Monorepo | Turborepo + npm workspaces |
| Deployment | Netlify (web) |

## `aclocation/` Sub-Product

`apps/aclocation/` is a Netlify-native scaffold for spinning up new location instances. It uses **Netlify Database + Identity + Functions** — it does **not** use Supabase env vars. See `apps/aclocation/README.md` for details.

## Supabase Project

- **Production project ref**: `amfikpnctfgesifwdkkd`
- **Default URL**: `https://amfikpnctfgesifwdkkd.supabase.co`
- The anon key is public-by-design and safe in client bundles.
- Service role key must **never** be shipped in client code.
