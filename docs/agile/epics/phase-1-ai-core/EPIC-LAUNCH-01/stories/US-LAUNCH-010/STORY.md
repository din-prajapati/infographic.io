# Story Card — US-LAUNCH-010

> ✅ **Resolved:** [Pre-requisite-story.md](./Pre-requisite-story.md)'s remediation + sign-off checklist (§5–§6) was completed before implementation; AC3's RazorPay-block-optional decision (§5 P0.5) is the recorded outcome. No production crash-loop occurred.
>
> **Status:** ✅ Done
> **Feature:** F-LAUNCH-06 — Environment & Secrets Management
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-01-public-beta](../../milestones/M-LAUNCH-01-public-beta.md)
> **Linear:** LIN-XXX
> **Created:** 2026-07-11 | **Closed:** 2026-07-25
>
> **Depends on:** [US-LAUNCH-009](../US-LAUNCH-009/STORY.md) must be merged before this story starts (the `.env.example` contract + matrix define the required-variable set this story validates against).

---

## Story

*As a* solo operator/developer running InfographicAI across local/staging/production
*I want* the app to know which environment it is in and to refuse to boot on missing/malformed config or on the wrong RazorPay key mode
*So that* a misconfiguration (missing secret, live keys on staging, test keys in prod) fails **at deploy** with a clear message — instead of at a paying customer's checkout, which is exactly how the F2-02 webhook bug and the placeholder secret reached staging in Phase 0.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** A first-class `APP_ENV` exists with allowed values `local | staging | production`, distinct from `NODE_ENV`. It is read through one helper (`api/src/config/app-env.ts` — e.g. `getAppEnv()`), never scattered. When `APP_ENV` is unset the helper **infers** it safely (from `RAILWAY_ENVIRONMENT_NAME`, else `NODE_ENV`) and defaults to `local` — so a deploy boots even before `APP_ENV` is explicitly set. `APP_ENV` is added to `.env.example` and `docs/setup/ENVIRONMENTS.md` as a per-env variable.
- [x] **AC2 [error-path]:** Boot-time validation runs via `ConfigModule.forRoot({ validate })` using a **Zod** schema in `api/src/config/env.validation.ts`. On a missing or malformed **required** variable the process exits before serving traffic with a readable, aggregated error naming each offending key. The required-set is exactly the variables the running app needs (per the US-LAUNCH-009 contract); optional vars (Stripe when disabled, Sentry, Railway-injected `RAILWAY_*`, and — per AC3 — the entire RazorPay block, since production has no live keys configured yet) are `.optional()` and never trip validation on their own absence.
- [x] **AC3 [security]:** A test-vs-live RazorPay guard runs at boot, **but only when a RazorPay key is actually present** — `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `VITE_RAZORPAY_KEY_ID`, and all plan-ID vars are `.optional()` in the schema (decision recorded in `Pre-requisite-story.md` §5 P0.5 — production currently has none of them set, so requiring them would abort every production boot until RazorPay live-mode is manually activated, which is separate, deferred work under US-LAUNCH-005). When `RAZORPAY_KEY_ID` **and** `VITE_RAZORPAY_KEY_ID` **are** set: if `getAppEnv() !== 'production'` they must start with `rzp_test_`; if `production` they must start with `rzp_live_`. A mode mismatch aborts boot with an explicit message (e.g. "live RazorPay key detected in staging — aborting"). An **absent** key never aborts boot — only a **wrong-mode present** key does. This makes "live keys on staging" (or test keys surviving into a live production cutover) impossible without requiring RazorPay to be configured before any environment can boot.
- [x] **AC4 [edge-case]:** **Staging keeps booting unchanged.** With staging's *existing* variable set (the 35 keys already set, `APP_ENV` not yet added, `rzp_test_*`, `NODE_ENV=production`), the validated app starts cleanly: inference resolves `APP_ENV=staging`, all required vars are present, and the test-key guard passes. No staging Railway variable is added or changed as part of merging this story. Verified by a staging deploy showing `Nest application successfully started` + `/api/health` = `{"status":"ok"}`.
- [x] **AC5 [edge-case]:** Unit tests in `api/tests/config/env.validation.spec.ts` cover: (a) valid config passes; (b) a missing required var throws with that key named; (c) `APP_ENV` inference from `RAILWAY_ENVIRONMENT_NAME`/`NODE_ENV`; (d) guard rejects `rzp_live_*` when non-production; (e) guard rejects `rzp_test_*` when production. `npm run check` and `npm run test:unit` pass.

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
- **PR:** #17
- **Primary files touched:**
  - `api/src/config/env.validation.ts` (new — Zod schema + RazorPay guard + success/failure Logger messages)
  - `api/src/config/app-env.ts` (new — `getAppEnv()` helper + inference)
  - `api/src/app.module.ts` (wire `validate` into `ConfigModule.forRoot`)
  - `api/tests/config/env.validation.spec.ts` (new — 17 unit tests)
  - `.env.example` + `docs/setup/ENVIRONMENTS.md` (add `APP_ENV` row)
  - `api/src/main.ts` (T6, added post-implementation — report boot-abort to Sentry)
  - `server/index.ts` (T7, added post-implementation — removed hardcoded `JWT_SECRET` fallback, security finding)

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
   (DATABASE_URL, JWT_SECRET, OPENAI_API_KEY, IDEOGRAM_API_KEY, GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL —
   confirmed present with real values on BOTH staging and production as of 2026-07-25, see
   Pre-requisite-story.md §2). Mark Stripe, Sentry, all RAILWAY_*, and the ENTIRE RazorPay block
   (RAZORPAY_KEY_ID/KEY_SECRET/WEBHOOK_SECRET, VITE_RAZORPAY_KEY_ID, all plan IDs) as .optional() —
   production has no RazorPay keys configured yet (§5 P0.5 decision: Option A). Export validate(config):
   calls schema.parse, aggregates all errors, and runs the RazorPay guard ONLY when RAZORPAY_KEY_ID is
   present: non-production ⇒ RAZORPAY_KEY_ID & VITE_RAZORPAY_KEY_ID must start with rzp_test_; production
   ⇒ must start with rzp_live_. An absent key skips the guard entirely (no error). Throw a single
   readable Error on any required-var-missing or guard-mismatch failure.
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
| TC-LAUNCH-010-01 | Auto | P0 | Given all required vars present + `rzp_test_*` + no `APP_ENV`, When `validate()` runs, Then it passes and `getAppEnv()` returns `staging` (inferred). | ✅ | Also re-verified against staging's real live `railway variables` output, 2026-07-25 |
| TC-LAUNCH-010-02 | Auto | P0 | Given `JWT_SECRET` missing, When `validate()` runs, Then it throws and the message names `JWT_SECRET`. | ✅ | Also re-verified as a real process abort (exit code 1) via `npx tsx src/main.ts` directly |
| TC-LAUNCH-010-03 | Auto | P0 | Given `APP_ENV=staging` + `RAZORPAY_KEY_ID=rzp_live_x`, When guard runs, Then boot aborts with a "live key in non-production" message. | ✅ | |
| TC-LAUNCH-010-04 | Auto | P0 | Given `APP_ENV=production` + `RAZORPAY_KEY_ID=rzp_test_x`, When guard runs, Then boot aborts with a "test key in production" message. | ✅ | Also re-verified as a real process abort (exit code 1) via `npx tsx src/main.ts` directly, `APP_ENV=production` |
| TC-LAUNCH-010-05 | Manual | P0 | Given staging's existing var set on a real deploy, When the branch deploys to staging, Then logs show `Nest application successfully started` and `/api/health` = ok (AC4). | ✅ | PR #17 merged (`d3570fa`) 2026-07-25 13:07 UTC; staging auto-deployed; `railway logs` confirmed `[EnvValidation] ✅ Environment validated — 7 required keys checked, running in "staging" (RazorPay key present, mode verified)` + `Nest application successfully started`; `GET /api/health` → `{"status":"ok","db":"connected","uptime":62.39}` HTTP 200. No staging Railway variable was added or changed. |
| TC-LAUNCH-010-06 | Auto | P1 | Given `RAILWAY_ENVIRONMENT_NAME=production` and no `APP_ENV`, When `getAppEnv()` runs, Then it returns `production`. | ✅ | |
| TC-LAUNCH-010-07 | Auto | P0 | Given `APP_ENV=production` and `RAZORPAY_KEY_ID`/`VITE_RAZORPAY_KEY_ID` **absent** (matches production's real current state), When `validate()` runs, Then it passes — an absent RazorPay key never aborts boot, only a wrong-mode *present* key does (AC3 amendment, §5 P0.5 Option A). | ✅ | Also re-verified against production's real live `railway variables` output, 2026-07-25 |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅ (AC1–AC5, including AC4, confirmed against a real staging deploy)
- [x] All test cases run and recorded (TC-01–TC-07, including TC-05 — see Test Cases table)
- [x] `npm run check` passes (2 pre-existing, unrelated `main.ts` errors — see `TASKS.md` note)
- [x] `npm run test:unit` passes (incl. new `env.validation.spec.ts`) — 105/105
- [x] Staging deploy boots cleanly with no staging variable change (AC4) — confirmed 2026-07-25, see TC-LAUNCH-010-05
- [x] PR merged (PR #17, squash-merged `d3570fa`, 2026-07-25 13:07 UTC)
- [x] [TASKS.md](./TASKS.md) task list fully checked (T1–T7)

---

*Story created: 2026-07-11*
