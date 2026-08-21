---
title: F-PAY-02 — Discount & Campaign Architecture
type: feature
tags: [orion, pay, pricing, discounts]
updated: 2026-08-21
---

# F-PAY-02 — Discount & Campaign Architecture

> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Phase:** Phase 1 — Revenue Strategy
> **Status:** 🔲 Not Started
> **Domain:** PAY
> **Created:** 2026-08-21 | **Closed:** —

---

## Feature Summary

**What:** A generic `PricingCampaign` model (Founding Customer 100 is the first row, not a special
case) and a separate, standing, always-on annual-billing discount, both resolved through one
`getEffectivePrice()` service.

**Why:** The next promotional campaign (festival, referral, …) must be a database row and a few
Razorpay dashboard clicks — not a code change. Reusing one config axis for every future campaign is
the entire point of this feature.

**Who:** Marketing/business owner launching campaigns; every customer who sees a discounted price.

**Success signal:** A second campaign (even a test one) can be created, activated, and deactivated
without touching application code.

---

## Milestones in this Feature

| Milestone | Goal | Target | Status | Stories |
|-----------|------|--------|:------:|---------|
| [M-PAY-02-discount-architecture](../../milestones/M-PAY-02-discount-architecture.md) | Campaign model + annual formula + price resolution | TBD | 🔲 | US-PAY-105, 106, 107, 108 |

---

## Stories in this Feature

| Story ID | Title | Milestone | Size | Status | PR |
|----------|-------|-----------|:----:|:------:|:--:|
| [US-PAY-105](../../stories/US-PAY-105/STORY.md) | PricingCampaign Prisma model + migration | M-PAY-02 | S | 🔲 | — |
| [US-PAY-106](../../stories/US-PAY-106/STORY.md) | `getEffectivePrice()` resolution service | M-PAY-02 | M | 🔲 | — |
| [US-PAY-107](../../stories/US-PAY-107/STORY.md) | Standing annual-discount formula (×10) | M-PAY-02 | S | 🔲 | — |
| [US-PAY-108](../../stories/US-PAY-108/STORY.md) | Founding Customer 100 campaign seed + Offer linkage | M-PAY-02 | M | 🔲 | — |

---

## Out of Scope (Feature Level)

- Razorpay Plan ID creation for the new tiers themselves (F-PAY-03).
- Checkout wiring that consumes the resolved price/offer (F-PAY-03).
- UI rendering of campaign badges (F-PAY-04).
- Multiple simultaneously-active campaigns (explicitly one at a time, see EPIC.md decision log).

---

## Dependencies

| Type | Description | Owner |
|------|-------------|-------|
| Requires | F-PAY-01 (`PLAN_CONFIG` PRO/AGENCY tiers must exist first) | — |
| Blocks | F-PAY-03 (checkout needs `getEffectivePrice()` + a real campaign to pass `offer_id`) | — |
| External | Razorpay Offer objects (dashboard, human task) — see [ENV.yaml](../../ENV.yaml) | Dinesh |

---

## Definition of Done (Feature)

- [ ] All milestones in this feature are ✅ Done
- [ ] All stories are ✅ Done (STORY.md status + PR merged)
- [ ] Feature is demonstrable end-to-end locally (`getEffectivePrice()` returns correct
      campaign-composed + annual-composed prices for every tier)
- [ ] Verified on staging (if applicable)
- [ ] EPIC.md feature row updated to ✅ Done
- [ ] PHASE_TRACKER.md updated

---

*Feature created: 2026-08-21*
