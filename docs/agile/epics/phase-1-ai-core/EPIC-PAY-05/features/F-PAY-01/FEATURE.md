---
title: F-PAY-01 — Pricing Configuration & Entitlements
type: feature
tags: [orion, pay, pricing]
updated: 2026-08-21
---

# F-PAY-01 — Pricing Configuration & Entitlements

> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Phase:** Phase 1 — Revenue Strategy
> **Status:** 🔲 Not Started
> **Domain:** PAY
> **Created:** 2026-08-21 | **Closed:** —

---

## Feature Summary

**What:** `PLAN_CONFIG` (the single source of truth already used by frontend and backend) carries
real PRO and AGENCY tiers at the feasibility-checked prices/limits, the editable-design allowance
displays correctly against the already-shipped `US-LAUNCH-015` mechanism, and a pre-existing pricing
display bug is fixed.

**Why:** Every other feature in this epic (discounts, billing, UI) reads tier definitions from here
— this is the foundation, not optional prep.

**Who:** Solo agents, Pro power users, Team brokerages, Agency clients — the four new/updated paid
tiers.

**Success signal:** `PLAN_CONFIG` has 5 paid-or-free entries with correct prices/limits;
`PricingPage.tsx` renders every price from that config with zero independent hardcoded strings.

---

## Milestones in this Feature

| Milestone | Goal | Target | Status | Stories |
|-----------|------|--------|:------:|---------|
| [M-PAY-01-pricing-foundation](../../milestones/M-PAY-01-pricing-foundation.md) | Config + entitlement foundation | TBD | 🔲 | US-PAY-102, 103, 104 |

---

## Stories in this Feature

| Story ID | Title | Milestone | Size | Status | PR |
|----------|-------|-----------|:----:|:------:|:--:|
| [US-PAY-102](../../stories/US-PAY-102/STORY.md) | Extend PLAN_CONFIG with PRO and AGENCY tiers | M-PAY-01 | M | 🔲 | — |
| [US-PAY-103](../../stories/US-PAY-103/STORY.md) | Editable-design limit relabel (Path A) | M-PAY-01 | S | 🔲 | — |
| [US-PAY-104](../../stories/US-PAY-104/STORY.md) | Fix PricingPage.tsx hardcoded price-text drift | M-PAY-01 | XS | 🔲 | — |

---

## Out of Scope (Feature Level)

- Any campaign/discount logic (F-PAY-02).
- Any Razorpay Plan ID creation (F-PAY-03).
- Any visual redesign (F-PAY-04).

---

## Dependencies

| Type | Description | Owner |
|------|-------------|-------|
| Requires | — (foundation feature, no upstream dependency) | — |
| Blocks | F-PAY-02, F-PAY-03, F-PAY-04 all read `PLAN_CONFIG` from here | — |
| External | None | — |

---

## Definition of Done (Feature)

- [ ] All milestones in this feature are ✅ Done
- [ ] All stories are ✅ Done (STORY.md status + PR merged)
- [ ] Feature is demonstrable end-to-end locally (correct prices render on `/pricing`)
- [ ] Verified on staging (if applicable)
- [ ] EPIC.md feature row updated to ✅ Done
- [ ] PHASE_TRACKER.md updated

---

*Feature created: 2026-08-21*
