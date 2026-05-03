# Database Migration Ordering

This folder contains the consolidated migration history for Acute Connect.

## Two source tracks

| Track | Source | Description |
|-------|--------|-------------|
| Monolithic | `supabase/migrations/` | Initial full-schema snapshots (prefix `20240*`) |
| Incremental | `src/supabase/migrations/` | Feature-by-feature incremental migrations (prefix `1777*` / `1740*`) |

## Execution order

Apply **all** files in ascending filename order. The timestamp prefix determines order.

```
1740395000000_initial_schema.sql      ← earliest baseline
1777020684735-fix_policies_and_clients.sql
1777025000000-open_access_and_admins.sql
...
20240101000000_initial_schema.sql     ← monolithic baseline (overlaps; idempotent via CREATE IF NOT EXISTS)
20240102000000_addon_billing.sql
...
```

> **Note**: The monolithic `20240*` migrations were written to be idempotent (`CREATE TABLE IF NOT EXISTS`, `DO $$ BEGIN ... EXCEPTION WHEN ... END $$`).
> Run the incremental track first, then the monolithic snapshots to fill any gaps.

## Seed data

See `seed/` for development seed scripts.
