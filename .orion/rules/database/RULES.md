---
title: Database Rules
type: rules
layer: database
tags: [orion, rules, database]
updated: 2026-05-20
---

# Database Rules

> Cross-tech database conventions. Tech-specific in `database/<tech>/RULES.md`.

## Conventions

- [ ] **Migrations are forward-only.** Roll forward to fix; don't roll back in production.
- [ ] **One migration per merge** — keeps schema changes reviewable.
- [ ] **Index foreign keys + frequent WHERE columns.** Verify with EXPLAIN before merging hot-path queries.
- [ ] **Soft delete via `deleted_at` timestamp**, not boolean flag.
- [ ] **Timestamps in UTC** — store with timezone or document the convention.
- [ ] **IDs:** UUID v7 or auto-int — pick one per project, never mix.

## Anti-patterns

- [ ] Don't run destructive migrations without a backup and a verified restore drill.
- [ ] Don't NULL-able new columns on big tables — backfill in a separate step.
- [ ] Don't use raw SQL in service layer — go through the ORM unless flagged with a comment.

## References

- ADRs on schema strategy: [docs/agile/decisions/](../../../docs/agile/decisions/)
