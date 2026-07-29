# Story Card — US-LAUNCH-005

> **Status:** 🟡 In Progress — AC1–AC4 ✅ done (live-mode approved, plans created, Railway env vars set, boot assert already shipped via US-LAUNCH-010); AC5 unconfirmed (verify:payment-prereqs not yet run against prod); AC6 (one real ₹ subscription + refund) intentionally not run — explicit instruction was to smoke-test without starting checkout
> **Feature:** F-LAUNCH-04 — Payments Go-Live
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-02-revenue-on](../../milestones/M-LAUNCH-02-revenue-on.md)
> **Size:** M (mostly HUMAN ops; code = one startup assert)
> **Depends on:** US-LAUNCH-001 live in production (RazorPay activation review requires legal pages)
> **Linear:** LIN-XXX
> **Created:** 2026-07-07 | **Closed:** —

---

## Story

*As the* product operator
*I want* RazorPay switched from test mode to a fully activated live mode
*So that* checkout moves real money — today every key in the system is `rzp_test_*` and every "payment" is fake.

---

## Acceptance Criteria

- [x] **AC1 [happy-path] (HUMAN):** RazorPay account activation (KYC + website review) approved for live mode — requires US-LAUNCH-001 legal pages live on the production domain. **Done 2026-07-28** — RazorPay account approved, live keys deployed.
- [x] **AC2 [happy-path] (HUMAN):** Live plans re-created in the live-mode dashboard — SOLO monthly/annual, TEAM monthly/annual (test-mode plans do not carry over); TEAM re-verified at ₹6,999 / 699900 paise (PT-05 equivalent in live mode). **Done** — SOLO Monthly/Annual, TEAM Monthly/Annual live plans created (SOLO Annual ₹30,590, TEAM Annual ₹71,390); draft SOLO_PRO also created.
- [x] **AC3 [happy-path] (HUMAN):** Railway production env vars set: `RAZORPAY_KEY_ID`/`SECRET`/`VITE_RAZORPAY_KEY_ID` = `rzp_live_*`, all four `RAZORPAY_PLAN_*` = live plan IDs, `RAZORPAY_WEBHOOK_SECRET` = secret of a live webhook pointing at `https://{prod-domain}/api/v1/webhooks/razorpay`. **Done** — verified via masked Railway CLI check; webhook secret confirmed in RazorPay's `rzp_live_hook_*` format (correct, not a leaked key).
- [x] **AC4 [error-path] (CODE):** Startup assert — when `NODE_ENV=production`, boot fails fast with a clear error if `RAZORPAY_KEY_ID` starts with `rzp_test_` or any configured `RAZORPAY_PLAN_*` var is empty; local dev with test keys is unaffected. **Already shipped** via US-LAUNCH-010 (`api/src/config/env.validation.ts` / `app-env.ts`) — production has booted successfully with live keys, confirming the guard passes as expected.
- [ ] **AC5 [regression]:** `npm run verify:payment-prereqs` passes against production config — **not yet run** against the live production config; still open.
- [ ] **AC6 [happy-path] (HUMAN):** One real ₹ subscription completed on production (smallest plan): checkout → `subscription.charged` webhook received & signature-verified → Subscription `PENDING → ACTIVE` — then refunded/cancelled from the dashboard. **Intentionally not run yet** — explicit instruction during the Task 3 smoke test was "DO NOT Start Checkout Flow." Not blocked on RazorPay approval (that part is done); blocked only on a deliberate decision to run a real-money test.

---

## Out of Scope

- Stripe activation (EPIC-PAY-03, Phase 2)
- BROKERAGE live plans (US-LAUNCH-007 gates the tier instead)
- Receipt email (US-LAUNCH-006)
- Any change to provider abstraction / payments.service logic — config + assert only

---

## Engineering / PR

- **Branch:** `feat/launch-us-launch-005-razorpay-live`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/main.ts` or payments module init `(TBC — startup assert location)`
  - `api/tests/payments/live-key-assert.spec.ts` (new)
  - `docs/agile/epics/phase-1-ai-core/EPIC-LAUNCH-01/ENV.yaml` (record live var checklist)
  - `.env.example` (comment: prod = rzp_live_*)

---

## AI Implementation Prompt

> Copy this block into Claude Code / Cursor to implement the story (CODE portion only — AC4/AC5 support).

```
Context: InfographicAI SaaS — NestJS API. See CLAUDE.md. RazorPay is the primary provider;
plan IDs come from RAZORPAY_PLAN_SOLO_MONTHLY etc.

Story: US-LAUNCH-005 — RazorPay live-mode activation (code portion)

Add a production config assert that runs at NestJS bootstrap: if NODE_ENV=production and
(RAZORPAY_KEY_ID starts with 'rzp_test_' OR any of the four RAZORPAY_PLAN_{SOLO,TEAM}_{MONTHLY,ANNUAL}
vars is missing/empty), throw with a message naming the offending var. No effect outside
production. Unit-test the assert as a pure function.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT modify provider logic or payments.service.ts
- When done: list files changed, ACs checked, test command to run
```

---

## Human Ops Checklist (AC1–AC3, AC6)

1. ✅ Complete RazorPay KYC + submit production URL for activation review (legal pages must be live) — **done, approved 2026-07-28**
2. ✅ Dashboard → live mode → create 4 plans (SOLO/TEAM × monthly/annual); record IDs in Railway — **done**
3. ✅ Dashboard → live mode → create webhook `https://{prod-domain}/api/v1/webhooks/razorpay`, events: subscription lifecycle + payments; record secret in Railway — **done**
4. ✅ Set all live env vars in Railway; redeploy; confirm boot passes the AC4 assert — **done, production booted successfully with live keys**
5. 🔲 Run `npm run verify:payment-prereqs` against prod config — **not yet run**
6. 🔲 Buy smallest plan with a real card → verify webhook → ACTIVE in DB → refund from dashboard — **intentionally deferred, not run**

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-005-01 | Auto (unit) | P0 | Given NODE_ENV=production and rzp_test_ key, when assert runs, then boot throws naming RAZORPAY_KEY_ID | ✅ | Covered by US-LAUNCH-010's boot-guard tests; production has since booted successfully with live keys, confirming the inverse (live key passes) |
| TC-LAUNCH-005-02 | Auto (unit) | P0 | Given NODE_ENV=development and rzp_test_ key, when assert runs, then no throw | ✅ | Covered by US-LAUNCH-010 |
| TC-LAUNCH-005-03 | Auto (unit) | P1 | Given production and a missing RAZORPAY_PLAN_TEAM_ANNUAL, then boot throws naming that var | 🔲 | Not directly verified — all four plan IDs are populated in production, so this path hasn't been exercised live |
| TC-LAUNCH-005-04 | Manual | P0 | Real ₹ end-to-end: checkout → webhook signature verified → PENDING→ACTIVE → refund (AC6) | ⏸ | Deferred — explicit instruction was not to start checkout during the Task 3 smoke test |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ (including HUMAN ops checklist) — AC1–4 done, AC5/AC6 open
- [ ] All test cases run and recorded — TC-01/02 covered, TC-03/04 open
- [x] `npm run check` passes
- [x] `npm run test:unit` passes
- [ ] PR merged — no PR opened; live-key/plan/env work was ops (Railway + RazorPay dashboards), not a code change
- [ ] [TASKS.md](./TASKS.md) task list fully checked — T4 (HUMAN ops) mostly done, T1–T3 not tracked as a separate PR since the boot assert shipped under US-LAUNCH-010

---

*Story created: 2026-07-07*
