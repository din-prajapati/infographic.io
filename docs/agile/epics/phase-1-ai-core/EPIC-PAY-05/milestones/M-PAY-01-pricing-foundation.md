---
title: M-PAY-01-pricing-foundation — Pricing Foundation
type: milestone
tags: [orion, pay, pricing]
updated: 2026-08-21
---

# M-PAY-01-pricing-foundation — Pricing Foundation

> **Epic:** [EPIC-PAY-05](../EPIC.md)
> **Feature:** F-PAY-01
> **Status:** 🔲 Not Started
> **Target date:** TBD
> **Branch:** `feat/pay/m-01-pricing-relaunch`
> **Version:** V1 — all 3 stories ship before the first real ₹ transaction (see [EPIC.md](../EPIC.md) "Scope split")

---

## Goal

`PLAN_CONFIG` has real PRO and AGENCY tiers with the feasibility-checked prices/limits, the
editable-design display number is wired to the existing (kept) `US-LAUNCH-015` mechanism, and the
pre-existing pricing-page price-text drift bug is gone — all before any campaign or billing work
starts, since everything downstream reads from this config.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-PAY-102](../stories/US-PAY-102/STORY.md) | Extend PLAN_CONFIG with PRO and AGENCY tiers | M | — | 🔲 | — |
| 1 | [US-PAY-103](../stories/US-PAY-103/STORY.md) | Editable-design limit relabel (Path A) | S | — | 🔲 | — |
| 1 | [US-PAY-104](../stories/US-PAY-104/STORY.md) | Fix PricingPage.tsx hardcoded price-text drift | XS | — | 🔲 | — |

All three are order 1 — independent files, no shared dependency, safe to implement in parallel.

---

## Acceptance (Milestone Done When…)

- [ ] `PLAN_CONFIG` has FREE/SOLO/PRO/TEAM/AGENCY entries with the exact prices and limits from
      [the PRD](../../../PRD/2026-08-21-pricing-relaunch.md#2-finalized-pricing-table-feasibility-checked-not-just-proposed)
- [ ] BROKERAGE is not silently renamed to AGENCY — both exist until a real migration decision is
      made for any existing BROKERAGE subscriber
- [ ] Editable-design allowance (10/25/60/150 per tier) displays correctly without changing the
      live `US-LAUNCH-015` gating behavior
- [ ] No pricing string on `PricingPage.tsx` is independent of `PLAN_CONFIG`
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass (Gate 1 mandatory)

---

## Notes / Blockers

- US-PAY-102 is the single dependency every other story in this epic (all 3 remaining milestones)
  ultimately reads from — get this one right first.
- Does not require any Razorpay dashboard changes yet — that's M-PAY-03.

---

*Milestone created: 2026-08-21*
