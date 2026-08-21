---
title: Story Card — US-PAY-106
type: story
tags: [orion, pay, pricing, discounts]
updated: 2026-08-21
---

# Story Card — US-PAY-106

> **Status:** 🔲 Not Started
> **Feature:** F-PAY-02 — Discount & Campaign Architecture
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-02-discount-architecture](../../milestones/M-PAY-02-discount-architecture.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Created:** 2026-08-21 | **Closed:** —

---

## Story

*As* every consumer of pricing in this app (pricing page, checkout, invoices)
*I want* one `getEffectivePrice(tier, interval)` service that composes the base price, any active
campaign discount, and the standing annual multiplier correctly and consistently
*So that* the frontend and backend never compute price independently and risk disagreeing

---

## Composition rule this story implements

**Corrected 2026-08-21** — this was originally written up as a "locked decision needing product
sign-off." It isn't one, for the case that actually exists today: Founding-100's discount is a
`PERCENT` type, and the annual price is itself a pure ×10 multiplier — both are multiplicative, and
multiplication commutes. `regularMonthly × campaignPct × 10` and `regularMonthly × 10 × campaignPct`
produce the identical number (verified: `549900 × 0.7273 × 10 = 549900 × 10 × 0.7273 = 3,999,000`).
There is no order to pick for a percentage campaign — implement either, the output is the same.

**Where order actually matters:** a `FLAT` (rupee-amount, not percent) campaign discount, which the
`PricingCampaign` model also supports for future use. `₹500 off, then ×10` ≠ `×10, then ₹500 off` —
wildly different effective annual discounts. **No campaign uses `FLAT` today**, so this story does
not need to resolve that design question — it needs to not silently get it wrong if one ever does.
The standard SaaS pattern (matches Stripe's widely-documented coupon model, the most common
reference regardless of billing provider) is to scope a flat amount to a specific interval
explicitly (a separate configured value per interval), never auto-scale one flat number by the
annual multiplier. Build `getEffectivePrice()` so a future `FLAT` campaign is explicitly unsupported
(throws / falls back to `PERCENT`-only, logged) rather than silently computing a wrong number —
that's the real requirement here, not a composition-order decision.

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** `getEffectivePrice('SOLO', 'monthly')` with no active campaign returns
      `{ regularPrice: 549900, effectivePrice: 549900, campaignId: null }`; with the Founding
      campaign active, returns `{ regularPrice: 549900, effectivePrice: 399900, campaignId:
      "FOUNDING100", badge: "FOUNDING MEMBER PRICE" }`.
- [ ] **AC2 [error-path]:** `getEffectivePrice('SOLO', 'annual')` with the Founding campaign active
      returns `3999000` (`399900 × 10`). A `PERCENT`-type campaign's `tierDiscounts` entry with a
      `FLAT`-type value is rejected at read time with a clear error — never silently computed as if
      it were a percentage, and never silently applied at the wrong point in the multiplication.
- [ ] **AC3 [security]:** The function is pure and server-callable only from trusted backend code —
      it is never exposed as a client-mutable input to checkout; checkout calls this service
      directly, never accepts a client-supplied `effectivePrice`.
- [ ] **AC4 [currency-edge]:** All returned prices are integer paise; a tier with no active campaign
      and `interval: 'monthly'` returns exactly `PLAN_CONFIG[tier].price` unchanged (identity case).

---

## Out of Scope

- Rendering the resolved price in the UI (`US-PAY-112`).
- Passing the resolved `offer_id` to Razorpay at checkout (`US-PAY-110`).
- Any change to `PLAN_CONFIG` itself or the `PricingCampaign` model (already done by `US-PAY-102`,
  `US-PAY-105`).

---

## Engineering / PR

- **Branch:** `feat/pay/m-01-pricing-relaunch`
- **PR:** #_____ (milestone PR)
- **Primary files touched:**
  - `api/src/modules/payments/services/pricing-resolution.service.ts` (new)

---

## AI Implementation Prompt

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-PAY-106 — getEffectivePrice() resolution service

As every consumer of pricing in this app, I want one getEffectivePrice(tier, interval) service that
composes base price + active campaign + standing annual multiplier consistently, so frontend and
backend never disagree on price.

Composition rule: for PERCENT-type campaign discounts (the only type in use today), order of
composition with the ×10 annual multiplier is mathematically irrelevant — multiplication commutes,
implement either order, output is identical. FLAT-type campaign discounts are NOT supported yet —
reject them explicitly at read time with a clear error rather than silently computing a wrong
number; do not attempt to guess a composition order for them.

Acceptance Criteria:
  AC1 [happy-path]: getEffectivePrice('SOLO','monthly') with no campaign returns regularPrice ==
    effectivePrice == 549900; with Founding active, effectivePrice == 399900, campaignId ==
    "FOUNDING100".
  AC2 [error-path]: getEffectivePrice('SOLO','annual') with Founding active returns 399900*10 ==
    3999000. A FLAT-type tierDiscounts entry is rejected with a clear error, never silently computed.
  AC3 [security]: pure, server-only function; checkout never accepts a client-supplied
    effectivePrice.
  AC4 [currency-edge]: all outputs are integer paise; no-campaign monthly case is an identity
    (returns PLAN_CONFIG price unchanged).

Out of Scope:
  UI rendering (US-PAY-112). Passing offer_id to Razorpay (US-PAY-110). Changes to PLAN_CONFIG or
  PricingCampaign models themselves.

Primary files to touch (do NOT touch other files):
  api/src/modules/payments/services/pricing-resolution.service.ts (new)

Rules:
- Touch ONLY the file listed above
- Do NOT implement anything in Out of Scope
- Run verification gates before declaring done
- When done: list files changed, ACs checked ✅, test commands output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-PAY-106-01 | Unit | P0 | Given no active campaign, when getEffectivePrice(SOLO, monthly) is called, then effectivePrice == regularPrice | 🔲 | |
| TC-PAY-106-02 | Unit | P0 | Given Founding campaign active, when getEffectivePrice(SOLO, monthly) is called, then effectivePrice == 399900 with correct campaignId/badge | 🔲 | |
| TC-PAY-106-03 | Unit | P0 | Given Founding campaign active, when getEffectivePrice(SOLO, annual) is called, then result == 3999000 | 🔲 | |
| TC-PAY-106-05 | Unit | P1 | Given a campaign with a FLAT-type tierDiscounts entry, when getEffectivePrice() is called, then it throws/errors rather than silently computing a number | 🔲 | |
| TC-PAY-106-04 | Unit | P1 | Given every PLAN_CONFIG tier, when resolved with no campaign, then output equals PLAN_CONFIG price exactly (identity) | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes
- [ ] Gate 4 passes (backend)
- [ ] Manual flow verified
- [ ] PR merged
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

## Implementation Update (log)

---

*Story created: 2026-08-21*
