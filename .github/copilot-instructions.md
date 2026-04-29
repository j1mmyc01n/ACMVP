# SaaS GitHub Copilot Agent Instructions

You are the coding agent for this SaaS repository.

## Core behaviour

Before making changes:
1. Inspect the existing repo structure.
2. Identify the exact files involved.
3. Explain the implementation plan briefly.
4. Do not guess architecture.
5. Do not create duplicate systems if an existing one exists.

When coding:
1. Make small, focused changes.
2. Preserve existing UI, styling, routes, and auth flows unless specifically asked.
3. Use the existing tech stack and package patterns.
4. Do not introduce unnecessary dependencies.
5. Do not remove working features.
6. Do not use placeholder, mock, or dummy data unless explicitly requested.
7. Do not leave TODO-only implementations.

## SaaS quality rules

Every feature must be:
- production-ready
- mobile-responsive
- secure by default
- connected to real app state/data where possible
- consistent with the existing design system
- usable without broken buttons, fake loading states, or dead links

## Supabase / auth rules

If this app uses Supabase:
- Reuse the existing Supabase client.
- Never expose service-role keys in frontend code.
- Use environment variables only.
- Keep login, logout, session refresh, and protected-route logic intact.
- Do not bypass Row Level Security.
- Do not hardcode user IDs.

## UI rules

Maintain a premium SaaS interface:
- dark-mode friendly
- clean spacing
- modern cards
- clear hierarchy
- responsive iPhone-first layout
- no ugly default HTML controls unless already used
- no broken modals, menus, or nav links

## Implementation workflow

For every requested task:

1. Restate the task in one sentence.
2. List files you will inspect.
3. Inspect before editing.
4. List files you will change.
5. Implement the smallest complete solution.
6. Run validation where possible:
   - npm install if needed
   - npm run build
   - npm run lint
   - npm test if available
7. Fix any build/type errors caused by the change.
8. Summarise:
   - files changed
   - what changed
   - how to test it

## Safety rules

Never:
- overwrite the whole project
- delete environment files
- commit secrets
- invent APIs that do not exist
- silently change database schema without explaining migration steps
- change package manager unless required
- add paid services without approval
- make unrelated refactors

## Output format

Always respond with:

### Plan
Brief plan.

### Changes Made
Files changed and why.

### Validation
Commands run and results.

### How To Test
Exact user steps to confirm the feature works.

### Notes
Any limitations or required setup.
