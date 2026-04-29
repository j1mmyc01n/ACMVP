# Acute Connect — Fix Package Instructions
# For GitHub AI Agent / Greta

## WHAT THIS PACKAGE CONTAINS
All files needed to upgrade Acute-Connect-MVP-8485 from MVP to production full-stack SaaS.

## YOUR JOB — Move each file to the correct path in the repo

### ROOT FILES (move to repo root)
- root/netlify.toml           → /netlify.toml
- root/INSTRUCTIONS.md        → (this file, for reference only — do not copy)

### GITHUB ACTIONS (create folder if missing)
- .github/workflows/deploy.yml → /.github/workflows/deploy.yml

### SUPABASE CLIENT (replace existing)
- src/supabase/supabase.js    → /src/supabase/supabase.js

### DATABASE MIGRATION (add to migrations folder)
- src/supabase/migrations/1777090014000-client-accounts.sql
  → /src/supabase/migrations/1777090014000-client-accounts.sql
  ⚠️  ALSO run this SQL in Supabase Dashboard > SQL Editor

### CLIENT PORTAL (new file)
- src/pages/client/ClientPortal.jsx → /src/pages/client/ClientPortal.jsx

### UPDATED PAGES (replace existing)
- src/pages/ClientViews.jsx   → /src/pages/ClientViews.jsx  (adds My Account tab)
- src/App.jsx                 → /src/App.jsx  (adds Supabase Auth + client role)
- src/pages/system/OverseerDashboard.jsx → /src/pages/system/OverseerDashboard.jsx
- src/pages/system/LocationRollout.jsx   → /src/pages/system/LocationRollout.jsx

### SUPABASE EDGE FUNCTION (new folder + file)
- supabase/functions/create-client-account/index.ts
  → /supabase/functions/create-client-account/index.ts

## AFTER MOVING FILES

### 1. Add GitHub Actions Secrets
Go to: GitHub repo > Settings > Secrets and variables > Actions > New repository secret
Add these 4 secrets:
  SUPABASE_URL       = https://amfikpnctfgesifwdkkd.supabase.co
  SUPABASE_ANON_KEY  = (get from Supabase > Settings > API > anon public)
  NETLIFY_TOKEN      = (get from Netlify > User Settings > Applications > New token)
  NETLIFY_SITE_ID    = (get from Netlify > Site Config > Site ID)

### 2. Supabase Dashboard Changes
  a) Authentication > Providers > Email > Enable
  b) Authentication > URL Configuration:
     - Site URL: https://incomparable-starburst-89c1ab.netlify.app
     - Redirect URL: https://incomparable-starburst-89c1ab.netlify.app/**
  c) SQL Editor > paste and run the migration file content

### 3. Netlify Environment Variables
Go to: Netlify > Site Config > Environment Variables
Add:
  VITE_SUPABASE_URL      = https://amfikpnctfgesifwdkkd.supabase.co
  VITE_SUPABASE_ANON_KEY = (your anon key)

### 4. Push to GitHub
  git add .
  git commit -m "feat: full-stack upgrade — client accounts, CI/CD, auth fixes"
  git push origin main

GitHub Actions will automatically build and deploy to Netlify.

## WHAT EACH FIX DOES
- netlify.toml        → fixes /checkin 404 on page reload (most urgent)
- deploy.yml          → every git push now auto-deploys — no manual deploys ever again
- supabase.js         → adds detectSessionInUrl so auth redirects work
- App.jsx             → adds Supabase Auth listener, client role detection
- ClientViews.jsx     → adds "My Account" tab with magic link login for clients
- ClientPortal.jsx    → new client dashboard — appointments, mood history, resources
- migration SQL       → creates client_accounts table linking auth to CRN
- Edge Function       → creates client accounts from admin CRM (uses service role key safely)
- OverseerDashboard   → replaces fake data with real Supabase realtime subscriptions
- LocationRollout     → wires real GitHub + Netlify + Supabase API provisioning calls
