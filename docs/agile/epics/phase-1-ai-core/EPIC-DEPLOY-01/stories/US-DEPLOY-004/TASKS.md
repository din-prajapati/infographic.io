# TASKS — US-DEPLOY-004: Production-grade Migrations

> **Story:** [STORY.md](./STORY.md) · **Branch:** `feat/deploy/us-deploy-004-migrate-deploy`
> **Opened:** 2026-10-01 · **Scope-locked.** Files not listed under "Files in scope" must not be touched.

---

## Why this moved from "non-blocking" to P1

STORY.md's `Depends on` line says *"do NOT do this before beta has real users — `db push` is fine until then."*
**That premise is now obsolete.** The 2026-09-14 → 2026-09-29 outage proved a second, independent failure mode that
has nothing to do with data loss:

> Boot-time `prisma db push` means **the schema is a function of the running build**. Once the DB is ahead of an
> older build, that older build cannot boot — it tries to revert the schema and Prisma refuses. Rollback is
> therefore impossible exactly when you need it most. Filed as **BL-33 (P1)**.

So the driver is **rollback capability**, not only data safety. AC1–AC5 are unchanged and still correct.

---

## Four-Pillars Pre-flight

| Pillar | Status |
|---|---|
| **Brain** (what/why) | STORY.md AC1–AC5 + BL-33. Target: schema changes apply as a *release step*, container boots with `npm start` alone. |
| **Muscle** (how) | Prisma baseline-an-existing-DB flow: `migrate diff --from-empty` → commit `0_init` → `migrate resolve --applied` per env → `migrate deploy` thereafter. Railway `deploy.preDeployCommand` is the release-step hook. |
| **Map** (where) | See "Files in scope". |
| **Env** (what must be true) | ✅ No drift: `migrate diff --from-url <staging> --to-schema-datamodel` returns empty (measured 2026-10-01). ⚠️ Production `DATABASE_URL` is **not** readable from the agent session — the two `migrate resolve` commands are **operator-run** (T4). |

---

## Files in scope

| File | Change |
|---|---|
| `api/prisma/migrations/0_init/migration.sql` | **NEW** — baseline, generated from current schema (AC1) |
| `api/prisma/migrations/migration_lock.toml` | **NEW** — Prisma provider lock |
| `package.json` | `db:deploy` → `prisma migrate deploy`; keep a `db:push` escape hatch for throwaway DBs (AC2) |
| `railway.json` | `startCommand` → `npm start`; add `preDeployCommand` running the migration (AC2) |
| `docs/DEPLOYMENT_STRATEGY.md` | §6 — expand→backfill→contract is now *required*, not "once you have real data" (AC3) |
| `docs/runbooks/MIGRATION_ROLLBACK.md` | **NEW** — failed-migration + Neon branch-restore runbook (AC5) |
| `api/prisma/MIGRATION_INSTRUCTIONS.md` | Point at the new flow; mark the old `db push` instructions superseded |
| `docs/agile/BACKLOG.md` | Mark BL-33 resolved-by-this-story |
| This file + `STORY.md` | Status/closeout |

**Explicitly out of scope** (do not touch, even "while we're here"):
- `api/prisma/migrations/manual_add_payment_models.sql` — pre-existing loose file; leave it. Retro-authoring
  migrations for past `db push` changes is Out of Scope per STORY.md.
- `.github/workflows/deploy.yml` — its `prisma db push` targets an **ephemeral CI Postgres**, which is the correct
  tool there. (Its stale "production deploys on `v*`" header comment is **BL-35**, a separate item.)
- `api/prisma/schema.prisma` — no schema changes in this story.
- The ~30 docs that mention `prisma db push` in a local-dev context. A sweep is its own story.

---

## Tasks

| # | Task | AC | Est | Status |
|---|---|:--:|:--:|:--:|
| T1 | Verify no drift between staging DB and `schema.prisma` | Env | 10 m | ✅ Done — `(EMPTY — no drift)` on `ep-billowing-cell`, 2026-10-01 |
| T2 | Generate + commit baseline `0_init/migration.sql` and `migration_lock.toml` | AC1 | 20 m | ✅ Done — 552 lines, 16 tables |
| T3 | Repoint `db:deploy` → `migrate deploy`; move it out of the container start command into `preDeployCommand` | AC2 | 30 m | 🔲 |
| T4 | **OPERATOR:** `migrate resolve --applied 0_init` on staging + production | AC1 | 10 m | ⚠️ **Partial** — production ✅, staging ❌ (see below) |
| T5 | Verify on staging: clean apply + idempotent re-deploy | AC4 / TC-01, TC-02 | 45 m | ⏸ Blocked on T4-staging |
| T6 | Expand→backfill→contract documented as required pattern | AC3 | 30 m | 🔲 |
| T7 | Rollback runbook: failed migration, Neon branch restore, revert | AC5 / TC-04 | 45 m | 🔲 |
| T8 | Expand→contract dry-run on staging (add col → deploy → drop col → deploy) | TC-03 | 60 m | 🔲 Blocked on T5 |
| T9 | Gate 1 (`tsc --noEmit` + unit tests), closeout, PR | DoD | 30 m | 🔲 |

---

## T4 baseline — measured state (2026-10-01)

Verified by querying `_prisma_migrations` directly, not by trusting the command's exit:

| Env | Neon branch | `_prisma_migrations` | Users | State |
|---|---|---|---|---|
| **production** | `ep-aged-king` / `neondb` | `0_init`, `steps=0`, finished 17:01:52 IST, not rolled back | 8 | ✅ Baselined |
| **staging** | `ep-billowing-cell` / `neondb` | **table does not exist** | 129 | ❌ **Not baselined** |

The staging `railway run ... db:baseline` did not take effect — it was reported run, but the table is absent, so
it never reached the DB. Confirmed that Railway's staging `DATABASE_URL` resolves to the *same* host as local
`.env` (`ep-billowing-cell` / `neondb`), so this is not a wrong-target problem — the command itself failed.

**Re-run needed before T5/T8** (agent cannot: blocked as a shared-resource write):

```bash
railway run --environment staging --service Buildographic -- npm run db:baseline
```

Watch for a non-zero exit. Likely original cause: run from a branch without `api/prisma/migrations/0_init`
(it exists only on `feat/deploy/us-deploy-004-migrate-deploy`, not on `main`), which fails with
`P3017 migration not found`.

> **Note for AC4:** staging is the *harder* of the two to verify precisely because it carries 129 rows and is
> shared with local dev. Production being baselined first is backwards from the intended order but harmless —
> `resolve --applied` executes no DDL.

## Risk register

| Risk | Mitigation |
|---|---|
| `migrate deploy` hits a non-empty DB that was never baselined → **P3005**, deploy aborts | `preDeployCommand` failure **aborts the deploy and leaves the previous version serving**. Fails safe, no data touched. This is why T3 can land before T4 without risk. |
| Someone "fixes" a failed migration with `--accept-data-loss` | Called out explicitly in the AC5 runbook as forbidden; `db push` is renamed to `db:push:unsafe-local` so it cannot be reached by muscle memory in a deploy path. |
| `0_init` drifts from reality before T4 runs | T1's no-drift check is the gate; re-run it immediately before T4. |
| Staging DB **is** the local dev DB (Neon `ep-billowing-cell`) | T4/T5/T8 write to data developers use. `migrate resolve` performs **no DDL**. T8's dry-run column is additive and dropped at the end. |

---

## Decisions taken in session

1. **`preDeployCommand`, not the start command.** Railway runs `preDeployCommand` once per release before any new
   container serves traffic — the "release step" AC2 asks for. Leaving it in `startCommand` would re-run the
   migration on **every container wake**, which matters now that staging scales to zero (see note below).
2. **Operator-run `migrate resolve`.** Production `DATABASE_URL` is unavailable to the agent session by design;
   baselining is two pasted `railway run` commands so credentials never leave Railway.
3. **Rejected: auto-baseline-on-P3005 wrapper.** A script that catches P3005 and self-resolves would remove the
   manual step, but puts schema-mutating magic in the boot path — the exact class of thing BL-33 is about.

> **Adjacent finding (not this story):** staging runs with Railway **scale-to-zero**. A cold `/api/v1/health` 502s
> for ~15–20 s before serving. `PLAYWRIGHT_BASE_URL` defaults to staging, so an E2E run started cold sees failures
> that look like product bugs. Filed as **BL-36**.
