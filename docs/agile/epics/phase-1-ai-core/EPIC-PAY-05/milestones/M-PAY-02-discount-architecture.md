---
title: M-PAY-02-discount-architecture — Discount Architecture
type: milestone
tags: [orion, pay, pricing, discounts]
updated: 2026-08-21
---

# M-PAY-02-discount-architecture — Discount Architecture

> **Epic:** [EPIC-PAY-05](../EPIC.md)
> **Feature:** F-PAY-02
> **Status:** 🔲 Not Started
> **Target date:** TBD
> **Branch:** `feat/pay/m-01-pricing-relaunch`
> **Version:** **Mixed** — US-PAY-107 is V1 (ships before the first real ₹ transaction); US-PAY-105,
> 106, 108 are V2 (deferred — generalized campaign engine, premature before real demand data). See
> [EPIC.md](../EPIC.md) "Scope split."

---

## Goal

Two independent discount mechanisms exist and compose correctly: a generic, reusable
`PricingCampaign` model (Founding Customer 100 is the first row, not a special case) and a standing,
always-on annual-billing discount — both resolved through one `getEffectivePrice()` service so the
frontend and checkout never compute price independently.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR | Version |
|:-----:|-------|-------|:----:|------------|:------:|:--:|:---:|
| 1 | [US-PAY-105](../stories/US-PAY-105/STORY.md) | PricingCampaign Prisma model + migration | S | — | 🔲 | — | V2 |
| 1 | [US-PAY-107](../stories/US-PAY-107/STORY.md) | Standing annual-discount formula (×10) | S | US-PAY-102 (M-PAY-01) | 🔲 | — | **V1** |
| 2 | [US-PAY-106](../stories/US-PAY-106/STORY.md) | `getEffectivePrice()` resolution service | M | US-PAY-102, US-PAY-105 | 🔲 | — | V2 |
| 3 | [US-PAY-108](../stories/US-PAY-108/STORY.md) | Founding Customer 100 campaign seed + Offer linkage | M | US-PAY-105, US-PAY-106 | 🔲 | — | V2 |

---

## Acceptance (Milestone Done When…)

- [ ] `PricingCampaign` model exists; a second future campaign (e.g. a festival test row) can be
      inserted and activated with zero code changes — verify this literally, don't just assert it
- [ ] Only one `PricingCampaign` can be `isActive` at a time (enforced, not just documented)
- [ ] Annual price for every tier equals `regularMonthly × 10` — not `× 12`, not `× 12 × 0.85`
      (the formula this replaces)
- [ ] Campaign discount and annual discount compose correctly for `PERCENT`-type discounts (order
      is mathematically irrelevant, both are multiplicative — verified in
      [US-PAY-106](../stories/US-PAY-106/STORY.md)); a `FLAT`-type discount is explicitly rejected,
      never silently mis-computed
- [ ] Founding Customer 100 campaign is seeded with the real per-tier discounts (Solo/Pro ~27.3%,
      Team/Agency ~31.8%) and linked to real Razorpay Offer IDs
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass (Gate 1 + Gate 4 for the new service)

---

## Notes / Blockers

- Requires `RAZORPAY_OFFER_FOUNDING_*` Offer objects created in the Razorpay dashboard before
  US-PAY-108 can complete — human task, see [ENV.yaml](../ENV.yaml).
- The campaign/annual composition rule is a real product decision, not an implementation detail —
  don't let `US-PAY-106` silently pick a direction without confirming it first.

---

*Milestone created: 2026-08-21*
