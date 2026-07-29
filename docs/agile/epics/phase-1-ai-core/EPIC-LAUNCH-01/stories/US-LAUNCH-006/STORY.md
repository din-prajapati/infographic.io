# Story Card — US-LAUNCH-006

> **Status:** ✅ Done
> **Feature:** F-LAUNCH-02 — Transactional Email
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-02-revenue-on](../../milestones/M-LAUNCH-02-revenue-on.md)
> **Size:** S
> **Depends on:** US-LAUNCH-002 (EmailService) merged.
> **Linear:** LIN-XXX
> **Created:** 2026-07-07 | **Closed:** 2026-07-29

---

## Story

*As a* paying subscriber
*I want* a payment receipt email when my subscription is charged
*So that* I have proof of payment for my records — today money can move with zero written confirmation.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When the RazorPay webhook processes a successful subscription charge (`subscription.charged` — the same event that flips `PENDING → ACTIVE`), a receipt email is sent via `EmailService` to the subscription owner's email
- [x] **AC2 [happy-path]:** Receipt contains: plan name (SOLO/TEAM), billing period, amount in ₹ (from the webhook payload, paise → rupees), payment date, RazorPay payment ID, and organization name — no AI vendor names, no internal IDs beyond the payment ID
- [x] **AC3 [error-path]:** Email failure never breaks webhook processing — subscription still activates, webhook still returns 200, failure logged (Sentry once EPIC-OBS-00 lands)
- [x] **AC4 [edge-case]:** Renewal charges (subsequent `subscription.charged` events on an ACTIVE subscription) also send a receipt — same template
- [x] **AC5 [regression]:** Unit tests cover: receipt sent on charge with correct fields, webhook survives EmailService failure

---

## Out of Scope

- GST-compliant PDF invoice generation (the `Invoice` model exists; tax invoicing is a later story)
- Dunning / payment-failed emails
- Subscription-cancelled / plan-changed emails
- Any change to webhook signature verification or subscription state logic

---

## Engineering / PR

- **Branch:** `feat/launch/m-02-emails-and-gate`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/payments/services/payments.service.ts` (webhook charge handler)
  - `api/src/modules/payments/payments.module.ts` (import EmailModule)
  - `api/tests/payments/receipt-email.spec.ts` (new)

---

## AI Implementation Prompt

> Copy this block into Claude Code / Cursor to implement the story.

```
Context: InfographicAI SaaS — NestJS API. See CLAUDE.md. Webhook: POST /api/v1/webhooks/razorpay,
handled in api/src/modules/payments/services/payments.service.ts. Subscription flips
PENDING → ACTIVE on subscription.charged. EmailService exists (api/src/modules/email),
never throws.

Story: US-LAUNCH-006 — Payment receipt email on subscription charge

In the subscription.charged handling path, after state update succeeds, send a receipt
email (plan, billing period, ₹ amount from payload paise, date, razorpay payment id, org
name) to the owning user. Wrap in try/catch defensive of even unexpected errors — the
webhook response must not depend on email. Cover renewals (charged on already-ACTIVE).
Unit tests: receipt fields correct; webhook 200 despite email failure.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT change signature verification or subscription state transitions
- When done: list files changed, ACs checked, test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-006-01 | Auto (unit) | P0 | Given a subscription.charged webhook, when processed, then EmailService.send called with plan, ₹ amount, payment ID, org name | ✅ | |
| TC-LAUNCH-006-02 | Auto (unit) | P0 | Given EmailService.send rejects/fails, when webhook processed, then subscription still ACTIVE and handler does not throw | ✅ | |
| TC-LAUNCH-006-03 | Auto (unit) | P1 | Given a renewal charge on an ACTIVE subscription, then a receipt is also sent | ✅ | |
| TC-LAUNCH-006-04 | Manual | P1 | Given the live-mode real ₹ test (US-LAUNCH-005 AC6), then the receipt arrives in a real inbox with correct amount | ⏸ | Deferred — RazorPay live mode is approved and keys are live (US-LAUNCH-005 AC1–4 done); this TC only needs the real ₹ transaction itself (AC6), which is intentionally not yet run |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded (TC-04 deferred, see exception below)
- [x] `npm run check` passes
- [x] `npm run test:unit` passes
- [x] Manual flow verified — deferred with documented exception below
- [x] PR merged — no PR; deployed via direct commit, documented exception below
- [x] [TASKS.md](./TASKS.md) task list fully checked

> **DoD exception 1:** TC-LAUNCH-006-04 (real ₹ receipt email in a live inbox) not run. RazorPay live mode is fully active (US-LAUNCH-005 AC1–4 done) — this is not blocked on approval. It is deferred because running a real transaction was explicitly out of scope for the Task 3 smoke test ("DO NOT Start Checkout Flow"). Approved by: Dinesh, 2026-07-29. Will be picked up the first time a real subscription is purchased (US-LAUNCH-005 AC6).
> **DoD exception 2:** No PR was opened — code shipped via direct commit `fa1d345` to `main`, consistent with this repo's own precedent for US-LAUNCH-001/002/003/009/010/011. Gate 1 (`npm run check` + `npm run test:unit`) passed on the commit. Approved by: Dinesh, 2026-07-29.

---

*Story created: 2026-07-07*
