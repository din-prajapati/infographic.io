# Architecture Recommendations — InfographicAI

> **Purpose:** Architecture evolution strategy based on comparison with Cal.com's architecture
> **Written:** February 2026
> **Horizon:** MVP launch (next week) → Post-MVP scale (MRR-triggered)

---

## InfographicAI vs Cal.com — Architecture Comparison

| Dimension | InfographicAI (current) | Cal.com |
|-----------|------------------------|---------|
| **Frontend** | React 18 + Vite (SPA, no SSR) | Next.js 15 (App Router, SSR/SSG) |
| **Routing** | wouter (3KB, client-side only) | Next.js file-based (server-rendered) |
| **Backend API** | Single NestJS REST on :3001 | tRPC (internal) + NestJS Platform v2 + REST v1 |
| **Proxy** | Express on :5000 proxies all `/api/*` | Vercel handles routing (no proxy) |
| **Type safety** | Zod at boundaries, manual `api.ts` bridge | tRPC: types flow end-to-end automatically |
| **Monorepo** | Single `package.json`, 3 flat folders | Turborepo + pnpm workspaces, `apps/` + `packages/` |
| **Shared code** | None — siloed per folder | `@calcom/*` packages shared across all apps |
| **Build caching** | None | Turborepo content-addressed cache |
| **ORM placement** | Prisma inside `api/prisma/` only | Prisma in shared `packages/prisma` |
| **DB migrations** | `prisma db push` (no history) | `prisma migrate` (SHA-256 tracked, rollback-capable) |
| **Auth** | Passport.js (JWT + Google + API key) | Custom + NextAuth/session hybrid |
| **Payments** | RazorPay (INR, India-first) + Stripe disabled | Stripe (global) |
| **SEO** | Poor (SPA, blank div on first render) | Full SSR — public pages indexed by search engines |
| **Deployment** | VPS/container (two processes) | Vercel serverless + edge |
| **Tests** | Zero (manual checklists only) | Full CI/CD with unit + integration + E2E |

---

## The 3-Horizon Strategy

> Core principle: **do not rewrite architecture before launch — add CI/CD now, evolve code as MRR validates it.**

```
Horizon 1 — This Week (MVP Launch)
  Focus: Ship. No architecture changes. Add CI/CD + observability only.

Horizon 2 — Milestone 1 (~₹5L MRR, Month 1–2)
  Focus: Remove tech debt that hurts daily development.

Horizon 3 — Milestone 2+ (~₹10L+ MRR, Month 3+)
  Focus: Architecture evolution driven by actual scale pain.
```

---

## Horizon 1 — MVP Launch Week

### 1. CI/CD Pipeline (GitHub Actions + Railway)

The Cursor/Claude deploy model: `main` → auto-deploy production, `dev` → auto-deploy staging, PR → run checks.

**File:** `.github/workflows/deploy.yml`

```
Push to dev    → build NestJS + Vite → smoke test → deploy to staging
Push to main   → build NestJS + Vite → smoke test → deploy to production
PR opened      → build + smoke test (no deploy)
```

**Recommended host:** Railway or Render — both support a `package.json` start script, built-in PostgreSQL, and secrets management. Zero nginx/k8s configuration needed.

### 2. Error Tracking (Sentry)

Add before launch: `@sentry/nestjs` (NestJS) + `@sentry/react` (frontend).
Every production crash surfaces in a dashboard before a user reports it.

**Effort:** ~1 hr

### 3. Health Check Endpoint

Add `GET /api/health` → `{ status: "ok", db: "connected" }` in NestJS.
Required by all modern deploy platforms for zero-downtime deploys and auto-restart.

**Effort:** ~30 min

---

## Horizon 2 — Milestone 1 (Month 1–2, ~₹5L MRR)

### 1. Delete `server/payments/` Duplicate Codebase

**Why it hurts:** `server/payments/` (Express) and `api/src/modules/payments/` (NestJS) both have payment logic. Every bug fix risks being missed in one place. PT-03/PT-04 required fixing in two locations.

**Fix:** Delete `server/payments/` business logic entirely. Express proxy forwards requests only — zero business logic there.

**Effort:** ~4 hrs

### 2. Replace `db push` with Proper Prisma Migrations

**Why it hurts:** `prisma db push` in production has no rollback path. Schema drift between dev/staging/prod is silent and dangerous.

**Fix:** Run `prisma migrate dev` locally once → generates a baseline migration from current schema. Then use `prisma migrate deploy` in CI pipeline (already scripted in `api/package.json`).

**No code changes required — only workflow change.**

**Effort:** ~2 hrs

### 3. Basic Tests for Critical Paths (Milestone 1 goal from tracker)

Target: Unit tests for `payments.service.ts`, integration tests for subscription lifecycle.
See `INFOGRAPHIC_AI_TEST_PLAYBOOK.md` — Sections 3.2 and 4.2.

**Effort:** ~8–12 hrs

---

## Horizon 3 — Milestone 2+ (Month 3+)

### 1. SSR for Marketing Pages Only (Not a full Next.js rewrite)

**Problem:** Landing page and pricing page are React SPA — Google sees a blank div. This caps organic growth.

**Pragmatic approach:**
- Keep the editor, dashboard, account pages as the Vite SPA
- Extract `LandingPage.tsx` and `PricingPage.tsx` into a separate Next.js app
- Route `/app/*` → Vite SPA, everything else → Next.js (via nginx or Railway routing)

**Do only if** organic search is a meaningful acquisition channel. Not needed if growth is paid/referral.

**Effort:** ~3 days

### 2. Shared Package Extraction (Prerequisite for B2B API / Developer Portal)

When Phase 4 (B2B API) begins, extract shared types into npm workspace packages:

```
packages/
  types/      # Shared TypeScript types (Subscription, Plan, PlanTier, etc.)
  ui/         # Shared Radix/Tailwind components
  config/     # Plan limits, constants (PLAN_CONFIG, PLAN_USER_LIMITS)
```

No need for Turborepo at this stage — npm workspaces in the existing `package.json` is sufficient.

**Trigger:** When Phase 4 (B2B API) begins.

### 3. tRPC — Defer Until Multiple Internal Services Exist

tRPC eliminates the type gap between NestJS and React frontend. For a single-team product at current scale, the migration cost (~1–2 weeks) is not justified by the benefit.

**Skip until:** You add a second service (Python AI service, separate admin app) that needs internal type-safe communication.

### 4. Turborepo — Defer Until Multiple Apps Exist

Turborepo's build caching and task pipeline provides real value only when you have ≥3 apps (`web`, `admin`, `developer-portal`) sharing packages.

**Skip until:** You're building the developer portal (Phase 4) or mobile app backend (Phase 5+).

---

## Priority Decision Matrix

| Change | When | Effort | Risk of Skipping |
|--------|------|--------|-----------------|
| CI/CD pipeline (GitHub Actions + Railway) | **This week** | 2–3 hrs | Manual deploys, no rollback on bad deploy |
| Sentry error tracking | **This week** | 1 hr | Flying blind in production |
| Health check endpoint (`GET /api/health`) | **This week** | 30 min | Deploy platform can't detect crashes |
| Fix PT-03 (cancel old sub on upgrade) | **This week** | 1–2 hrs | Orphaned ACTIVE subscriptions, double-billing |
| Fix PT-04 (PENDING before payment) | **This week** | 1 hr | Users get plan access before payment completes |
| Verify PT-05 (TEAM plan ₹6,999) | **This week** | 5 min | Users see wrong amount, abandon checkout |
| Delete `server/payments/` duplicate | Milestone 1 | 4 hrs | Bugs fixed in NestJS, missed in Express |
| Prisma migrations (replace db push) | Milestone 1 | 2 hrs | Schema drift, no rollback, silent prod breaks |
| Critical path tests (Tier 1 + 2) | Milestone 1 | 8–12 hrs | CI/CD pipeline has nothing to run — decoration only |
| SSR for marketing pages | Milestone 2 | ~3 days | SEO ceiling if organic search matters |
| Shared packages (`packages/types`) | Phase 4 (B2B) | ~1 week | Duplication when building developer portal |
| tRPC | Skip / Phase 4+ | 1–2 weeks | None at current scale |
| Turborepo | Skip / Phase 4+ | 1 week | None until multiple apps exist |

---

## What Not to Change Before MVP

These changes are architecturally correct but would derail the launch:
- **Do not migrate to Next.js** — weeks of work, breaks the Fabric.js canvas editor
- **Do not add tRPC** — breaking API contract change
- **Do not restructure to Turborepo** — pure overhead until you have multiple apps
- **Do not replace RazorPay** — India-market requirement, not a technical limitation

---

## Summary

> Launch this week as-is. Add GitHub Actions + Railway + Sentry (~4 hrs total).
> Fix PT-03/PT-04 payment bugs before launch.
> Clean up dual payment codebase and add migrations at Milestone 1.
> SSR only if SEO is a growth channel. Turborepo and tRPC only when you have multiple apps.
> Don't pay Cal.com's architecture tax until you're at Cal.com's scale.

---

*Last Updated: February 2026*
*Reference: `docs/.claude/CODEBASE_CONTEXT.md` for full architecture map*



