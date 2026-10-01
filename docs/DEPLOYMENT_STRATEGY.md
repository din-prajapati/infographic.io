# Deployment Strategy — InfographicEditor-Unified

> How this product flows from a developer's laptop to customers across **dev → preview → staging → production**, how we ship features fast and safely, and the platform-specific reality of **Railway database branching**.

**Stack context:** Express proxy (`server/index.ts`, port 5000) + NestJS API (`api/src/main.ts`, port 3001) + Vite/React client + Prisma 6 on PostgreSQL. Single deployable web process (Express spawns NestJS as a child and serves the built client from `dist/public`). See `CLAUDE.md` for the three-server topology.

---

## 1. TL;DR — the operating model

Fast SaaS teams (Cursor, Vercel, Linear, Stripe-style) ship many times a day because every change is **small, automatically verified, independently releasable, and instantly reversible**. The mechanics:

1. **Trunk-based development** — one always-deployable `main`; short-lived feature branches; small PRs.
2. **Preview environment per PR** — reviewers/PMs/QA click a live URL instead of pulling the branch.
3. **Deploy ≠ Release** — merge & deploy continuously; expose features via **feature flags**, not by holding branches back.
4. **Progressive delivery** — roll new prod versions to 1% → 10% → 100% with health checks + auto-rollback.
5. **Fast CI gate** — typecheck + unit + E2E must be green to merge (our `verification-gates` Gate 1).
6. **Backward-compatible DB migrations** — expand → backfill → contract so old and new code run side-by-side during a rollout.

---

## 2. Environment model

| Env | Trigger | Database | Secrets | Audience |
|---|---|---|---|---|
| **Local/dev** | `npm run dev` | Local Postgres or a personal cloud DB | `.env` (from `.env.development.example`) | Each engineer |
| **Preview (ephemeral)** | PR opened | Fresh, empty Postgres per PR (see §6) | Inherited test secrets | Reviewers, QA, design, PM |
| **Staging** | Merge to `main` | Prod-shaped, anonymized | Razorpay **TEST** keys, test plan IDs | Automated E2E + manual QA |
| **Production** | Tag / manual promote | Real data, backups enabled | Razorpay **LIVE** keys, live plan IDs | Customers |

The repo already anticipates the secret split: `.env.development.example` (TEST keys) vs `.env.production.example` (LIVE keys).

---

## 3. Branching & release flow

```
feature branch ──PR──► CI (check + unit + e2e) + Preview env
        │
        ▼  (squash merge, small)
      main ───────► auto-deploy STAGING ──► full E2E + migration check
        │
        ▼  (tag v* / "Promote" in Railway)
   PRODUCTION (canary 1%→100%, health-gated, auto-rollback)
```

- `main` is **always deployable**. Incomplete work merges **dark** behind a flag.
- One story per branch (see `docs/agile/GIT_STRATEGY.md`); PR body built from `STORY.md`/`TASKS.md` (see `.cursor/rules/pr-workflow.mdc`).
- No `Made-with: Cursor` trailers in commits (`.cursor/rules/commit-messages.mdc`).

---

## 4. Deploy ≠ Release: feature flags

> **Deploy** = code is on the server (frequent, automated). **Release** = users can see it (a flag flip, instant, reversible).

For this product, a minimal flag system is enough to start:

- **Env-var flags** per environment, e.g. `FEATURE_AI_V2_ENABLED=true` in staging only. Railway makes per-environment variable overrides trivial.
- Graduate to a **`flags` table** or a service (Unleash/Flagsmith/LaunchDarkly) when you need per-user/percentage targeting.

Example use: ship a new AI generation pipeline to `main`, deploy it dark, enable it for staging + your own account, then flip it on for a % of FREE-tier users.

---

## 5. CI/CD pipeline (recommended GitHub Actions)

On **every PR**:
```
npm run check          # tsc typecheck
npm run test:unit      # api/tests/**/*.spec.ts (mock-based, no DB)
npm run build          # vite + esbuild must succeed
npx playwright test    # E2E gate (e.g. e2e/us-design-003-generation-ux.spec.ts)
```
On **merge to main**: deploy staging → run full E2E + `prisma migrate` dry-check.
On **tag**: promote to production (canary).

Keep the pipeline **< ~10 min** (parallelize, cache `node_modules` + Playwright browsers). Slow CI is the #1 silent velocity killer. The gate maps directly to our `verification-gates` skill — Gate 1 (TypeScript + unit) is mandatory and never skipped silently.

---

## 6. Database strategy — and the Railway branching reality

### Does Railway support DB branching?

**No — Railway has no native database branching** (as of 2026). This is the key difference from Neon/PlanetScale:

| Capability | Railway | Neon | PlanetScale |
|---|---|---|---|
| Native instant DB branch (copy-on-write) | ❌ | ✅ | ✅ |
| Per-PR **empty** Postgres (PR environments) | ✅ | ✅ | ✅ |
| Per-PR **prod-data** branch automatically | ❌ (manual) | ✅ | ✅ |
| Backups / scheduled backups | ✅ (Pro plan) | ✅ | ✅ |
| Managed (HA, autoscale) Postgres | ⚠️ unmanaged container | ✅ | ✅ |

**What Railway actually does:** when you enable **PR environments**, each PR spins up a *fully isolated* copy of every service — including Postgres — with **fresh, empty volumes and regenerated credentials**. There is no copy-on-write clone of production data.

**Ways to get prod-like data in a Railway preview/staging:**
1. **`pg_dump` + `pg_restore`** between instances (Railway's recommended manual path) — connect to both via their TCP proxy URLs.
2. **Postgres Migrator template** — deploy `SOURCE_DATABASE_URL`/`TARGET_DATABASE_URL` as a task-runner service for repeatable env cloning/backups.
3. **Point a preview app at a shared DB** — override `DATABASE_URL` in the PR environment to a dedicated shared/anonymized instance (use the **public** URL; private networking does not cross environments).

> **Decision (locked 2026-06-03): Neon for the database + Railway for app hosting.**
> We use **Neon** Postgres (for its native, copy-on-write **database branching**) and **Railway only to host the app**. Each environment points `DATABASE_URL` at a dedicated **Neon branch**:
> - `production` → Neon `main`/`production` branch
> - `staging` → a long-lived Neon `staging` branch
> - each **PR/preview** → an ephemeral Neon branch off production (instant, prod-shaped data)
>
> Do **not** add a Railway Postgres service. The app is a single always-on container, so use Neon's **direct (non-pooled)** connection string as `DATABASE_URL` (simplest + correct for a long-lived server). Pooled endpoint + `pgbouncer=true` is optional and only worth it at high concurrency. See `.env.production.example` for the exact format. `db:deploy` (`prisma migrate deploy`) runs as a **pre-deploy release step** against the target Neon branch — not at container start, see Migrations below — and `templates.service` auto-seeds templates on first boot.

### Migrations (production-grade)

> **Status: in force since US-DEPLOY-004 (2026-10-01).** Migrations run as a **release step**
> (`railway.json` → `deploy.preDeployCommand`), never from the container start command.
> `prisma db push` is **not** a deployment tool here.

**The rule:** the schema is advanced by a committed, versioned migration — never as a side effect of a container
booting. `npm run db:deploy` is `prisma migrate deploy`; the container starts with `npm start` alone.

**Why this is not optional** (learned the hard way, BL-33): with `db push` on boot, the schema is a function of
*whichever build happens to start*. Once the DB is ahead of an older build, that build **cannot boot** — it tries to
revert the schema and Prisma refuses. Rollback becomes impossible exactly when you need it. Reaching for
`--accept-data-loss` to unblock it destroys live data silently. A release-step migration makes the schema move
forward once, deliberately, with a recorded history.

**Expand → backfill → contract is required for every schema change.** Not a best-effort nicety — the migration is
rejected in review without it:

1. **Expand** — add the new column/table, nullable or defaulted, backward compatible → deploy.
2. **Backfill + dual-write** — populate it; new code writes both old and new → deploy.
3. **Contract** — drop the old column only once nothing reads it → deploy.

Each step is independently deployable *and independently revertible*, which is what lets old + new app versions run
simultaneously during a rolling deploy. A single migration that adds and removes in one step forfeits that.

**Never, in a migration that touches a table with real rows:** drop or rename a column in the same release that
stops writing it; add a `NOT NULL` column without a default; or change a column's type in place.

- Baseline: `api/prisma/migrations/0_init/` captures the schema as of 2026-10-01. A new environment gets it applied
  by `migrate deploy`; the two pre-existing DBs were baselined with `npm run db:baseline`.
- Local throwaway DBs only: `npm run db:push:unsafe-local`. The name is deliberate — it must never appear in a
  deploy path.
- When a migration fails mid-deploy: **[docs/runbooks/MIGRATION_ROLLBACK.md](runbooks/MIGRATION_ROLLBACK.md)**.

---

## 7. Observability

- **Errors:** Sentry — already wired (`SENTRY_DSN`, `VITE_SENTRY_DSN`).
- **Health:** `GET /api/health` proxies to NestJS + pings the DB (503 if DB down). Use `/` for the platform healthcheck so the app is marked live independent of DB warm-up (configured in `railway.json`).
- **Logs/metrics/traces:** Railway logs by default; add OpenTelemetry → Grafana/Datadog as you scale.
- **Alerts:** define SLOs (error rate, p95 latency) and wire them to auto-halt canary rollouts.

---

## 8. This repo on Railway — concrete setup

Already in the repo:
- **`railway.json`** — `build`: `npm run prisma:generate && npm run build`; `preDeploy`: `npm run db:deploy` (migrations as a release step); `start`: `npm start`; healthcheck `/api/health`; restart on failure.
- **`.nvmrc`** — pins Node 22 (also `engines` in `package.json`).
- **`db:deploy`** — `prisma migrate deploy` against the target DB, as a pre-deploy release step.
- **Runtime deps** — `tsx` + `cross-env` moved to `dependencies` (the prod server spawns `npx tsx api/src/main.ts`).
- **Cross-platform listen fix** — `server/index.ts` only sets `reusePort: true` on non-Windows (it is supported on Railway's Linux; it throws `ENOTSUP` on Windows).

### Environments to create on Railway (DB lives on Neon)
- `production` (protected; deploy from tag/manual promote; LIVE Razorpay keys) → Neon production branch.
- `staging` (auto-deploy on merge to `main`; TEST Razorpay keys) → Neon `staging` branch.
- **PR environments** enabled (ephemeral app) → each points `DATABASE_URL` at a fresh **Neon branch** (create via Neon API/CLI in CI, or share a staging branch initially).
- **Do not** run `railway add --database postgres` — the DB is on Neon.

### Required variables per environment
| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | **Neon branch** connection string (direct/non-pooled, `?sslmode=require`). One Neon branch per env. |
| `NODE_ENV` | ✅ | `production` for staging/prod |
| `JWT_SECRET`, `SESSION_SECRET` | ✅ | unique per env |
| `OPENAI_API_KEY` | ✅ | GPT-4o layout |
| `IDEOGRAM_API_KEY` | ✅ | image render (US-DESIGN-003 AC3) |
| `PORT` | ⛔ | injected by Railway — never set manually |
| `GOOGLE_*`, `RAZORPAY_*`, `STRIPE_*` | optional | per-feature; TEST vs LIVE by env |

> Full step-by-step: see `docs/setup/RAILWAY_NEON_DEPLOY.md`.

---

## 9. Why this ships features fast (summary)

| Lever | Effect |
|---|---|
| Trunk-based + small PRs | Less merge conflict, faster review, easy revert |
| Preview env per PR | Stakeholders verify without local setup |
| Fast automated test gate | Trust the suite → no manual re-verification |
| Deploy ≠ release (flags) | Merge unfinished work safely; release = flip a flag |
| Progressive rollout + auto-rollback | Bad deploys hit 1%, not 100% |
| Backward-compatible migrations | Schema changes never block a rolling deploy |

**The speed never comes from skipping safety — it comes from shrinking the blast radius of every change and making rollback instant.**

---

## 10. Suggested next steps for this repo

1. Add `.github/workflows/ci.yml` running the Gate 1 + E2E pipeline on PRs.
2. ✅ **Decided: Neon (DB) + Railway (app hosting)** — see §6. Follow `docs/setup/RAILWAY_NEON_DEPLOY.md`.
3. ✅ **Done (US-DEPLOY-004, 2026-10-01):** `db:deploy` is `prisma migrate deploy`, run as a pre-deploy release step; baseline `0_init` committed. See §6 Migrations.
4. Create Railway `staging` + `production` environments with the variable matrix in §8 (each `DATABASE_URL` → its own Neon branch).
5. Introduce a minimal feature-flag mechanism (env var first, `flags` table later).

---

## 11. Approval model & roles (solo → team)

> Full story: [US-DEPLOY-006](agile/epics/phase-1-ai-core/EPIC-DEPLOY-01/stories/US-DEPLOY-006/STORY.md).

Two different questions get asked about every change, and conflating them is what makes teams slow: **"is the code
correct"** (an engineering question) vs. **"are users allowed to see it"** (a business question). Keeping them
separate is what lets deploy ≠ release (§4) actually work.

| Approval surface | Question it answers | Enforced by | Who, today (solo) | Who, later (team) |
|---|---|---|---|---|
| **Automated gate** | Is the code correct? | CI required status check (branch protection) | You | Engineering |
| **Preview verification** | Does it behave correctly? | A checklist against the preview URL (§6) | You | QA / Design |
| **Release control** | Are users allowed to see it? | A feature-flag flip (§4) | You | Product / Business |

**Definition of Merge:** green CI + `smoke:boot` passed + any DB-migration approach or flag plan noted in the PR
description (see the PR template's Merge checklist).

**Definition of Release:** the relevant flag is flipped for the intended audience — separate from, and often much
later than, merge.

Business/release approval should never require reading code — it is a preview link plus a flag toggle, by
construction. The checklists you complete solo today (PR-template Merge checklist, Preview-verified checklist,
Release checklist) are the exact same artifacts a second reviewer or a Product owner steps into once the team
grows — nothing gets redesigned when that happens, only re-assigned.

---

*Created: 2026-06-03 · Owner: Dinesh · Companion to `CLAUDE.md`, `docs/agile/GIT_STRATEGY.md`, `railway.json`.*
