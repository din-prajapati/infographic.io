# Story Card — US-DEPLOY-004

> **Status:** ✅ Done — 2026-10-01
> **Feature:** F-DEPLOY-04 — Production-grade Migrations
> **Epic:** [EPIC-DEPLOY-01](../../EPIC.md) · **Milestone:** [M-DEPLOY-01](../../milestones/M-DEPLOY-01-velocity-foundation.md)
> **Size:** M · **Estimate:** 1 day · **Created:** 2026-07-13 · **Closed:** 2026-10-01
> **Branch:** `feat/deploy/us-deploy-004-migrate-deploy` · **Tasks:** [TASKS.md](./TASKS.md)
>
> ~~**Depends on:** production has real data (do NOT do this before beta has real users — `db push` is fine until
> then). **Non-blocking to beta launch.**~~ — **superseded 2026-10-01.** The 2026-09-14→29 outage proved a second
> failure mode independent of data loss: boot-time `db push` makes the schema a function of the running build, so
> once the DB is ahead, **older builds cannot boot** and rollback is impossible. Promoted to P1 as **BL-33**.

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

- [x] **AC1 [happy-path]:** A **baseline migration** capturing the current schema is generated and committed (`prisma migrate diff`/`resolve`).
      → `api/prisma/migrations/0_init/migration.sql` (552 lines, 16 tables, 4 enums) + `migration_lock.toml`.
      Both live DBs baselined with `npm run db:baseline`; verified by querying `_prisma_migrations` directly:
      production `ep-aged-king` ✅, staging `ep-billowing-cell` ✅. No drift at baseline time (`migrate diff` empty).
- [x] **AC2 [happy-path]:** `db:deploy` switches from `prisma db push` → `prisma migrate deploy`, running **before** the app process starts (Railway start command / `railway.json`).
      → `railway.json`: `preDeployCommand: npm run db:deploy`, `startCommand: npm start`. `preDeployCommand` is a
      *release* step, so it runs once per deploy rather than on every container wake — which matters now that
      staging scales to zero. Old behaviour preserved as `db:push:unsafe-local` for throwaway local DBs only.
- [x] **AC3 [documentation]:** The **expand → backfill → contract** convention is documented as the required pattern for any schema change.
      → `docs/DEPLOYMENT_STRATEGY.md` §6, rewritten from "switch once you have real data" to in-force policy,
      with the forbidden operations named explicitly.
- [x] **AC4 [idempotency]:** Verified on the Neon **staging** branch: `migrate deploy` applies cleanly on a fresh boot and is idempotent on re-deploy.
      → TC-01/TC-02 below. Run against a throwaway database on the staging endpoint, not against `neondb`
      (129 rows of shared dev/staging data); dropped after. Staging `neondb` re-verified intact afterwards.
- [x] **AC5 [error-path]:** A rollback/hotfix note documents how to handle a failed migration (Neon branch restore + revert).
      → `docs/runbooks/MIGRATION_ROLLBACK.md` — P-code triage table, the three rollback classes, and the
      `--accept-data-loss` prohibition.

## Out of Scope
- Retroactively authoring migrations for past `db push` changes beyond the single baseline.
- Zero-downtime online schema-change tooling (pt-osc/gh-ost) — not needed at this scale.

## Primary files
- `package.json` (`db:deploy`) · `railway.json` (start command) · `api/prisma/migrations/**` (new baseline)
- `docs/DEPLOYMENT_STRATEGY.md` §6

## Test Cases
| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DEPLOY-004-01 | Manual | P0 | Given a fresh Neon branch, when `migrate deploy` runs, then the schema is applied and `_prisma_migrations` is populated | ✅ | **Pass 2026-10-01.** Empty DB (0 public tables) → `Applying migration 0_init` → **16 tables + 4 enum types**, `_prisma_migrations` 1 row, `steps=1`, `finished_at` set, exit 0. Used a throwaway DB on the staging endpoint rather than a Neon branch (no Neon API creds in session; Docker daemon not running, `psql` absent) — equivalent isolation, and dropped afterwards. |
| TC-DEPLOY-004-02 | Manual | P1 | Given the same migration version, when `migrate deploy` re-runs, then it is a no-op (idempotent) | ✅ | **Pass 2026-10-01.** `No pending migrations to apply.`, exit 0 — confirmed both on the baselined staging DB and twice on the scratch DB (after expand, after contract). |
| TC-DEPLOY-004-03 | Manual | P1 | Given an expand→contract dry-run (add col, deploy, drop col, deploy), when each step runs, then old and new code both boot successfully at each step | ⚠️ | **Pass with finding 2026-10-01.** expand → column present; pre-expand column list still inserted+selected fine while the DB was one step ahead (the rolling-deploy guarantee); contract → column gone. Each step applied **exactly one** migration, in order, and re-ran as a no-op. **Finding — first harness was invalid:** it "hid" parked migrations by renaming them with a `_` prefix, but `_0001_…` is still a valid Prisma migration name, so they were applied too; the column was added and dropped twice and the assertions passed only by lexicographic coincidence. Re-run with parked dirs moved outside `prisma/migrations` and a fresh DB. *Verified via raw SQL for the old-code probe, not by booting two app builds — the app-boot half of this TC is still unproven.* |
| TC-DEPLOY-004-04 | Manual | P1 | Given a migration fails mid-deploy, when the operator consults the rollback note (AC5), then it gives clear, actionable steps to restore the previous good state | ⚠️ | **Written, not rehearsed.** `docs/runbooks/MIGRATION_ROLLBACK.md` exists and its §A P-code triage is grounded in errors actually seen (P3005 reproduced; `57P01` observed in staging logs). **§C (Neon point-in-time restore) has never been executed** — the restore-window length is unconfirmed and the steps are from documentation, not practice. Treat §C as untested until a real drill. |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done
- [x] ACs ✅ · baseline migration committed · verified on staging Neon branch · docs updated · PR merged

### Gate 1 evidence (2026-10-01)
- `npx tsc --noEmit` in `api/` → **exit 0**
- `npx vitest run --config vitest.config.ts` in `api/` → **45 files, 628/628 passed**
- No application code changed in this story — config (`railway.json`, `package.json`), migrations and docs only.

### Post-deploy verification — PR #56 (2026-10-01)

Squash-merged as `0efcb79` at 14:20:20Z. Both environments redeploy from `main`, so both swapped:
production at **t+173 s**, staging at **t+194 s** (detected by `commitSha` advancing *and* `uptime` resetting —
not by elapsed time, per the handoff's warning about measuring a container that hasn't swapped).

| Check | Production | Staging |
|---|---|---|
| `commitSha` | `0efcb79` | `0efcb79` |
| `preDeployCommand` actually ran | ✅ `> prisma migrate deploy --schema=api/prisma/schema.prisma` | ✅ same |
| Migration outcome | `1 migration found` → `No pending migrations to apply.` | same |
| `prisma db push` in boot log | **absent** (was the whole point) | **absent** |
| `/api/v1/health` | `ok`, db connected | `ok`, db connected |
| `/api/v1/pricing` · `/` | 200 · 200 | 200 · 200 |
| Data | 8 users | 129 users, `0_init` intact |

The one genuinely unknown was whether Railway honours `preDeployCommand` from `railway.json` at all — a silent
no-op would have left migrations unrun with nothing complaining until the next schema change. It was checked
against Railway's config schema beforehand and confirmed in the boot logs afterwards.

### Carried forward (not blockers for this story)
1. **TC-03's app-boot half is unproven.** The old-code guarantee was shown at the SQL level, not by booting an
   older build against the migrated DB. A real rehearsal belongs with the next actual schema change.
2. **Rollback runbook §C is untested.** Neon point-in-time restore has never been executed here and the retention
   window is unconfirmed. Worth a deliberate drill on a throwaway branch.
3. **`manual_add_payment_models.sql`** still sits loose in `api/prisma/migrations/` — not a Prisma migration
   directory, so `migrate deploy` ignores it (confirmed: "1 migration found"). Left in place per Out of Scope.
4. **Staging is not an isolated environment** — its DB *is* the local dev DB (`ep-billowing-cell`, 129 rows), while
   production is `ep-aged-king` (8 rows). `DEPLOYMENT_STRATEGY.md` §6 specifies a dedicated staging Neon branch;
   never implemented. This is why AC4 had to be verified on a throwaway DB instead of staging itself.
