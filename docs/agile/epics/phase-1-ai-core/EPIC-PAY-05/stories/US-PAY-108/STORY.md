---
title: Story Card — US-PAY-108
type: story
tags: [orion, pay, pricing, discounts, razorpay]
updated: 2026-08-21
---

# Story Card — US-PAY-108

> **Status:** ⏭️ **Superseded — closed 2026-08-27, not shipped as written.**
> **Feature:** F-PAY-02 — Discount & Campaign Architecture
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-02-discount-architecture](../../milestones/M-PAY-02-discount-architecture.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Created:** 2026-08-21 | **Closed:** 2026-08-27 (superseded, not shipped)

---

> **⏭️ SUPERSEDED — do not implement as written, and do not create the Razorpay Offer objects.**
>
> This story asked for the Founding-100 program to be seeded as a `PricingCampaign` row whose
> `tierDiscounts` mapped each tier to a **discount percentage** and a **Razorpay Offer id**. On
> 2026-08-27 the pricing module was simplified to the model most SaaS billing systems use —
> **a promotion is a price, not a discount** — which removed both of those things:
>
> - **Percentages no longer reach a price.** `Math.round(regular * (1 - pct/100))` is deleted.
>   A promo price is authored in `PLAN_CONFIG[tier].promoPrices`, reviewed in a PR like any other
>   price. That voids **AC4** entirely (its ≈27.3% / ≈31.8% figures) and the `tierDiscounts` half
>   of **AC1**.
> - **Razorpay Offers are not used at all.** A promo is its own price-immutable Plan object that
>   checkout selects instead of the list-price one, so there is nothing left for an Offer to
>   discount. That voids **AC3** — the very AC this story sat blocked on. `HUMAN_TASKS.md` §7 is
>   retired and the 4 `RAZORPAY_OFFER_FOUNDING_*` vars are gone from `.env.example`.
>
> **What survived, and where it went:**
>
> - **AC2** (a capped campaign falls back to list price once exhausted) shipped and still holds —
>   test retained in `pricing-resolution.service.spec.ts`.
> - The **cap's missing write side** — `redemptionsUsed` was read to enforce the cap and written
>   nowhere, so Founding-100 would never have stopped at 100 — was fixed under
>   **[US-PAY-110](../US-PAY-110/STORY.md)** AC4, which owns the increment by this story's own
>   Out of Scope. `PricingCampaignService.tryConsumeRedemption()`, atomic, cap in the `WHERE`
>   clause.
> - The **seed script** (`api/scripts/seed-founding-campaign.ts`) still exists and was rewritten
>   for the authored-price model: it creates the row, and refuses to activate a campaign whose
>   prices or promo Plan objects do not exist.
>
> **What is NOT carried forward:** actually running Founding-100. That needs an authored founding
> price (still an open product decision) and its promo Plan objects. Per the
> [promotional-pricing PRD](../../../../../PRD/2026-08-27-promotional-pricing.md), founding should
> be **annual-only** (R1), and no promo should run before the first real ₹ transaction succeeds
> (`US-LAUNCH-005` AC6). When that decision lands, write a **new, smaller story** against the
> authored-price model — do not reopen this card.
>
> Keeping this card as the record of the original ask, and of the reference founding prices it
> carried: SOLO ₹3,999 · PRO ₹7,999 · TEAM ₹14,999 · AGENCY ₹29,999. Those are **inputs to a
> decision, not committed prices.**

---

## Story

*As* Buildographic's business owner launching the relaunch
*I want* the Founding Customer 100 program seeded as the first real `PricingCampaign` row, linked to
real Razorpay Offer objects
*So that* the first 100 customers get the founding discount automatically, capped, and time-boxed —
proving the generic campaign system actually works end-to-end before a second campaign ever exists

---

## What 2026-08-27 changed

> Summary and rationale are in the superseded notice at the top of this card. This section is the
> AC-by-AC record, so a reader can tell exactly which parts of the original contract were
> delivered, which changed shape, and which became meaningless.

| AC | Fate |
|---|---|
| AC1 — campaign row with `tierDiscounts` + `razorpayOfferId` | **Partly survives.** The row is still seeded and `seed-founding-campaign.ts` still creates it, but it now carries only *which* promo is live — no prices, no Offer ids. `tierDiscounts` is written as `{}` and read by nothing |
| AC2 — cap falls back to list price once exhausted | ✅ **Shipped and still true.** Test retained in `pricing-resolution.service.spec.ts` |
| AC3 — `razorpayOfferId` references real Offer objects | ❌ **Void.** Offers are not used at all. This is the AC the story was blocked on, and it can never be satisfied because the thing it describes no longer exists |
| AC4 — per-tier percentages ≈27.3% / ≈31.8% | ❌ **Void.** No percentage reaches a price any more. The founding price is now an authored number per tier, and *which* number is still undecided |

**A caveat on AC2's original tick.** It was marked done because the read-side fallback was
implemented and tested — but the cap it enforced could never actually close: `redemptionsUsed` was
read here and written nowhere in the codebase. Founding-100 would have run past 100 indefinitely.
Fixed 2026-08-27 under [US-PAY-110](../US-PAY-110/STORY.md) AC4, which owns the increment by this
story's own Out of Scope.

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

> **Closed as ⏭️ SUPERSEDED 2026-08-27 — the standard DoD does not apply.** This story was not
> shipped as written and never will be: AC3 and AC4 describe mechanisms (Razorpay Offers, discount
> percentages) that no longer exist anywhere in the codebase. A superseded story is closed on the
> decision record, not on its gates.

- [x] Supersede decision recorded on this card, with an AC-by-AC fate table
- [x] Surviving work re-homed and traceable — AC2 stands (test retained); the redemption-cap write
      side landed under [US-PAY-110](../US-PAY-110/STORY.md) AC4
- [x] Downstream references updated — `EPIC.md` story table + dependency graph, `M-PAY-02`,
      `M-PAY-03` (US-PAY-110 no longer depends on this story), `HUMAN_TASKS.md` §7 retired
- [x] Dead configuration removed — 4 `RAZORPAY_OFFER_FOUNDING_*` vars deleted from `.env.example`
- [x] Gate 1 passes ✅ — `npm run check` 0 errors, 426/426 backend + 14/14 frontend suites
      (2026-08-27, for the simplification that superseded this story)
- [x] EPIC.md "Implementation Update" log appended
- [ ] ~~Manual flow verified~~ / ~~PR merged~~ — N/A, nothing from this card ships on its own

**If Founding-100 is ever run**, write a new, smaller story against the authored-price model.
Do not reopen this one.
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
