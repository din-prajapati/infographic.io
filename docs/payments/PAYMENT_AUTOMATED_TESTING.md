# Payment & webhook automated testing — runbook

> **Scope:** Tasks **1.2** (Razorpay setup & API testing), **1.3** (webhook signature + handler wiring), **1.4** (pre-manual automation) from [1_WEEK_LAUNCH_TRACKER.md](./implementation/1_WEEK_LAUNCH_TRACKER.md)  
> **Manual cases (Agile — Epic / Feature / Story / TC / PR):** [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) · template [AGILE_QA_WORKFLOW.md](./AGILE_QA_WORKFLOW.md)  
> **Last updated:** April 6, 2026

---

## What is already implemented

| Layer | What it covers | Where |
|-------|----------------|--------|
| **Unit** | `PaymentsService`: PT-03/PT-04, cancel, verify signature, `handleSubscriptionActivated` / `Cancelled`, **`handleSubscriptionCharged`**, **`handlePaymentFailed`** (incl. idempotency) | `api/tests/payments/payments.service.spec.ts` |
| **Integration (DB)** | Subscription lifecycle **data** transitions (PENDING → ACTIVE, upgrade cancel, downgrade) scoped to test orgs | `api/tests/payments/payments.service.integration.spec.ts` |
| **API smoke (live server)** | Env prereqs, `provider-info`, `create-subscription` (SOLO monthly + TEAM annual) with test user, webhook valid/invalid HMAC | `scripts/run-payment-automated-tests.js` → `npm run test:payment` |
| **E2E (browser)** | `/pricing` renders plans; `provider-info` returns 2xx | `e2e/pricing-payments.spec.ts` |

**Not replaced by automation:** Completing a real Razorpay test card in the widget, Razorpay Dashboard webhook **delivery** to your tunnel/staging, and bank-specific edge cases — those remain **manual**.

---

## How to run everything

### 1. Unit tests (no DB, no running app)

From repository root:

```bash
npm run test:unit
```

Payments only:

```bash
npm run test:payments:unit
```

Same command (alias — use if you typed `test:payment:unit` by mistake):

```bash
npm run test:payment:unit
```

### 2. Integration tests (PostgreSQL)

**Requires** `TEST_DATABASE_URL` (e.g. in `api/.env` or shell). CI uses a disposable Postgres service.

```bash
# Example: local Postgres
set TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/infographic_test
cd api && npx prisma db push --schema=prisma/schema.prisma
cd ..
npm run test:integration
```

### 3. API smoke + webhook HTTP tests (unified dev server)

Terminal 1 — app must serve `/api/v1` and `/api/webhooks/razorpay`:

```bash
npm run dev
```

Terminal 2 — optional test user for subscription steps:

```bash
# .env at repo root (or export)
# TEST_USER_EMAIL=...
# TEST_USER_PASSWORD=...
# RAZORPAY_WEBHOOK_SECRET=...   (required for §4–5 of the script)

npm run verify:payment-prereqs
npm run test:payment
```

Optional: create/register a dedicated user:

```bash
npm run test:payment:ensure-user
```

Override base URL if needed:

```bash
set BASE_URL=http://localhost:5000
npm run test:payment
```

### 4. Playwright E2E

Starts or reuses `npm run dev` per `playwright.config.ts`:

```bash
npm run test:e2e -- e2e/pricing-payments.spec.ts
```

All E2E specs:

```bash
npm run test:e2e
```

---

## Suggested pre-release sequence

1. `npm run test:unit`
2. `npm run test:integration` (with `TEST_DATABASE_URL`)
3. `npm run dev` → `npm run test:payment`
4. `npm run test:e2e -- e2e/pricing-payments.spec.ts`
5. Then execute [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md) (manual — **by plan**: Solo monthly → Solo annual → Team monthly → Team annual, each with linked automation rows)

---

## Coverage without manual testing — honest estimate

Automation can catch **regressions in your code** (service logic, DB shapes, HTTP contract, signature verification, pricing page load). It **cannot** certify that Razorpay’s live/test environment, plan amounts, or webhook delivery match production.

| Area | Approx. share of “payment launch risk” covered without manual |
|------|------------------------------------------------------------------|
| Backend subscription / webhook **logic** (unit) | **~75–85%** of logic paths that are mocked or pure |
| DB lifecycle **invariants** (integration file) | **~40–50%** — validates state transitions, not real `PaymentsService` + Razorpay |
| HTTP + env + webhook **wiring** (`test:payment`) | **~50–60%** when server + secrets + test user are configured |
| **End-user checkout** (Razorpay modal, 3-D Secure, annual amounts) | **~10–20%** — E2E stops at API/plan UI; card flow is manual |
| **Overall “ready for production payments”** | Treat as **~35–45%** without manual checklist — manual remains **required** for sign-off |

Use automation to **fail fast before manual**; use manual + Dashboard logs for **final** 1.2–1.4 sign-off.

---

## Related docs

- [PAYMENT_TEST_CHECKLIST.md](./PAYMENT_TEST_CHECKLIST.md)
- [ISSUES_REPORT.md](./ISSUES_REPORT.md) (Track B)
- [1_WEEK_LAUNCH_TRACKER.md](./implementation/1_WEEK_LAUNCH_TRACKER.md)
