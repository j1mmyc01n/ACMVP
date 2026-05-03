# AGENTS.md — AI Agent Capabilities

This document describes the AI agent layer in Acute Connect and the conventions for extending it.

## Agent Packages

### `@acmvp/ai` — Core AI Package

Located at `packages/ai/`. Contains:

| File | Purpose |
|------|---------|
| `src/triage.ts` | Patient triage scoring engine |
| `src/prompts/index.ts` | System prompts for each agent type |
| `src/components/JaxAI.jsx` | JaxAI conversational assistant UI |
| `src/components/GitHubAgent.jsx` | GitHub code assistant UI |

### Netlify Function

`apps/web/netlify/functions/github-agent.mts` — Server-side proxy for the GitHub agent. Requires `GITHUB_TOKEN` and `OPENAI_API_KEY`.

## JaxAI

JaxAI is the platform's conversational clinical assistant. It helps staff with:
- Triage decision support
- Client escalation recommendations
- Documentation queries

Current state: **UI stub** — no live AI calls yet. See `packages/ai/src/triage.ts` for the rule-based triage engine.

To activate: Set `OPENAI_API_KEY` in environment and implement `callAgent()` in `packages/ai/src/triage.ts`.

## GitHub Agent

The GitHub Agent helps with:
- Code review and explanation
- PR creation from natural language
- Issue creation and management

Current state: **Connected** — requires `GITHUB_TOKEN` and `OPENAI_API_KEY` secrets.

## Triage Engine

`triagePatient(patient)` in `@acmvp/ai`:
- Input: patient record with `mood` (0–10) and other fields
- Output: `{ priority, mood_score, alert_flags, recommended_action, confidence, summary }`
- Current: rule-based stub
- Future: OpenAI GPT-4 with clinical prompt

## Extending the AI Layer

1. Add new agent functionality to `packages/ai/src/`
2. Add new prompts to `packages/ai/src/prompts/`
3. Add a new Netlify function in `apps/web/netlify/functions/` if server-side proxying is needed (to avoid CORS and protect API keys)
4. Import from `@acmvp/ai` in the relevant module — do **not** add direct OpenAI/Claude imports in `apps/web/src/`

## Security

- **Never** expose `OPENAI_API_KEY` in client-side code
- All AI API calls must go through Netlify functions or Supabase edge functions
- User data sent to AI models must be anonymised (no PII in prompts)
