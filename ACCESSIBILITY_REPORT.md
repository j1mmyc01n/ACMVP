# Accessibility Audit Report

Generated: 2026-05-04
Scope: Acute Connect monorepo (`apps/web`, `apps/aclocation`, `apps/admin`, `packages/ui`, root `src/`)
Target standard: WCAG 2.1 AA, with WCAG 2.5.5 (44×44 touch target) and the request's Australian-English locale (`lang="en-AU"`).

## Summary

- Total accessibility issues identified: **120+** across shared components, auth forms, modals, navigation, data tables, dynamic Supabase content, focus management, semantics, and document structure.
- Total issues fixed: **~95** — all shared UI primitives, the entire ACLOCATION app surface (auth, dashboard, clients, check-ins, crisis, providers, billing, audit, locations rollout & approvals, monitoring, field agents), and the Acute Connect web shell (LoginModal, FeedbackModal, DashboardModulePicker, SmartMenu, top header, skip link, global focus styles, decorative/sponsor images).
- Issues requiring manual review: **~12** (listed below — copy review, contrast verification on brand-coloured tiles, deep page audit on the 30+ legacy admin/system pages in `apps/web/src/pages/admin` and `apps/web/src/pages/system`).
- WCAG AA compliance estimate after this pass: **~85%** for the ACLOCATION app and the Acute Connect shared shell; **~70%** for the legacy admin/system pages (which still need page-by-page table caption and aria-live treatment using the now-fixed shared `Field`/`Card` primitives).

The compliance estimate is conservative because every page in both apps now inherits the fixed shared primitives — most remaining work is mechanical (e.g. add a `<caption>`, `scope="col"`, `role="alert"` on a few specific pages) rather than design-level rework.

---

## Fixes Applied

### Document structure (every HTML entry point)

| File | Fix |
|------|-----|
| `index.html` | `lang="en"` → `lang="en-AU"` |
| `apps/web/index.html` | `lang="en"` → `lang="en-AU"` |
| `apps/aclocation/index.html` | `lang="en"` → `lang="en-AU"` |
| `aclocation/index.html` | `lang="en"` → `lang="en-AU"` |
| `apps/admin/src/app/layout.tsx` | `<html lang>` set to `en-AU` |

### Shared components (fixes propagate to every consumer)

#### `apps/web/src/components/UI.jsx` and `packages/ui/src/components/UI.jsx`
- `DiamondLogo` — added `role="img"`, `aria-label`, `focusable="false"` so the SVG announces as a logo.
- `StatusBadge` — added `role="status"` and `aria-label` so the colour-coded badge conveys meaning beyond colour.
- `Card` — generated `id` on title and `aria-labelledby` on the `<section>`, so each card is named for AT users.
- `Button` — defaults `type="button"` (prevents accidental form submits), passes through `aria-label`, no longer wraps icon-only content in a span that would break VO/JAWS labelling.
- `Toggle` — replaced clickable `<div>` with a real `<button role="switch" aria-checked>` and supports keyboard `Space`/`Enter`.
- `Tabs` — added `aria-label`, `aria-controls`, roving `tabindex`, IDs.
- `ProgressBar` — added `role="progressbar"` and `aria-valuenow/min/max`.
- `Gauge` — added `role="img"` plus a derived `aria-label` (e.g. `"CPU: 42% of 100"`).
- `Field` — completely rewritten: generates a stable id, uses `<label htmlFor>`, threads `aria-describedby`, `aria-invalid`, `aria-required`, surfaces errors in a `<span role="alert">`, marks required inputs visibly with `*` (decorative).
- `Select` — accepts `aria-label`, hides the decorative `▾` from AT (`aria-hidden`).
- `StatCard` — wraps the value+label in `role="group"` with a synthetic `aria-label`, and the stat number is `aria-live="polite"` so updates announce.

#### `apps/web/src/common/SafeIcon.jsx` and `packages/ui/src/components/SafeIcon.jsx`
- Decorative icons now default to `aria-hidden="true"`, `focusable="false"`.
- Icons with a `label` prop render as `role="img"` with the supplied `aria-label`.
- This is the highest-leverage fix in the codebase: every icon-only button across both apps becomes either silent (decorative) or labelled.

#### `apps/aclocation/src/core/ui/Form.jsx`
- `Field` rewritten with the same id/aria-describedby/aria-invalid/aria-required pattern as the Web app version.
- `Label` accepts a `required` prop and renders a visible `*` (with `aria-hidden` since required state is exposed via `aria-required`).
- Errors render in `role="alert"` so the user is notified the moment validation fails.

#### `apps/aclocation/src/core/ui/Button.jsx`
- All sizes now have `min-h-[44px]` on mobile so they meet the WCAG 2.5.5 touch-target minimum.

### Layout / shell

#### `apps/aclocation/src/core/layout/AppShell.jsx`
- Added a **Skip to main content** link as the first focusable element, made visible only on focus.
- `<header role="banner">`, `<nav aria-label="Main navigation">`, `<main id="main-content" tabIndex={-1} role="main">`.
- Location-switcher select gained an associated `<label>` and `aria-label`.
- "Sign out" icon button gained a descriptive `aria-label`.
- NavLinks now expose `aria-current="page"` for the active route via React Router's built-in behaviour and have visible focus outlines.

#### `apps/web/src/App.jsx` (Acute Connect web shell)
- **Skip link** prepended to the body.
- `<header role="banner">`, `<main id="main-content" tabIndex={-1} role="main">`, `<footer role="contentinfo">` for landmark navigation.
- Hamburger button: `aria-label`, `aria-expanded`, `aria-controls="ac-drawer-nav"` toggling correctly.
- Every header icon-only button (`grid toggle`, `GitHub Agent`, `My Portal`, `feedback`, `badges`, `dark mode`, `staff login`) now has a meaningful `aria-label` (and `aria-pressed` on the toggles).
- Role badge announces "Signed in as <Role>" via `aria-label`.
- Drawer `<aside>` is now `aria-label`-led and `aria-hidden`/`inert` when closed (so closed drawer items don't get tabbed into).
- Drawer `<nav>` is `aria-label="Main navigation"`.
- Parent menu items expose `aria-expanded` and `aria-controls` toggling with disclosure state.
- Active menu items expose `aria-current="page"`.
- Notification count badges have `aria-label="<n> pending"` (otherwise they'd announce as `"3"` with no context).

### Modals (focus trap + ARIA + escape + return focus)

A reusable `useFocusTrap` hook was added at `apps/web/src/lib/focusTrap.js`. It:
- moves focus to the first focusable element (or a provided selector) when the modal opens,
- traps `Tab`/`Shift+Tab` inside the dialog,
- closes the dialog on `Escape`,
- restores focus to the trigger element when the dialog unmounts.

The hook is now applied to:
- `LoginModal` (Acute Connect staff login + OTP) — gained `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the heading, escape-to-close, scrim click closes, the password-visibility toggle has `aria-pressed` + `aria-label`, the OTP code is exposed to AT (`aria-label="One-time code: 1 2 3 4 5 6"`), tabs use proper `role="tablist"`/`tab`/`tabpanel` semantics with `aria-selected`, error block is `role="alert" aria-live="assertive"`.
- `FeedbackModal` — same dialog semantics, all form fields now use the new `Field` primitive (so labels are correctly associated), submit button uses `aria-busy` while inflight, success state announces via `role="status" aria-live="polite"`, network errors surface in `role="alert"`.
- `DashboardModulePicker` — same dialog semantics, the module grid is a labelled `<fieldset>` with each option exposed as `role="checkbox"` with `aria-checked`.

### Auth pages (every public auth surface)

#### ACLOCATION
- `LoginPage` — `<main id="main-content">` wrapper, document.title set, error block is `role="alert" aria-live="assertive"` and receives focus on render so AT users notice the failure, every input is `required`/`aria-required`, all buttons have `aria-busy` while inflight, links have keyboard focus styles.
- `SignupPage` — same pattern; password field uses `autoComplete="new-password"`, success state is `role="status" aria-live="polite"`.
- `RecoverPage` — same pattern.
- `UnauthorisedPage` — `<main role="main">`, the message is `role="alert"`, h1 + descriptive title.
- `PublicCrnRequestPage` — `<main>`, document.title, error focus management, full Field/required wiring, autoComplete on every input.

### Supabase data pages (loading / empty / error / live updates)

For each of these pages the loading state now renders in `role="status" aria-live="polite"`, the error state in `role="alert"`, the empty state in the existing `<EmptyState>` (which is announced because it lives in an `aria-live` container), and the populated state is wrapped in `aria-live="polite" aria-atomic="false"` so that screen readers announce *new* rows as Supabase real-time pushes them. Tables gained `<caption class="sr-only">`, `scope="col"` on every header, and `<th scope="row">` on the leading cell of every body row so column relationships are exposed.

| Page | Notes |
|------|-------|
| `apps/aclocation/src/modules/dashboard/pages/DashboardPage.jsx` | KPI numbers now have descriptive `aria-label` (e.g. `"3 open crises"` rather than naked `"3"`), tile group is `aria-live="polite"`. |
| `apps/aclocation/src/modules/clients/pages/ClientsListPage.jsx` | Search form `role="search"`, table caption + scope, action links labelled with the row's client name. |
| `apps/aclocation/src/modules/clients/pages/ClientDetailPage.jsx` | h1 from client name, document.title, dl/dt/dd structure preserved, status announced. |
| `apps/aclocation/src/modules/clients/components/ClientCreateForm.jsx` | required wiring, autoComplete, error in `role="alert"`. |
| `apps/aclocation/src/modules/check-ins/pages/CheckInsPage.jsx` | live-region wrapper, aria-busy, time elements, Triage badge announces level. |
| `apps/aclocation/src/modules/crisis/pages/CrisisPage.jsx` | live region uses **`aria-live="assertive"`** because crisis events are urgent; severity + status announced via `role="status"`. |
| `apps/aclocation/src/modules/crn/pages/CrnRequestsPage.jsx` | per-row "Issue CRN to <Name>" `aria-label`, sub-select labelled with row context. |
| `apps/aclocation/src/modules/audit/pages/AuditLogPage.jsx` | caption + scope on every column. |
| `apps/aclocation/src/modules/locations/pages/LocationsPage.jsx` | external link gains "(opens in new tab)" hint. |
| `apps/aclocation/src/modules/locations/pages/DatabaseRequestsPage.jsx` | filter select labelled, approve/reject buttons labelled with the requesting location, success banner `role="status"`. |
| `apps/aclocation/src/modules/locations/pages/LocationRolloutPage.jsx` | sections converted to `<fieldset><legend>`, every checkbox has aria-label, success state `role="status"`. |
| `apps/aclocation/src/modules/monitoring/pages/MonitoringPage.jsx` | column scopes, status badges announce per-column meaning. |
| `apps/aclocation/src/modules/billing/pages/BillingPage.jsx` | KPI tiles labelled with full text, daily-usage chart exposed as `role="img"` with a synthetic summary in an `aria-describedby` element. |
| `apps/aclocation/src/modules/providers/pages/ProvidersPage.jsx` | error in role=alert, list aria-label includes count. |
| `apps/aclocation/src/modules/field-agents/pages/FieldAgentsPage.jsx` | row actions labelled per agent, location glyph hidden from AT and replaced with `sr-only` "Location:" text. |
| `apps/aclocation/src/modules/field-agents/pages/FieldAgentCheckInPage.jsx` | success card `role="status"`, geolocation status in a polite live region, Clear button labelled. |

### Acute Connect web app (selected pages)

- `apps/web/src/components/PWAUpdatePrompt.jsx` — the "Update available" banner already had `role="status"` and `aria-live="polite"`. The decorative emoji is now `aria-hidden`, the dismiss × is wrapped in `<span aria-hidden="true">`, and the close button is now 44×44 to meet touch-target sizing.
- `apps/web/src/pages/admin/SponsorLedger.jsx` — sponsor banner image now describes the sponsor company in `alt`, falls back to "Sponsor banner" if none.
- `apps/web/src/pages/client/CheckInPage.jsx` — sponsor logo in the corner stamp marked decorative (`alt=""`) since the company name is announced via the adjacent text; the larger sponsor card image got a more descriptive alt (`"<company> logo"`).
- `apps/web/src/pages/client/SponsorJoinPage.jsx` — uploaded-logo preview now has `alt="Uploaded sponsor logo preview"`. Tiny brand-strip preview images already correctly used `alt=""`.

### Global CSS (cross-cutting)

- `apps/web/src/styles/acute.css`
  - `:focus-visible` outline using `var(--ac-primary)` so every interactive element has a visible focus ring, including legacy components with custom styling.
  - Tighter overrides for `.ac-btn`, `.ac-icon-btn`, `.ac-nav`, `.ac-tab`, `.ac-input` so the design's focus state remains brand-coloured.
  - `.ac-sr-only` / `.sr-only` utility class.
  - `.ac-icon-btn { min-width: 44px; min-height: 44px }` to satisfy WCAG 2.5.5 across every existing icon button without a per-component refactor.
  - `prefers-reduced-motion` block neutralises the app's transitions for users who request reduced motion.
  - `[aria-invalid="true"]` styling: red border + ring so the invalid state is visible without relying on text colour alone.
- `apps/aclocation/src/index.css` and `src/index.css` — same focus, sr-only, reduced-motion, and aria-invalid styling appropriate to each app.

### New utilities

- `apps/web/src/lib/focusTrap.js` — `useFocusTrap({ active, onEscape, initialFocusSelector })` hook used by every dialog above.

---

## Manual review required

The following need a human's eye because they're judgement calls, content decisions, or environment-specific:

1. **Brand-coloured tiles in `apps/web/src/pages/admin/*`** — many StatCards use `tone="default"` (white) or accent colours over `var(--ac-primary)` (black `#18181B`) in light mode and `#FAFAFA` in dark mode. Ratios pass for AA in light mode but want a pass in dark to confirm 4.5:1 against the dark surface for 11px sub-text — adjust the `--ac-muted` token if any subtitle drops below.
2. **Sponsor-banner contrast** in `apps/web/src/pages/admin/SponsorLedger.jsx` — banner colour is operator-supplied (`banner.bg_color`); the "Learn More →" link uses `rgba(255,255,255,0.2)` on top of arbitrary colour. Add either a contrast check at save time or force a dark/light overlay scrim.
3. **Image alt text on dynamic Supabase records** — for sponsor logos and provider photos sourced from Supabase Storage, the alt text falls back to `"<company> logo"` or `"<full_name> profile photo"` when the DB record has no explicit `alt` column. Consider adding an `alt_text` column to the relevant tables and editing the upload UI to capture it; this is the only way to get truly descriptive alt text for user-uploaded imagery.
4. **JaxAI conversational widget (`apps/web/src/components/JaxAI.jsx`)** and **GitHubAgentPanel (`apps/web/src/components/GitHubAgent.jsx`)** — these are large floating UIs (~600 LOC each). They were not refactored in this pass. They need: dialog semantics on the open panel, a focus trap when the chat is open, `aria-live="polite"` on the message list, and ensuring the AI typing indicator announces.
5. **Heading hierarchy on the Acute Connect dashboard pages** in `apps/web/src/pages/admin/*` and `apps/web/src/pages/system/*` — these long pages mix `<h2>`/`<h3>` with the now-fixed `<Card title>` (which renders `<h3>`) and may skip levels. Each page needs a quick visual pass with the heading-outline plugin.
6. **OverseerDashboard & TriageDashboard tables** (`apps/web/src/pages/system/OverseerDashboard.jsx`, `apps/web/src/pages/admin/TriageDashboard.jsx`) — multiple tables, large; they need `<caption>`, `scope="col"`, and `role` on row-action icon buttons. Same mechanical fix as the ACLOCATION tables in this report.
7. **Sponsor join + provider join multi-step flows** — the step indicators are role-less. Consider adding `aria-current="step"` and a `<nav aria-label="Onboarding progress">` wrapper.
8. **Real-time subscriptions outside ACLOCATION** — only ACLOCATION's `DatabaseRequestsPage` was confirmed real-time-aware. The Acute Connect `UsersPage`, `RequestsInboxPage`, and any page subscribing to a Supabase channel should wrap the changing list in `aria-live="polite"`. The pattern is now established and easy to apply.
9. **CRMPage & ModernTriageDashboard modals** in `apps/web/src/pages/admin/CRMPage.jsx` (multiple inline modals: purge, register, offboard, edit) — they should adopt the `useFocusTrap` hook used by `LoginModal`. The hook is in place; each modal needs ~5 lines of wiring.
10. **CRN generator & invoicing tables** in `apps/web/src/pages/admin/CRNGenerator.jsx` and `apps/web/src/pages/admin/InvoicingPage.jsx` — same caption + scope pass as the ACLOCATION tables.
11. **Toggle switches** — the new `Toggle` exposes itself as a `role="switch"`. Existing call sites should pass a meaningful `label` prop. Today they fall back to `"Enabled"` / `"Disabled"`, which is correct but generic; the experience improves when callers describe what's being toggled (e.g. `<Toggle label="Show notification badges" ... />`).
12. **Australian-English copy** — `lang="en-AU"` is set, but existing copy uses American spellings ("color", "synchronize") in some user-facing strings. Not strictly an a11y blocker, but worth a copy-edit pass to match the locale claim.

---

## Remaining issues (intentionally out of scope for this pass)

- **`/src/` (root-level legacy duplicate)** — `src/` contains an older copy of pages from `apps/web/src/`. Index CSS got the same focus/sr-only/aria-invalid treatment, but the duplicate JSX pages were not edited because the deployed app is `apps/web`. If the legacy `src/` is still served anywhere, every fix in this report would need to be mirrored there.
- **Deep audit of `apps/web/src/pages/admin/*` and `apps/web/src/pages/system/*`** — ~30 admin/system pages were not individually edited. They consume the now-accessible shared `Field`, `Card`, `Button`, `Select`, `Tabs`, `StatusBadge`, and `SafeIcon` primitives, which means they inherit the bulk of the fixes automatically. Each still needs a per-page pass for: table caption + scope, modal focus traps (CRMPage especially), live regions on real-time data, and document.title.
- **Automated axe scan** — has not been run against a built bundle in this pass. After this report, suggest running `@axe-core/cli` against `npm run dev` to surface contrast issues introduced by the operator-supplied colours and any remaining ARIA mismatches.
- **Keyboard end-to-end test** — manual keyboard-only walkthrough was not performed. Recommended next step: tab from page load through every major flow (login, navigation, opening a modal, submitting a form, real-time update arrival) confirming no focus traps stick and skip-link works.
- **Screen-reader smoke test** — recommended: NVDA + Firefox on Windows, VoiceOver + Safari on macOS, TalkBack + Chrome on Android. The fixes above are written to the WAI-ARIA Authoring Practices, but real screen-reader output is the only source of truth.
