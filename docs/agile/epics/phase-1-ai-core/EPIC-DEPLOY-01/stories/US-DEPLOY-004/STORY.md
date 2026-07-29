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

- [ ] **AC1 [happy-path]:** A **baseline migration** capturing the current schema is generated and committed (`prisma migrate diff`/`resolve`).
- [ ] **AC2 [happy-path]:** `db:deploy` switches from `prisma db push` → `prisma migrate deploy`, running **before** the app process starts (Railway start command / `railway.json`).
- [ ] **AC3 [documentation]:** The **expand → backfill → contract** convention is documented as the required pattern for any schema change.
- [ ] **AC4 [idempotency]:** Verified on the Neon **staging** branch: `migrate deploy` applies cleanly on a fresh boot and is idempotent on re-deploy.
- [ ] **AC5 [error-path]:** A rollback/hotfix note documents how to handle a failed migration (Neon branch restore + revert).

## Out of Scope
- Retroactively authoring migrations for past `db push` changes beyond the single baseline.
- Zero-downtime online schema-change tooling (pt-osc/gh-ost) — not needed at this scale.

## Primary files
- `package.json` (`db:deploy`) · `railway.json` (start command) · `api/prisma/migrations/**` (new baseline)
- `docs/DEPLOYMENT_STRATEGY.md` §6

## Test Cases
| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DEPLOY-004-01 | Manual | P0 | Given a fresh Neon branch, when `migrate deploy` runs, then the schema is applied and `_prisma_migrations` is populated | 🔲 | |
| TC-DEPLOY-004-02 | Manual | P1 | Given the same migration version, when `migrate deploy` re-runs, then it is a no-op (idempotent) | 🔲 | |
| TC-DEPLOY-004-03 | Manual | P1 | Given an expand→contract dry-run (add col, deploy, drop col, deploy), when each step runs, then old and new code both boot successfully at each step | 🔲 | |
| TC-DEPLOY-004-04 | Manual | P1 | Given a migration fails mid-deploy, when the operator consults the rollback note (AC5), then it gives clear, actionable steps to restore the previous good state | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done
- [ ] ACs ✅ · baseline migration committed · verified on staging Neon branch · docs updated · PR merged
