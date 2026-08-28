---
title: Story Card — US-PAY-110
type: story
tags: [orion, pay, pricing, razorpay, security]
updated: 2026-08-21
---

# Story Card — US-PAY-110

> **Status:** 🟡 **In Progress — rescoped 2026-08-27.** AC2/AC3/AC4 are **implemented**; AC1 is
> **void** (replaced). Not blocked on anything. Remaining: manual verification + PR.
> The `offer_id` mechanism this story was written around no longer exists — the same protections
> are delivered by selecting a promo Plan object instead. See "What 2026-08-27 changed".
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

## What 2026-08-27 changed

This story was written for Razorpay **Offers**: resolve the price server-side, then hand Razorpay
an `offer_id` and let it apply the discount. The pricing module was simplified that day to the
model most SaaS billing systems use — **a promotion is a price, not a discount** — so a promo is
now its own price-immutable Plan object and checkout selects it directly.

The *purpose* of this story is unchanged and, if anything, better served: the customer is charged
exactly the price they were shown, and nothing the client sends can influence it. Only the
mechanism changed.

| AC | Fate |
|---|---|
| AC1 — pass `offer_id` to Razorpay | ❌ **Void.** Replaced by AC1′ below. Offers are not used anywhere |
| AC2 — client-supplied price ignored | ✅ **Implemented** (`b187d4a`) — price comes from the resolver, which takes only `(tier, interval)` |
| AC3 — reject a campaign applied to an uncovered tier | ✅ **Implemented, inverted.** Now `PROMO_PLAN_NOT_CONFIGURED` |
| AC4 — atomic `redemptionsUsed` increment | ✅ **Implemented** — `tryConsumeRedemption()` |

---

## Acceptance Criteria

- [x] **AC1′ [happy-path]:** `createSubscription()` resolves the tier's price via
      `getEffectivePrice()` (server-side) and, when a promo applies, resolves the **promo's own
      Razorpay Plan object** (`RAZORPAY_PLAN_<TIER>_<INTERVAL>_<CODE>`) rather than the list-price
      Plan. The app never computes a discounted amount, and never asks the provider to apply one —
      the Plan *is* the price. Covered by `payments.service.spec.ts` ("uses the promo Plan object
      when one IS configured").
- [x] **AC2 [error-path]:** Any client-supplied price/discount field in the checkout request is
      ignored entirely — the server resolves price independently. Satisfied by construction:
      `getEffectivePrice(tier, interval)` accepts no price input at all, and `finalPrice` is taken
      from its result. Verified in `pricing-resolution.service.spec.ts` (AC3, arity check) and
      `payments.service.spec.ts` (written `amount` always matches the resolved price).
- [x] **AC3 [security]:** A promo price with no corresponding Plan object is rejected **before**
      reaching Razorpay, with `PROMO_PLAN_NOT_CONFIGURED` — never silently falling back to the
      list-price Plan, which would charge the customer *more* than the page advertised. This is the
      same protection the original AC3 asked for, triggered by a missing Plan instead of an
      uncovered tier.
- [x] **AC4 [concurrency]:** On successful checkout under an active campaign,
      `PricingCampaign.redemptionsUsed` is incremented atomically — the cap is enforced in the
      `WHERE` clause of a conditional `updateMany`, so Postgres serialises it and two concurrent
      checkouts at the boundary cannot both succeed (the loser matches zero rows).
      **This closed a real bug:** `redemptionsUsed` was previously read to enforce the cap and
      written nowhere, so a "Founding 100" campaign would have run past 100 indefinitely.

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
