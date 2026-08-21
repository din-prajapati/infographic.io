---
title: Story Card — US-PAY-108
type: story
tags: [orion, pay, pricing, discounts, razorpay]
updated: 2026-08-21
---

# Story Card — US-PAY-108

> **Status:** 🔲 Not Started
> **Feature:** F-PAY-02 — Discount & Campaign Architecture
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-02-discount-architecture](../../milestones/M-PAY-02-discount-architecture.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Created:** 2026-08-21 | **Closed:** —

---

## Story

*As* Buildographic's business owner launching the relaunch
*I want* the Founding Customer 100 program seeded as the first real `PricingCampaign` row, linked to
real Razorpay Offer objects
*So that* the first 100 customers get the founding discount automatically, capped, and time-boxed —
proving the generic campaign system actually works end-to-end before a second campaign ever exists

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** A `PricingCampaign` row exists with `code: "FOUNDING100"`, `name:
      "Buildographic Founding 100"`, `displayBadge: "FOUNDING MEMBER PRICE"`, `tierDiscounts` mapping
      each of SOLO/PRO/TEAM/AGENCY to its real founding price and a real `razorpayOfferId`,
      `maxRedemptions: 100`, `isActive: true`.
- [ ] **AC2 [error-path]:** When `redemptionsUsed` reaches `maxRedemptions` (100), the campaign
      cannot be applied to a new subscription — `getEffectivePrice()` falls back to the regular
      price for any tier once the cap is hit, and this is verified with a test, not just asserted.
- [ ] **AC3 [security]:** `razorpayOfferId` values in `tierDiscounts` reference real, verified
      Razorpay Offer objects (test-mode acceptable for staging) — not placeholder strings that would
      silently fail at checkout.
- [ ] **AC4 [currency-edge]:** Per-tier discount percentages match the feasibility-checked numbers
      exactly: SOLO/PRO ≈27.3% off (₹3,999/₹7,999), TEAM/AGENCY ≈31.8% off (₹14,999/₹29,999) — not a
      single flat percentage across all tiers.

---

## Out of Scope

- The redemption-count *increment* logic at actual checkout time — that belongs to `US-PAY-110`
  (this story only seeds the campaign and its cap; incrementing happens where a subscription is
  actually created).
- Building an admin UI to create future campaigns — first pass is a documented seed
  script/migration, matching the human-task pattern already used for `RAZORPAY_PLAN_*` setup.

---

## Engineering / PR

- **Branch:** `feat/pay/m-01-pricing-relaunch`
- **PR:** #_____ (milestone PR)
- **Primary files touched:**
  - `api/prisma/seed-founding-campaign.ts` (new) — one-off seed script, same pattern as
    `seed-premium-templates.ts` referenced elsewhere in this codebase
  - `.env.example` — document the 4 `RAZORPAY_OFFER_FOUNDING_*` variables (see
    [ENV.yaml](../../ENV.yaml))

---

## AI Implementation Prompt

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-PAY-108 — Founding Customer 100 campaign seed + Offer linkage

As Buildographic's business owner, I want Founding Customer 100 seeded as the first real
PricingCampaign row, linked to real Razorpay Offer objects, proving the generic campaign system
works before a second campaign ever exists.

Acceptance Criteria:
  AC1 [happy-path]: PricingCampaign row with code "FOUNDING100", correct name/badge, tierDiscounts
    mapping SOLO/PRO/TEAM/AGENCY to real founding prices + razorpayOfferId, maxRedemptions:100,
    isActive:true.
  AC2 [error-path]: once redemptionsUsed hits 100, getEffectivePrice() falls back to regular price
    for every tier — test this, don't just assert it.
  AC3 [security]: razorpayOfferId values reference real (test-mode acceptable) Razorpay Offer
    objects, not placeholders.
  AC4 [currency-edge]: SOLO/PRO ~27.3% off, TEAM/AGENCY ~31.8% off — exact per-tier numbers, not one
    flat percent.

Out of Scope:
  Redemption-count increment at checkout time (US-PAY-110). Admin UI for future campaigns.

Primary files to touch (do NOT touch other files):
  api/prisma/seed-founding-campaign.ts (new)
  .env.example

Rules:
- Touch ONLY the files listed above
- Do NOT implement anything in Out of Scope
- Run verification gates before declaring done
- When done: list files changed, ACs checked ✅, test commands output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-PAY-108-01 | Unit | P0 | Given the seeded FOUNDING100 campaign, when read, then tierDiscounts matches the exact spec (27.3%/31.8% by tier) | 🔲 | |
| TC-PAY-108-02 | Unit | P0 | Given redemptionsUsed == maxRedemptions, when getEffectivePrice() is called for any tier, then it returns the regular price, not founding | 🔲 | |
| TC-PAY-108-03 | Manual | P1 | Given staging Razorpay test mode, when the seeded Offer IDs are checked, then they resolve to real, non-expired Offer objects | 🔲 | |

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
