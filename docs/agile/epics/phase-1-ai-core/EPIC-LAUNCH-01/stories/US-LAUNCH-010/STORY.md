# Story Card — US-LAUNCH-010

> ⚠️ **Blocked by:** [Pre-requisite-story.md](./Pre-requisite-story.md) — do NOT run `/implement-story` until its P0–P2 remediation + sign-off checklist are complete. A naive implementation will brick the live staging boot (fail-closed validation + RazorPay guard). That doc is the Definition of Ready.
>
> **Status:** 🔲 Not Started
> **Feature:** F-LAUNCH-06 — Environment & Secrets Management
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-01-public-beta](../../milestones/M-LAUNCH-01-public-beta.md)
> **Linear:** LIN-XXX
> **Created:** 2026-07-11 | **Closed:** —
>
> **Depends on:** [US-LAUNCH-009](../US-LAUNCH-009/STORY.md) must be merged before this story starts (the `.env.example` contract + matrix define the required-variable set this story validates against).

---

## Story

*As a* solo operator/developer running InfographicAI across local/staging/production
*I want* the app to know which environment it is in and to refuse to boot on missing/malformed config or on the wrong RazorPay key mode
*So that* a misconfiguration (missing secret, live keys on staging, test keys in prod) fails **at deploy** with a clear message — instead of at a paying customer's checkout, which is exactly how the F2-02 webhook bug and the placeholder secret reached staging in Phase 0.

---

## Acceptance Criteria

- [ ] **AC1:** A first-class `APP_ENV` exists with allowed values `local | staging | production`, distinct from `NODE_ENV`. It is read through one helper (`api/src/config/app-env.ts` — e.g. `getAppEnv()`), never scattered. When `APP_ENV` is unset the helper **infers** it safely (from `RAILWAY_ENVIRONMENT_NAME`, else `NODE_ENV`) and defaults to `local` — so a deploy boots even before `APP_ENV` is explicitly set. `APP_ENV` is added to `.env.example` and `docs/setup/ENVIRONMENTS.md` as a per-env variable.
- [ ] **AC2:** Boot-time validation runs via `ConfigModule.forRoot({ validate })` using a **Zod** schema in `api/src/config/env.validation.ts`. On a missing or malformed **required** variable the process exits before serving traffic with a readable, aggregated error naming each offending key. The required-set is exactly the variables the running app needs (per the US-LAUNCH-009 contract); optional vars (Stripe when disabled, Sentry, Railway-injected `RAILWAY_*`) are `.optional()` and never trip validation.
- [ ] **AC3:** A test-vs-live RazorPay guard runs at boot: if `getAppEnv() !== 'production'` then `RAZORPAY_KEY_ID` **and** `VITE_RAZORPAY_KEY_ID` must start with `rzp_test_`; if `production` they must start with `rzp_live_`. A violation aborts boot with an explicit message (e.g. "live RazorPay key detected in staging — aborting"). This makes "live keys on staging" impossible, not merely documented.
- [ ] **AC4:** **Staging keeps booting unchanged.** With staging's *existing* variable set (the 35 keys already set, `APP_ENV` not yet added, `rzp_test_*`, `NODE_ENV=production`), the validated app starts cleanly: inference resolves `APP_ENV=staging`, all required vars are present, and the test-key guard passes. No staging Railway variable is added or changed as part of merging this story. Verified by a staging deploy showing `Nest application successfully started` + `/api/health` = `{"status":"ok"}`.
- [ ] **AC5:** Unit tests in `api/tests/config/env.validation.spec.ts` cover: (a) valid config passes; (b) a missing required var throws with that key named; (c) `APP_ENV` inference from `RAILWAY_ENVIRONMENT_NAME`/`NODE_ENV`; (d) guard rejects `rzp_live_*` when non-production; (e) guard rejects `rzp_test_*` when production. `npm run check` and `npm run test:unit` pass.

---

## Out of Scope

- The docs/`.env.example`/`secrets` convention itself — that is US-LAUNCH-009 (this story only *adds* the `APP_ENV` row).
- Migrating the ~39 `process.env.*` reads to `ConfigService` — validation happens at boot; call sites are untouched here (separate refactor).
- Creating the Railway `production` environment or setting live values — Phase 0 Task 3 (human).
- Changing any staging Railway variable value — the story is deliberately additive so staging is undisturbed.
- Secrets rotation, or an external secrets manager.

---

## Engineering / PR

- **Branch:** `feat/launch-us-launch-010-config-hardening`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/config/env.validation.ts` (new — Zod schema + RazorPay guard)
  - `api/src/config/app-env.ts` (new — `getAppEnv()` helper + inference)
  - `api/src/app.module.ts` (wire `validate` into `ConfigModule.forRoot`)
  - `api/tests/config/env.validation.spec.ts` (new — unit tests)
  - `.env.example` + `docs/setup/ENVIRONMENTS.md` (add `APP_ENV` row)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI — NestJS API (3001). Config is raw process.env.*, no validation. ConfigModule.forRoot
already loads .env.production/.env with ignoreEnvFile in prod (Railway injects system env). Staging and prod
BOTH set NODE_ENV=production, so the app can't tell them apart. Staging is LIVE and must keep booting unchanged.

Story: US-LAUNCH-010 — Config hardening (APP_ENV + Zod boot validation + RazorPay test/live guard).
Depends on US-LAUNCH-009 (the .env.example contract defines the required-var set).

Do this:
1. api/src/config/app-env.ts — export type AppEnv = 'local'|'staging'|'production' and getAppEnv():
   read APP_ENV; if unset, infer from RAILWAY_ENVIRONMENT_NAME (e.g. 'staging'/'production'), else from
   NODE_ENV, defaulting to 'local'. Pure function, unit-testable.
2. api/src/config/env.validation.ts — Zod schema for the REQUIRED vars from the US-LAUNCH-009 contract
   (DATABASE_URL, JWT_SECRET, SESSION_SECRET, OPENAI_API_KEY, IDEOGRAM_API_KEY, GOOGLE_CLIENT_ID/SECRET/
   CALLBACK_URL, RAZORPAY_KEY_ID/KEY_SECRET/WEBHOOK_SECRET, VITE_RAZORPAY_KEY_ID, plan IDs…). Mark Stripe,
   Sentry, and all RAILWAY_* as .optional(). Export validate(config): calls schema.parse, aggregates all
   errors, and runs the RazorPay guard: non-production ⇒ RAZORPAY_KEY_ID & VITE_RAZORPAY_KEY_ID start with
   rzp_test_; production ⇒ rzp_live_. Throw a single readable Error on any failure.
3. api/src/app.module.ts — pass `validate` to ConfigModule.forRoot({ ..., validate }).
4. api/tests/config/env.validation.spec.ts — cover valid pass, missing-required throw (key named),
   APP_ENV inference, guard rejects live-in-nonprod and test-in-prod.
5. Add APP_ENV to .env.example and docs/setup/ENVIRONMENTS.md.

Hard rules:
- Staging must keep booting with its CURRENT vars (APP_ENV absent ⇒ inferred 'staging'; rzp_test_* passes).
  Do NOT make APP_ENV required. Do NOT require any var staging doesn't already have.
- Do NOT run `railway variables --set`. Do NOT change staging values.
- Do NOT migrate call sites to ConfigService.
- Test Is Truth: if a test fails, fix the code/schema, not the test.
- When done: list files changed, ACs checked, run `npm run check` + `npm run test:unit`.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-010-01 | Auto | P0 | Given all required vars present + `rzp_test_*` + no `APP_ENV`, When `validate()` runs, Then it passes and `getAppEnv()` returns `staging` (inferred). | 🔲 | |
| TC-LAUNCH-010-02 | Auto | P0 | Given `JWT_SECRET` missing, When `validate()` runs, Then it throws and the message names `JWT_SECRET`. | 🔲 | |
| TC-LAUNCH-010-03 | Auto | P0 | Given `APP_ENV=staging` + `RAZORPAY_KEY_ID=rzp_live_x`, When guard runs, Then boot aborts with a "live key in non-production" message. | 🔲 | |
| TC-LAUNCH-010-04 | Auto | P0 | Given `APP_ENV=production` + `RAZORPAY_KEY_ID=rzp_test_x`, When guard runs, Then boot aborts with a "test key in production" message. | 🔲 | |
| TC-LAUNCH-010-05 | Manual | P0 | Given staging's existing var set on a real deploy, When the branch deploys to staging, Then logs show `Nest application successfully started` and `/api/health` = ok (AC4). | 🔲 | |
| TC-LAUNCH-010-06 | Auto | P1 | Given `RAILWAY_ENVIRONMENT_NAME=production` and no `APP_ENV`, When `getAppEnv()` runs, Then it returns `production`. | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes (incl. new `env.validation.spec.ts`)
- [ ] Staging deploy boots cleanly with no staging variable change (AC4)
- [ ] PR merged (PR #{number})
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-11*
