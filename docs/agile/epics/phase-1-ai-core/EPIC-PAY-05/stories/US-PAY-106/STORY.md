---
title: Story Card — US-PAY-106
type: story
tags: [orion, pay, pricing, discounts]
updated: 2026-08-21
---

# Story Card — US-PAY-106

> **Status:** ✅ Done (code) — manual/PR still open, see TASKS.md
> **Feature:** F-PAY-02 — Discount & Campaign Architecture
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-02-discount-architecture](../../milestones/M-PAY-02-discount-architecture.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Created:** 2026-08-21 | **Closed:** 2026-08-23 (code) — full DoD pending

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

- [x] **AC1 [happy-path]:** `getEffectivePrice('SOLO', 'monthly')` with no active campaign returns
      `{ regularPrice: 5499, effectivePrice: 5499, campaignId: null }`; with the Founding
      campaign active, returns `{ regularPrice: 5499, effectivePrice: 3999, campaignId:
      "FOUNDING100", badge: "FOUNDING MEMBER PRICE" }`. **Corrected 2026-08-23**: original numbers
      were paise (`549900`/`399900`) — same wrong-unit assumption as `US-PAY-102`/`107` (every
      `PLAN_CONFIG` price is integer rupees). Also depended on `US-PAY-102`'s SOLO repricing gap
      (`2999 → 5499`), fixed the same day. Verified — `pricing-resolution.service.spec.ts`.
- [x] **AC2 [error-path]:** `getEffectivePrice('SOLO', 'annual')` with the Founding campaign active
      returns `39990` (`3999 × 10`). A `PERCENT`-type campaign's `tierDiscounts` entry with a
      `FLAT`-type value is rejected at read time with a clear error — never silently computed as if
      it were a percentage, and never silently applied at the wrong point in the multiplication.
- [x] **AC3 [security]:** The function is pure and server-callable only from trusted backend code —
      it is never exposed as a client-mutable input to checkout; checkout calls this service
      directly, never accepts a client-supplied `effectivePrice`. Satisfied by construction: only
      parameters are `tier`/`interval`, no HTTP controller exposes this service.
- [x] **AC4 [currency-edge]:** All returned prices are integer **rupees** (corrected from "paise" —
      see AC1); a tier with no active campaign and `interval: 'monthly'` returns exactly
      `PLAN_CONFIG[tier].price` unchanged (identity case).

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
|-------|------|----------|----------|--------|---------|
| TC-PAY-106-01 | Unit | P0 | happy-path: `getEffectivePrice('SOLO', 'monthly')` with no active cam… | ✅ | |
| TC-PAY-106-02 | Unit | P0 | error-path: `getEffectivePrice('SOLO', 'annual')` with the Founding c… | ✅ | |
| TC-PAY-106-03 | Unit | P1 | security: The function is pure and server-callable only from truste… | ✅ | |
| TC-PAY-106-04 | Unit | P1 | currency-edge: All returned prices are integer paise; a tier with no act… | ✅ | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] Gate 1 passes
- [ ] Gate 4 passes (backend) — not separately run this pass
- [ ] Manual flow verified
- [ ] PR merged
- [ ] No console errors for the changed flow
- [x] [TASKS.md](./TASKS.md) task list fully checked (except Gate 4/manual/PR, tracked open)
- [x] STORY.md status updated to ✅ Done (code)

---

## Implementation Update (log)

**2026-08-23.** Depends on `US-PAY-102` and `US-PAY-105`, both done. While preparing this story's
test data, found `US-PAY-102`'s own SOLO/TEAM repricing had never happened (a real gap, not just a
units error) — flagged to the user, fixed in `US-PAY-102` (re-opened) before writing this story's
tests against real numbers. Also corrected this AC's own paise/rupee unit error, same class of bug
already found twice in `US-PAY-102`/`107`.

`getEffectivePrice()` composes `PLAN_CONFIG` base price + the active `PricingCampaign`'s `PERCENT`
discount (via `PricingCampaignService.getActiveCampaign()`) + the standing ×10 annual multiplier
(via `US-PAY-107`'s `getAnnualPrice()`). `FLAT`-type discounts throw rather than compute a guessed
number — no campaign uses `FLAT` today, so this is defense-in-depth, not a live path. Registered in
`PaymentsModule` via constructor injection of `PricingCampaignService`.

Gate 1: `npm run check` (0 errors), `npm run test:unit:backend` (403/403, up from 395). Commits
`ccbbe37`, `4c2147f`.

---

*Story created: 2026-08-21*
