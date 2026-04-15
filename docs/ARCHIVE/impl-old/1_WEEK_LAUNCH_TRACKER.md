# 1 Week Launch Tracker — Verification & Status

> **Purpose:** Code-verified status for [1_WEEK_LAUNCH_PLAN.md](./1_WEEK_LAUNCH_PLAN.md), starting with **DAY 1–2: Critical Feature Completion**  
> **Last verified:** April 10, 2026 (repository scan + [PAYMENT_TEST_CHECKLIST.md](../PAYMENT_TEST_CHECKLIST.md) **TC-X-CLOSE-01**)  
> **Method:** Tasks marked “completed” in the launch plan were **re-checked** against the codebase; gaps are called out explicitly. Payment rows refreshed against checklist session **2026-04-10**.

### Testing document status (April 10, 2026)

| Document | Role | Status |
|----------|------|--------|
| [PAYMENT_TEST_CHECKLIST.md](../PAYMENT_TEST_CHECKLIST.md) | Razorpay MVP manual + cross TCs | **40** / **40** **Result** rows **Pass**; **TC-X-CLOSE-01/02** **Pass** |
| [PAYMENT_AUTOMATED_TESTING.md](../PAYMENT_AUTOMATED_TESTING.md) | `test:payment`, `test:payments:unit`, Playwright | Recorded **Pass** in checklist session log **2026-04-10** |
| [MVP_LAUNCH_TRACKER.md](../MVP_LAUNCH_TRACKER.md) | Executive MVP + Part 3 testing tracker | Aligned with checklist **2026-04-10** |
| [1_WEEK_LAUNCH_PLAN.md](./1_WEEK_LAUNCH_PLAN.md) | Daily checklist (historical detail) | **Header + Tasks 1.2–1.4** updated **2026-04-10** to match this tracker |

**Still open for MVP:** **1.5** staging/prod smoke; launch plan **Day 3–4 Task 2.1** (10 critical-path flows); **PT-06** BROKERAGE deferred.

---

## How to use this document

| Column / section | Meaning |
|------------------|---------|
| **Code verified** | File(s) exist and implement the described behavior (static review). |
| **Manual test** | Requires running app, Razorpay, tunnel, or production secrets — not proven by code alone. |
| **Gap** | Planned in launch doc but missing or incomplete in repo. |

---

## DAY 1–2: Critical Feature Completion — Status Overview

| Task | Launch plan label | Code verified | Manual QA | Overall |
|------|-------------------|---------------|-----------|---------|
| **1.1** User limit enforcement | ✅ Completed | **Yes** — backend ✅; **Account → Organization** (`OrganizationScreen`) | ⏳ Smoke QA | **Green** |
| **1.1b** Usage analytics dashboard | ✅ Completed | **Yes** | ⏳ Smoke recommended | **Green** |
| **1.2** Razorpay setup & testing | Setup ✅ / Testing ✅ | **Yes** — code ✅ + **unit / API smoke / E2E** ([runbook](../PAYMENT_AUTOMATED_TESTING.md)); manual SOLO/TEAM M+A per checklist **Pass** **2026-04-10** | ✅ Widget + dashboard paths exercised | **Green** (BROKERAGE **PT-06** still deferred) |
| **1.3** Webhook handling | Impl ✅ / Manual ✅ | **Yes** — unit + `npm run test:payment` HMAC; **live** tunnel delivery (`subscription.*`, verify) per checklist **2026-04-10** | ✅ | **Green** |
| **1.4** End-to-end payment testing | ✅ Checklist pass | **Yes** — automation + manual rows in [PAYMENT_TEST_CHECKLIST.md](../PAYMENT_TEST_CHECKLIST.md) thru **2026-04-10** (incl. plan change + failure path) | ✅ MVP-scope paths signed off | **Green** (staging/prod smoke still **1.5**) |
| **1.5** Production deployment & monitoring | ⏳ Pending | **Partial** — CI/CD + Sentry wiring present | ⏳ Staging/prod smoke | **Yellow** |

---

## Task 1.1: User limit enforcement — Verification

### What the launch plan claims

- `PLAN_USER_LIMITS` / plan `userLimit`, `UsersService`, registration guard when joining org via `organizationId`, API for org/members/slots, `usersApi` on client.

### Code verification (last structural review April 2026; payment QA sign-off **2026-04-10**)

| Item | Result | Evidence |
|------|--------|----------|
| Plan limits (FREE/SOLO/TEAM/BROKERAGE) | ✅ | `shared/schema.ts` (`PLAN_CONFIG` includes `userLimit`); `api/src/modules/users/users.service.ts` (`PLAN_USER_LIMITS`) |
| `UsersService` (`canAddUser`, `getRemainingUserSlots`, `addUserToOrganization`) | ✅ | `api/src/modules/users/users.service.ts` |
| Auth: block join when org at cap | ✅ | `api/src/modules/auth/services/auth.service.ts` (`canAddUserToOrganization`) |
| REST API | ✅ | `api/src/modules/users/users.controller.ts` — `GET organization`, `organization/members`, `organization/slots`, `POST/DELETE organization/members/:userId` |
| Client `usersApi` | ✅ Defined | `client/src/lib/api.ts` |
| Client **usage** of `usersApi` | ✅ | `client/src/components/account/OrganizationScreen.tsx` — org info, members, slots, add-by-email, remove |
| DB column `user_count` on `organizations` | ⚠️ Not as specified | **Not in** `api/prisma/schema.prisma`; limits enforced via **counting** `Organization.users` (valid alternative; launch plan SQL optional) |

### Post-MVP (full invite flow)

Token-based invites, transactional email, and `/invite/accept` are **not** in MVP scope. Draft specification:

- [ORGANIZATION_INVITE_FLOW.md](../ORGANIZATION_INVITE_FLOW.md)
- [NEXT_PHASE_DEVELOPMENT.md](../NEXT_PHASE_DEVELOPMENT.md) — **§6 Organization invite flow**

### Testing steps (Task 1.1)

1. **API (authenticated):** `GET /api/v1/users/organization/slots` — expect `limit`/`remaining` matching plan (TEAM: max 5 users).
2. **Registration edge case:** Create TEAM org with 5 users; register a 6th user with same `organizationId` — expect **rejection** with a clear message.
3. **Browser:** Account → **Organization** — confirm slot meter, TEAM cap messaging, add (existing user email), remove.

---

## Task 1.1b: Usage analytics dashboard — Verification

### Code verification

| Item | Result | Evidence |
|------|--------|----------|
| Route `/usage` | ✅ | `client/src/App.tsx` — protected route → `UsageDashboardPage` |
| Page + charts + export | ✅ | `client/src/pages/UsageDashboardPage.tsx` — `usageAnalyticsApi.getMonthlyUsage`, `getCostBreakdown`, `getUsageHistory`, `exportUsageData` (CSV/JSON) |
| Subscription context | ✅ | Same file — `paymentsApi.getSubscription()` for current plan |

### Testing steps (Task 1.1b)

1. Log in → open `/usage`.
2. Confirm cards load without console errors (empty data OK on new accounts).
3. Click **Export** CSV and JSON; open files and confirm shape.
4. Optionally compare totals with DB or `GET /api/v1/payments/usage/*` (Swagger `/api/docs`).

---

## Task 1.2: Razorpay account setup & testing — Verification

### Code verification

| Item | Result | Evidence |
|------|--------|----------|
| Pricing / checkout UI | ✅ | `client/src/pages/PricingPage.tsx` (per plan) |
| Payments module (Nest) | ✅ | `api/src/modules/payments/` |
| Prereq script | ✅ | `scripts/verify-payment-prerequisites.js`, `npm run verify:payment-prereqs` (per root `package.json` if present) |
| Automated payment script | ✅ | `scripts/run-payment-automated-tests.js` — `npm run test:payment` when API + DB up |

### Manual checkout (launch plan §2) — **2026-04-10**

Signed off in [PAYMENT_TEST_CHECKLIST.md](../PAYMENT_TEST_CHECKLIST.md) (**F-PAY-SOLO-M/A**, **F-PAY-TEAM-M/A**). Remaining gap: **BROKERAGE** only if plan IDs exist ([PT-06](../ISSUES_REPORT.md) deferred).

| # | Step | Status |
|---|------|--------|
| 1 | `/pricing` → **SOLO** — widget, test pay, DB + org tier | ✅ Per checklist |
| 2 | **TEAM** — same | ✅ Per checklist |
| 3 | **Annual** toggle — amount / billing period | ✅ Per checklist |
| 4 | **BROKERAGE** | ⏳ Deferred (**PT-06**) |
| 5 | Failure path — no false **ACTIVE** without webhook | ✅ **TC-X-FAIL-01** + unit `handlePaymentFailed` |
| 6 | Document issues (**PT-xx**) | ✅ **TC-X-CLOSE-02** — no new defects **2026-04-10** |

---

## Task 1.3: Razorpay webhooks — Verification

### Code verification

| Item | Result | Evidence |
|------|--------|----------|
| Raw body for signature | ✅ | Express layer — `server/index.ts` (webhook path + raw body as documented in repo docs) |
| Verify + forward | ✅ | `server/payments/providers/razorpay.provider.ts` — `verifyWebhookSignature`; Nest payments service handles events |
| Events (design intent) | ✅ | Launch plan: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `payment.failed` — confirm handlers in `payments.service.ts` / controller |
| Automated signature tests | ✅ | `npm run test:payment` includes valid/invalid webhook posts (when server running) |

### Manual webhook verification — **2026-04-10**

| # | Step | Status |
|---|------|--------|
| 1 | Dashboard URL → `https://<tunnel>/api/webhooks/razorpay` | ✅ Session (ngrok) |
| 2 | `RAZORPAY_WEBHOOK_SECRET` matches active webhook | ✅ |
| 3 | Real payment / events → logs + DB | ✅ e.g. **`subscription.charged`**, cancel on upgrade |
| 4 | Invalid signature → **401** | ✅ `npm run test:payment` |

**Note:** For new environments, repeat steps 1–2 using [RAZORPAY_WEBHOOK_SETUP_GUIDE.md](../payments/RAZORPAY_WEBHOOK_SETUP_GUIDE.md) and [PAYMENT_TEST_CHECKLIST.md](../PAYMENT_TEST_CHECKLIST.md).

---

## Task 1.4: End-to-end payment testing — Status

**Status:** ✅ **MVP-scope paths signed off** — detail in [PAYMENT_TEST_CHECKLIST.md](../PAYMENT_TEST_CHECKLIST.md) (**2026-04-07** through **2026-04-10**).

Consolidates **1.2 + 1.3** plus cross-flows:

| Scenario | Testing steps (high level) |
|----------|----------------------------|
| New subscription | New user → pricing → pay → webhook → ACTIVE → limits |
| Upgrade | FREE → SOLO/TEAM → verify cancel old sub if applicable (PT-03/PT-04 fixes) |
| Downgrade / cancel | Cancel in Razorpay → webhook → org downgraded (see handler behavior) |
| Payment failure | Failed charge → `payment.failed` / PAST_DUE behavior per implementation |

| Date | Runner | Result | Notes |
|------|--------|--------|-------|
| **2026-04-10** | Local QA | **Pass** | Cross API **TC-X-API-01–04**, **TC-X-CHG-01**, **TC-X-FAIL-01**; trackers updated (**TC-X-CLOSE-01**). |

---

## Task 1.5: Production deployment & monitoring — Verification

### Code / repo verification

| Item | Result | Evidence |
|------|--------|----------|
| GitHub Actions: build, test, integration | ✅ | `.github/workflows/deploy.yml` |
| Railway deploy (staging/production) | ✅ | `deploy-staging` / `deploy-production` jobs |
| Sentry (API) | ✅ | `api/src/instrument.ts`, `api/src/main.ts` import; `SentryModule` in `app.module.ts` |
| Client Sentry in CI build | ✅ | `deploy.yml` passes `VITE_SENTRY_DSN` to Vite build |
| Health check | ✅ | Nest: `GET /api/v1/health` (`health.controller.ts`); unified server: `GET /api/health` proxies to API (`server/index.ts`) |
| Post-deploy curl | ⚠️ | Workflow uses `${{ secrets.PROD_URL }}/api/health` — **correct** if `PROD_URL` is the **unified** app origin; if only API port is exposed, use `/api/v1/health` on API host |

### Pending (human)

1. Confirm **all production secrets** on Railway (and GitHub) match live vs test Razorpay mode.
2. Run **`prisma migrate deploy`** (or agreed migration path) on production DB.
3. **Staging smoke:** register, login, one editor path, one pricing open (test mode), `/usage`, `/api/health` or `/api/v1/health`.
4. **Production go-live:** repeat smoke; trigger a test error and confirm **Sentry** receives it.
5. Optional: uptime monitor pointing at `/api/health`.

---

## Cross-reference

| Document | Role |
|----------|------|
| [1_WEEK_LAUNCH_PLAN.md](./1_WEEK_LAUNCH_PLAN.md) | Detailed daily checklist (source requirements) |
| [MVP_LAUNCH_TRACKER.md](../MVP_LAUNCH_TRACKER.md) | Executive MVP + phase tracker |
| [NEXT_PHASE_DEVELOPMENT.md](../NEXT_PHASE_DEVELOPMENT.md) | Post-MVP backlog; **§6** full org invite flow |
| [ORGANIZATION_INVITE_FLOW.md](../ORGANIZATION_INVITE_FLOW.md) | Draft spec for token/email invites (builds on Organization screen) |
| [PAYMENT_TEST_CHECKLIST.md](../PAYMENT_TEST_CHECKLIST.md) | Payment + webhook steps |
| [PAYMENT_AUTOMATED_TESTING.md](../PAYMENT_AUTOMATED_TESTING.md) | Unit / integration / API smoke / E2E runbook + coverage note |
| [ISSUES_REPORT.md](../ISSUES_REPORT.md) | PT-xx / RZ-xx issue status |

---

*Next update: append **Task 1.5** staging/prod smoke rows when run; optional **Task 2.1** critical-path results in [1_WEEK_LAUNCH_PLAN.md](./1_WEEK_LAUNCH_PLAN.md). Post-MVP invite: NEXT_PHASE §6 + ORGANIZATION_INVITE_FLOW.*

*Footer: Last reviewed April 10, 2026.*
