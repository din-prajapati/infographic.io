# Story Card — US-LAUNCH-006

> **Status:** 🔲 Not Started
> **Feature:** F-LAUNCH-02 — Transactional Email
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-02-revenue-on](../../milestones/M-LAUNCH-02-revenue-on.md)
> **Size:** S
> **Depends on:** US-LAUNCH-002 (EmailService) merged.
> **Linear:** LIN-XXX
> **Created:** 2026-07-07 | **Closed:** —

---

## Story

*As a* paying subscriber
*I want* a payment receipt email when my subscription is charged
*So that* I have proof of payment for my records — today money can move with zero written confirmation.

---

## Acceptance Criteria

- [ ] **AC1:** When the RazorPay webhook processes a successful subscription charge (`subscription.charged` — the same event that flips `PENDING → ACTIVE`), a receipt email is sent via `EmailService` to the subscription owner's email
- [ ] **AC2:** Receipt contains: plan name (SOLO/TEAM), billing period, amount in ₹ (from the webhook payload, paise → rupees), payment date, RazorPay payment ID, and organization name — no AI vendor names, no internal IDs beyond the payment ID
- [ ] **AC3:** Email failure never breaks webhook processing — subscription still activates, webhook still returns 200, failure logged (Sentry once EPIC-OBS-00 lands)
- [ ] **AC4:** Renewal charges (subsequent `subscription.charged` events on an ACTIVE subscription) also send a receipt — same template
- [ ] **AC5:** Unit tests cover: receipt sent on charge with correct fields, webhook survives EmailService failure

---

## Out of Scope

- GST-compliant PDF invoice generation (the `Invoice` model exists; tax invoicing is a later story)
- Dunning / payment-failed emails
- Subscription-cancelled / plan-changed emails
- Any change to webhook signature verification or subscription state logic

---

## Engineering / PR

- **Branch:** `feat/launch-us-launch-006-receipt-email`
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
| TC-LAUNCH-006-01 | Auto (unit) | P0 | Given a subscription.charged webhook, when processed, then EmailService.send called with plan, ₹ amount, payment ID, org name | 🔲 | |
| TC-LAUNCH-006-02 | Auto (unit) | P0 | Given EmailService.send rejects/fails, when webhook processed, then subscription still ACTIVE and handler does not throw | 🔲 | |
| TC-LAUNCH-006-03 | Auto (unit) | P1 | Given a renewal charge on an ACTIVE subscription, then a receipt is also sent | 🔲 | |
| TC-LAUNCH-006-04 | Manual | P1 | Given the live-mode real ₹ test (US-LAUNCH-005 AC6), then the receipt arrives in a real inbox with correct amount | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-07*
