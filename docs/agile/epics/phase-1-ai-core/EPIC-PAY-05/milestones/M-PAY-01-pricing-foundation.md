---
title: M-PAY-01-pricing-foundation — Pricing Foundation
type: milestone
tags: [orion, pay, pricing]
updated: 2026-08-25
---

# M-PAY-01-pricing-foundation — Pricing Foundation

> **Epic:** [EPIC-PAY-05](../EPIC.md)
> **Feature:** F-PAY-01
> **Status:** 🟡 In Progress — US-PAY-103/104 code-complete (manual/PR still open); US-PAY-102
> re-opened 2026-08-23 for a real SOLO/TEAM gap, in progress (8/15 tasks)
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
| 1 | [US-PAY-102](../stories/US-PAY-102/STORY.md) | Extend PLAN_CONFIG with PRO and AGENCY tiers | M | — | 🟡 (re-opened) | — |
| 1 | [US-PAY-103](../stories/US-PAY-103/STORY.md) | Editable-design limit relabel (Path A) | S | — | ✅ (code) | — |
| 1 | [US-PAY-104](../stories/US-PAY-104/STORY.md) | Fix PricingPage.tsx hardcoded price-text drift | XS | — | ✅ (code) | — |

All three are order 1 — independent files, no shared dependency, safe to implement in parallel.

---

## Acceptance (Milestone Done When…)

- [x] `PLAN_CONFIG` has FREE/SOLO/PRO/TEAM/AGENCY entries with the exact prices and limits from
      [the PRD](../../../PRD/2026-08-21-pricing-relaunch.md#2-finalized-pricing-table-feasibility-checked-not-just-proposed) —
      ✅ **verified 2026-10-21, exact match on every figure.** PRD rows 46-49 against
      `shared/schema.ts`: Solo ₹5,499 / 50 / 10 · Pro ₹10,999 / 100 / 25 · Team ₹21,999 / 200 / 60 ·
      Agency ₹43,999 / 400 / 150. FREE is 0 / 3. No drift between the PRD and the code.
- [x] BROKERAGE is not silently renamed to AGENCY — both exist until a real migration decision is
      made for any existing BROKERAGE subscriber —
      ✅ **verified 2026-10-21.** Both tiers are present and distinct in `PLAN_CONFIG`:
      BROKERAGE ₹24,999 / 1,000 / 100 and AGENCY ₹43,999 / 400 / 150. Different prices, different
      allowances — neither is an alias of the other.
- [ ] Editable-design allowance (10/25/60/150 per tier) displays correctly without changing the
      live `US-LAUNCH-015` gating behavior
- [x] No pricing string on `PricingPage.tsx` is independent of `PLAN_CONFIG` —
      ✅ **verified 2026-10-21: zero hardcoded ₹ literals** in the file. Every displayed price is
      derived, so changing `PLAN_CONFIG` changes the page and nothing can silently diverge.
- [ ] All stories above have status ✅ Done
- [ ] Verification gates pass (Gate 1 mandatory)

---

## Notes / Blockers

- US-PAY-102 is the single dependency every other story in this epic (all 3 remaining milestones)
  ultimately reads from — get this one right first.
- Does not require any Razorpay dashboard changes yet — that's M-PAY-03.

---

*Milestone created: 2026-08-21*
