# Story Card — US-DEPLOY-004

> **Status:** 🔲 Not Started
> **Feature:** F-DEPLOY-04 — Production-grade Migrations
> **Epic:** [EPIC-DEPLOY-01](../../EPIC.md) · **Milestone:** [M-DEPLOY-01](../../milestones/M-DEPLOY-01-velocity-foundation.md)
> **Size:** M · **Estimate:** 1 day · **Created:** 2026-07-13
> **Depends on:** production has real data (do NOT do this before beta has real users — `db push` is fine until then).
> **Non-blocking to beta launch.**

---

## Story

*As an* operator deploying schema changes to a database with real customer data
*I want* versioned, backward-compatible migrations that run as a release step before new code starts
*So that* a schema change never destroys data and old + new app versions can run side-by-side during a rolling deploy.

---

## Context

`db:deploy` currently runs `prisma db push` (schema-only, no history) — correct for a fresh DB, **unsafe once real
data exists** (can drop columns without a migration trail). Strategy §6/§10 prescribes switching to
`prisma migrate deploy` with a committed baseline, following **expand → backfill → contract**.

## Acceptance Criteria

- [ ] **AC1:** A **baseline migration** capturing the current schema is generated and committed (`prisma migrate diff`/`resolve`).
- [ ] **AC2:** `db:deploy` switches from `prisma db push` → `prisma migrate deploy`, running **before** the app process starts (Railway start command / `railway.json`).
- [ ] **AC3:** The **expand → backfill → contract** convention is documented as the required pattern for any schema change.
- [ ] **AC4:** Verified on the Neon **staging** branch: `migrate deploy` applies cleanly on a fresh boot and is idempotent on re-deploy.
- [ ] **AC5:** A rollback/hotfix note documents how to handle a failed migration (Neon branch restore + revert).

## Out of Scope
- Retroactively authoring migrations for past `db push` changes beyond the single baseline.
- Zero-downtime online schema-change tooling (pt-osc/gh-ost) — not needed at this scale.

## Primary files
- `package.json` (`db:deploy`) · `railway.json` (start command) · `api/prisma/migrations/**` (new baseline)
- `docs/DEPLOYMENT_STRATEGY.md` §6

## Test Cases
| TC | Scenario | Expect |
|----|----------|--------|
| TC-01 | Fresh Neon branch + `migrate deploy` | schema applied, `_prisma_migrations` populated |
| TC-02 | Re-deploy same version | no-op, idempotent |
| TC-03 | Expand→contract dry-run (add col, deploy, drop col, deploy) | old+new code both boot at each step |

## Definition of Done
- [ ] ACs ✅ · baseline migration committed · verified on staging Neon branch · docs updated · PR merged
