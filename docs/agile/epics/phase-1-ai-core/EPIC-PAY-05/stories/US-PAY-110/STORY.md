---
title: Story Card — US-PAY-110
type: story
tags: [orion, pay, pricing, razorpay, security]
updated: 2026-08-21
---

# Story Card — US-PAY-110

> **Status:** 🟢 **Code complete and verified — 2026-09-07.** All four ACs (AC1′/AC2/AC3/AC4) hold, with 61 passing tests across `payments.service.spec.ts`, `pricing-campaign.service.spec.ts` and `pricing-resolution.service.spec.ts`; the four TCs are recorded below. Gate 1 green. **Not closed**, and only two things stand in the way, neither of them code: a real staging checkout under an active campaign (human), and the PR. Gate 4's integration half is blocked by a dead `.env.test` database (BL-28), not by this story. (The earlier header read "AC2/AC3/AC4 are implemented; AC1 is…" — AC1 was voided on 2026-08-27 and replaced by AC1′, which is done.)
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
| TC-PAY-110-01 | Unit | P0 | happy-path: subscription creation resolves the price through `getEffectivePrice()` and selects the promo's own Plan object | ✅ PASS 2026-09-07 | `payments.service.spec.ts` — "uses the promo Plan object when one IS configured, never the list-price plan", "records the resolver price, not a second PLAN_CONFIG read", "asks the resolver for the annual interval when billing annually" |
| TC-PAY-110-02 | Unit | P0 | error-path: a client-supplied price/discount field is ignored; the server resolves price independently | ✅ PASS 2026-09-07 | `pricing-resolution.service.spec.ts` — "takes no price/discount input from the caller — only tier and interval" (arity check). Satisfied by construction: `getEffectivePrice(tier, interval)` has nowhere to put a client price. API smoke confirms it: `GET /api/v1/pricing` returns server-resolved `regularPrice`/`effectivePrice`/`campaignId` per tier |
| TC-PAY-110-03 | Unit | P1 | security: a promo price with no Plan object behind it is refused before reaching Razorpay | ✅ PASS 2026-09-07 | `payments.service.spec.ts` — "refuses rather than charging list price when a promo has no Plan object behind it" (`PROMO_PLAN_NOT_CONFIGURED`) |
| TC-PAY-110-04 | Unit | P1 | concurrency: `redemptionsUsed` increments atomically; two checkouts at the cap cannot both succeed | ✅ PASS 2026-09-07 | `pricing-campaign.service.spec.ts` — "enforces the cap in the WHERE clause, not in application code", "returns false when the campaign is already at its cap (zero rows matched)", plus the increment and inactive-campaign cases. `pricing-resolution.service.spec.ts` covers the list-price fallback once the cap is reached |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done

- [x] All ACs checked ✅ — AC1′, AC2, AC3, AC4 (AC1 voided by the 2026-08-27 rescope)
- [x] All test cases run and recorded — 2026-09-07, 61 tests across the three covering suites, all green
- [x] Gate 1 passes — `tsc` clean, 525 backend + 271 client, 2026-09-07
- [~] **Gate 4 (backend) — half blocked on infrastructure, not on this story.**
      API smoke ✅: `GET /api/v1/pricing` on a live dev server returns the full server-resolved
      plan matrix. Integration suite ❌ **cannot run** — the `.env.test` Neon database
      (`ep-lingering-frost-afktjhej`, us-west-2) refuses every connection; DNS resolves, so it is a
      suspended project or rotated credentials, not a pause. 2 files failed, 12 tests skipped.
      Nothing in this story can fix it — see BL-28.
- [ ] Manual flow verified (real staging checkout under an active campaign) — **HUMAN**
- [ ] PR merged
- [x] No console errors for the changed flow — API smoke clean
- [x] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done — held: two DoD lines remain

---

## Implementation Update (log)

---

*Story created: 2026-08-21*
