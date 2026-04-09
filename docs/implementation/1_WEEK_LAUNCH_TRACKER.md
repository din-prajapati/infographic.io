# 1 Week Launch Tracker — Verification & Status

> **Purpose:** Code-verified status for [1_WEEK_LAUNCH_PLAN.md](./1_WEEK_LAUNCH_PLAN.md), starting with **DAY 1–2: Critical Feature Completion**  
> **Last verified:** April 6, 2026 (repository scan)  
> **Method:** Tasks marked “completed” in the launch plan were **re-checked** against the codebase; gaps are called out explicitly.

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
| **1.2** Razorpay setup & testing | Setup ✅ / Testing ⏳ | **Partial** — code ✅ + **unit / API smoke / E2E pricing** ([runbook](../PAYMENT_AUTOMATED_TESTING.md)) | ⏳ Manual widget + Dashboard | **Yellow** |
| **1.3** Webhook handling | Impl ✅ / Manual ⏳ | **Yes** — handlers covered in **unit** tests; **HMAC** in `npm run test:payment` | ⏳ Real delivery from Razorpay | **Yellow** |
| **1.4** End-to-end payment testing | ⏳ Pending | **Partial** — `test:payment` + Playwright smoke; **not** full card E2E | ⏳ Blocking for prod sign-off | **Yellow** |
| **1.5** Production deployment & monitoring | ⏳ Pending | **Partial** — CI/CD + Sentry wiring present | ⏳ Staging/prod smoke | **Yellow** |

---

## Task 1.1: User limit enforcement — Verification

### What the launch plan claims

- `PLAN_USER_LIMITS` / plan `userLimit`, `UsersService`, registration guard when joining org via `organizationId`, API for org/members/slots, `usersApi` on client.

### Code verification (April 6, 2026)

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

### Pending (manual — launch blocking)

Aligned with [PAYMENT_TEST_CHECKLIST.md](../PAYMENT_TEST_CHECKLIST.md) and **§2 Test Checkout** in the launch plan:

| # | Step |
|---|------|
| 1 | `/pricing` → **SOLO** — open widget, pay test card `4111 1111 1111 1111`, confirm DB subscription + org tier + monthly limit. |
| 2 | **TEAM** — same. |
| 3 | **Annual** toggle — confirm amount/discount, complete payment, verify billing period in DB. |
| 4 | **BROKERAGE** — only if plan IDs exist in env ([PT-06](../ISSUES_REPORT.md) may defer). |
| 5 | Failure card `4000 0000 0000 0002` — no subscription, user stays FREE. |
| 6 | Document issues, test IDs, and any Razorpay quirks. |

---

## Task 1.3: Razorpay webhooks — Verification

### Code verification

| Item | Result | Evidence |
|------|--------|----------|
| Raw body for signature | ✅ | Express layer — `server/index.ts` (webhook path + raw body as documented in repo docs) |
| Verify + forward | ✅ | `server/payments/providers/razorpay.provider.ts` — `verifyWebhookSignature`; Nest payments service handles events |
| Events (design intent) | ✅ | Launch plan: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `payment.failed` — confirm handlers in `payments.service.ts` / controller |
| Automated signature tests | ✅ | `npm run test:payment` includes valid/invalid webhook posts (when server running) |

### Pending (manual — launch blocking)

| # | Step |
|---|------|
| 1 | Razorpay Dashboard → Webhooks → URL `https://<staging-or-tunnel>/api/webhooks/razorpay` (see [RAZORPAY_WEBHOOK_SETUP_GUIDE.md](../payments/RAZORPAY_WEBHOOK_SETUP_GUIDE.md)). |
| 2 | Set `RAZORPAY_WEBHOOK_SECRET` to match the **active** webhook. |
| 3 | Send test webhook / complete real payment; confirm logs and DB (`subscriptions`, `payments`, org tier on cancel). |
| 4 | Invalid signature → **401** (already covered by automation when API is up). |

**Note:** Launch plan mentions tunnel providers; follow current doc ([PAYMENT_TEST_CHECKLIST.md](../PAYMENT_TEST_CHECKLIST.md), `scripts/ngrok-webhook.ps1`) for your environment.

---

## Task 1.4: End-to-end payment testing — Status

**Status:** ⏳ Not executed as a single signed-off cycle in tracker.

Consolidates **1.2 + 1.3** plus cross-flows:

| Scenario | Testing steps (high level) |
|----------|----------------------------|
| New subscription | New user → pricing → pay → webhook → ACTIVE → limits |
| Upgrade | FREE → SOLO/TEAM → verify cancel old sub if applicable (PT-03/PT-04 fixes) |
| Downgrade / cancel | Cancel in Razorpay → webhook → org downgraded (see handler behavior) |
| Payment failure | Failed charge → `payment.failed` / PAST_DUE behavior per implementation |

Record pass/fail in a dated row below when run:

| Date | Runner | Result | Notes |
|------|--------|--------|-------|
| | | | |

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

*Next update: after Day 1–2 manual QA passes, fill Task 1.4 table; track full invite implementation under NEXT_PHASE §6 + ORGANIZATION_INVITE_FLOW.*
