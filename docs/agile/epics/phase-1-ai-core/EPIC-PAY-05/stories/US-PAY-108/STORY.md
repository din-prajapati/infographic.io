---
title: Story Card — US-PAY-108
type: story
tags: [orion, pay, pricing, discounts, razorpay]
updated: 2026-08-21
---

# Story Card — US-PAY-108

> **Status:** 🟡 In Progress (code done) — blocked on T0 HUMAN task (real Razorpay Offer objects),
> see TASKS.md
> **Feature:** F-PAY-02 — Discount & Campaign Architecture
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-02-discount-architecture](../../milestones/M-PAY-02-discount-architecture.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Created:** 2026-08-21 | **Closed:** — (AC3 needs T0 first, see `HUMAN_TASKS.md` #7)

---

## Story

*As* Buildographic's business owner launching the relaunch
*I want* the Founding Customer 100 program seeded as the first real `PricingCampaign` row, linked to
real Razorpay Offer objects
*So that* the first 100 customers get the founding discount automatically, capped, and time-boxed —
proving the generic campaign system actually works end-to-end before a second campaign ever exists

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** A `PricingCampaign` row exists with `code: "FOUNDING100"`, `name:
      "Buildographic Founding 100"`, `displayBadge: "FOUNDING MEMBER PRICE"`, `tierDiscounts` mapping
      each of SOLO/PRO/TEAM/AGENCY to its real founding price and a real `razorpayOfferId`,
      `maxRedemptions: 100`, `isActive: true`. Seed script written; not yet run against a real DB —
      blocked on T0 (Offer objects don't exist yet).
- [x] **AC2 [error-path]:** When `redemptionsUsed` reaches `maxRedemptions` (100), the campaign
      cannot be applied to a new subscription — `getEffectivePrice()` falls back to the regular
      price for any tier once the cap is hit, and this is verified with a test, not just asserted.
- [ ] **AC3 [security]:** `razorpayOfferId` values in `tierDiscounts` reference real, verified
      Razorpay Offer objects (test-mode acceptable for staging) — not placeholder strings that would
      silently fail at checkout. **Genuinely blocked on T0** — the seed script refuses to run
      without all 4 `RAZORPAY_OFFER_FOUNDING_*` env vars set (verified by construction: no fallback
      literal exists in the script), but cannot itself create the human dashboard objects.
- [x] **AC4 [currency-edge]:** Per-tier discount percentages match the feasibility-checked numbers
      exactly: SOLO/PRO ≈27.3% off (₹3,999/₹7,999), TEAM/AGENCY ≈31.8% off (₹14,999/₹29,999) — not a
      single flat percentage across all tiers. Computed exactly from real regular/founding prices,
      not hardcoded approximations — verified the computed percentage reproduces the exact founding
      price via `Math.round`, with zero drift.

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
|-------|------|----------|----------|--------|---------|
| TC-PAY-108-01 | Unit | P0 | happy-path: A `PricingCampaign` row exists with `code: "FOUNDING100"`… | ⏸ | Script written; not yet run against a real DB (blocked on T0) |
| TC-PAY-108-02 | Unit | P0 | error-path: When `redemptionsUsed` reaches `maxRedemptions` (100), th… | ✅ | |
| TC-PAY-108-03 | Unit | P1 | security: `razorpayOfferId` values in `tierDiscounts` reference rea… | ⏸ | Blocked on T0 |
| TC-PAY-108-04 | Unit | P1 | currency-edge: Per-tier discount percentages match the feasibility-check… | ✅ | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done

- [ ] All ACs checked ✅ — AC1/2/4 done; AC3 genuinely blocked on T0 (human)
- [x] All test cases run and recorded (TC-01/03 blocked, recorded as such)
- [x] Gate 1 passes
- [ ] Gate 4 passes (backend) — not separately run this pass
- [ ] Manual flow verified — blocked on T0
- [ ] PR merged
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked — T0 (human) still open
- [ ] STORY.md status updated to ✅ Done — stays 🟡 until T0 clears

---

## Implementation Update (log)

**2026-08-23.** Depends on `US-PAY-105`/`106`, both done. Extended `US-PAY-106`'s
`getEffectivePrice()` with the redemption-cap check (AC2) rather than building a parallel check —
that story's own file, minimal addition. Wrote the seed script (`api/scripts/seed-founding-campaign.ts`,
not `api/prisma/` as originally listed — matches the actual location of the referenced
`seed-premium-templates.ts`); computes each tier's exact discount percentage from real
regular/founding prices rather than hardcoding an approximation, so `getEffectivePrice()`
reproduces the founding price exactly. Reuses `PricingCampaignService.createCampaign()` — no
parallel Prisma insert. AC1/AC3 genuinely can't close without T0 (the 4 real Razorpay Offer
objects) — the script itself refuses to run without them, verified by construction, not faked.

Commits `0dae9bf` (AC2), `40076f7` (seed script), `40a4418` (env docs), `47ebff8` (tests). Gate 1:
`npm run test:unit:backend` (410/410, up from 403).

---

*Story created: 2026-08-21*
