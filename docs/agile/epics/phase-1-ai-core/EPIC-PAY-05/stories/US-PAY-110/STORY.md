---
title: Story Card — US-PAY-110
type: story
tags: [orion, pay, pricing, razorpay, security]
updated: 2026-08-21
---

# Story Card — US-PAY-110

> **Status:** 🔲 Not Started
> **Feature:** F-PAY-03 — Billing Integration (Razorpay)
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-03-billing-integration](../../milestones/M-PAY-03-billing-integration.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Created:** 2026-08-21 | **Closed:** —

---

## Story

*As* a customer checking out under an active Founding campaign
*I want* Razorpay to apply and validate my discount, never the app trusting a price I sent
*So that* nobody can manipulate the checkout request to pay less than the real, server-resolved
price — closing a real class of vulnerability, not a theoretical one

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** `payments.service.ts`'s subscription-creation call resolves the tier's
      price via `getEffectivePrice()` (server-side) and, if a campaign is active for that tier,
      passes the campaign's `razorpayOfferId` as `offer_id` to Razorpay's subscription-creation API
      — Razorpay applies and validates the discount, the app never computes or sends a discounted
      amount itself.
- [ ] **AC2 [error-path]:** If the checkout request body contains any client-supplied price/discount
      field, it is ignored entirely — the server resolves price independently regardless of what the
      client sent. Verified with a test that sends a manipulated/incorrect price and confirms the
      real charge still matches the server-resolved amount.
- [ ] **AC3 [security]:** A request attempting to apply a campaign's `offer_id` to a tier that
      campaign does not cover (`tierDiscounts` has no entry for that tier) is rejected before
      reaching Razorpay — not passed through and left to fail at Razorpay's API.
- [ ] **AC4 [currency-edge]:** On successful checkout under an active campaign,
      `PricingCampaign.redemptionsUsed` is incremented atomically (transaction or row lock) — two
      concurrent checkouts near the `maxRedemptions` cap cannot both succeed and push the count past
      the cap.

---

## Out of Scope

- Webhook-side entitlement activation (`US-PAY-111`, already done by this point in dependency order
  — this story is the checkout/creation side only).
- Any UI change to the checkout flow itself (existing checkout UI is reused as-is).
- Refund/cancellation handling for a founding-priced subscription — existing Razorpay
  cancellation flow is unmodified.

---

## Engineering / PR

- **Branch:** `feat/pay/m-01-pricing-relaunch`
- **PR:** #_____ (milestone PR)
- **Primary files touched:**
  - `api/src/modules/payments/services/payments.service.ts` — `createSubscription()` calls
    `getEffectivePrice()` and passes `offer_id` when applicable
  - `api/src/modules/payments/services/pricing-campaign.service.ts` — add the atomic
    `incrementRedemption(campaignId)` method

---

## AI Implementation Prompt

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-PAY-110 — Checkout passes offer_id server-side

As a customer checking out under an active Founding campaign, I want Razorpay to apply and validate
my discount, never the app trusting a price I sent — closing a real "trust the client" vulnerability
class.

Acceptance Criteria:
  AC1 [happy-path]: subscription-creation resolves price via getEffectivePrice() server-side and
    passes the active campaign's razorpayOfferId as offer_id to Razorpay — app never computes or
    sends a discounted amount itself.
  AC2 [error-path]: any client-supplied price/discount field in the checkout request is ignored
    entirely — test with a manipulated price and confirm the real charge still matches the
    server-resolved amount.
  AC3 [security]: a request applying a campaign's offer_id to a tier not in that campaign's
    tierDiscounts is rejected before reaching Razorpay.
  AC4 [currency-edge]: redemptionsUsed increments atomically on success — two concurrent checkouts
    near the cap cannot both push past maxRedemptions.

Out of Scope:
  Webhook-side entitlement activation (US-PAY-111). Checkout UI changes. Refund/cancellation
  handling.

Primary files to touch (do NOT touch other files):
  api/src/modules/payments/services/payments.service.ts
  api/src/modules/payments/services/pricing-campaign.service.ts

Rules:
- Touch ONLY the files listed above
- Do NOT implement anything in Out of Scope
- Run verification gates before declaring done
- When done: list files changed, ACs checked ✅, test commands output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-PAY-110-01 | Unit | P0 | happy-path: `payments.service.ts`'s subscription-creation call resolv… | 🔲 | |
| TC-PAY-110-02 | Unit | P0 | error-path: If the checkout request body contains any client-supplied… | 🔲 | |
| TC-PAY-110-03 | Unit | P1 | security: A request attempting to apply a campaign's `offer_id` to … | 🔲 | |
| TC-PAY-110-04 | Unit | P1 | currency-edge: On successful checkout under an active campaign, | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes
- [ ] Gate 4 passes (backend)
- [ ] Manual flow verified (real staging checkout under an active campaign)
- [ ] PR merged
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

## Implementation Update (log)

---

*Story created: 2026-08-21*
