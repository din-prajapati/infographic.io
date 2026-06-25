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
> Do **not** add a Railway Postgres service. The app is a single always-on container, so use Neon's **direct (non-pooled)** connection string as `DATABASE_URL` (simplest + correct for a long-lived server). Pooled endpoint + `pgbouncer=true` is optional and only worth it at high concurrency. See `.env.production.example` for the exact format. The `db:deploy` script still runs `prisma db push` against the target Neon branch at container start, and `templates.service` auto-seeds templates on first boot.

### Migrations (production-grade)

The first fresh deploy uses `prisma db push` (fast, schema-only — see `package.json` `db:deploy`). Once you have real data, switch to **`prisma migrate deploy`** as a **release step that runs before new code starts**, and follow **expand → contract**:

1. **Expand** — add new column/table (backward compatible) → deploy.
2. **Backfill + dual-write** → deploy.
3. **Contract** — drop the old column once nothing reads it → deploy.

This guarantees old + new app versions can run simultaneously during a rolling deploy.

---

## 7. Observability

- **Errors:** Sentry — already wired (`SENTRY_DSN`, `VITE_SENTRY_DSN`).
- **Health:** `GET /api/health` proxies to NestJS + pings the DB (503 if DB down). Use `/` for the platform healthcheck so the app is marked live independent of DB warm-up (configured in `railway.json`).
- **Logs/metrics/traces:** Railway logs by default; add OpenTelemetry → Grafana/Datadog as you scale.
- **Alerts:** define SLOs (error rate, p95 latency) and wire them to auto-halt canary rollouts.

---

## 8. This repo on Railway — concrete setup

Already in the repo:
- **`railway.json`** — `build`: `npm run prisma:generate && npm run build`; `start`: `npm run db:deploy && npm start`; healthcheck `/`; restart on failure.
- **`.nvmrc`** — pins Node 22 (also `engines` in `package.json`).
- **`db:deploy`** — `prisma db push` against the target DB at container start.
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
3. Switch `db:deploy` from `prisma db push` to `prisma migrate deploy` once prod has real data; commit a baseline migration.
4. Create Railway `staging` + `production` environments with the variable matrix in §8 (each `DATABASE_URL` → its own Neon branch).
5. Introduce a minimal feature-flag mechanism (env var first, `flags` table later).

---

*Created: 2026-06-03 · Owner: Dinesh · Companion to `CLAUDE.md`, `docs/agile/GIT_STRATEGY.md`, `railway.json`.*
