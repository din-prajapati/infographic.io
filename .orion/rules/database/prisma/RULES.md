---
title: Prisma Rules
type: rules
layer: database
tech: prisma
tags: [orion, rules, database, prisma]
updated: 2026-05-20
---

# Prisma Rules

## Conventions

- [ ] **Single `schema.prisma`** — no split schemas.
- [ ] **`prisma migrate dev` for dev**, `prisma migrate deploy` for staging/prod.
- [ ] **Generated client is gitignored** — re-generated on install.
- [ ] **Select only needed fields** via `select` — never spread full models to clients.
- [ ] **`include` sparingly** — N+1 lurks. Prefer explicit join-then-select.

## Anti-patterns

- [ ] Don't `findUnique` then update — use `update` with `where`.
- [ ] Don't bypass Prisma with `$queryRaw` for plain queries — only for what Prisma can't express.
- [ ] Don't hold a Prisma client across serverless invocations without explicit lifecycle handling.

## References

- ADRs: [docs/agile/decisions/](../../../../docs/agile/decisions/)
