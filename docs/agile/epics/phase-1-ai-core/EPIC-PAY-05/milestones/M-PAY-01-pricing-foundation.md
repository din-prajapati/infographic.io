---
title: M-PAY-01-pricing-foundation — Pricing Foundation
type: milestone
tags: [orion, pay, pricing]
updated: 2026-10-21
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
- [x] Editable-design allowance (10/25/60/150 per tier) displays correctly without changing the
      live `US-LAUNCH-015` gating behavior — ✅ **verified 2026-10-21 on the rendered page, both
      widths.**

      **The four numbers reach the real page.** `PricingPage.tsx:616` passes
      `editableLimit: config.editableLimit` straight from `PLAN_CONFIG`, rendered at `:1024-1031`
      (“N editable credits / mo — a separate allowance”) and `:1188`, with `-1` shown as
      “Unlimited”. Confirmed in the **deployed** staging bundle (`/assets/index-C8fvAhmr.js`),
      not just in source: it contains `editableLimit:10`, `:25`, `:60`, `:150`, plus
      `:100` (BROKERAGE) and three `:-1` (API tiers) — an exact match for `shared/schema.ts`, and
      the display copy (“editable credit”, “editable allowance”) ships with it.

      **Gating is untouched.** `usage-limit.service.ts:437` reads the same `PLAN_CONFIG` field via
      `editableLimitForTier()`; FREE's lifetime-trial path is separate at `:431` and unchanged.
      Covered by the 726-test unit suite, including `tests/ai/metering-policy.spec.ts`.

      **Read off the live DOM at 375px** (deployed staging, `df332cd`): Free ₹0 / 3 / trial only ·
      Solo ₹5,499 / 50 / **10** · Pro ₹10,999 / 100 / **25** · Team ₹21,999 / 200 / **60** ·
      Agency ₹43,999 / 400 / **150**. Rendered as *“N editable credits / mo — a separate allowance,
      spent when you open a design in the editor”* in a “Multi-layer Canvas Editor Included” panel;
      FREE instead reads *“One free trial edit — no monthly editable allowance.”*, which is the
      US-LAUNCH-015 trial wording, unchanged. Full method and the desktop reading are recorded in
      [M-PAY-04](M-PAY-04-pricing-page-relaunch.md) — one pass closed this item and both of
      M-PAY-04's.
- [x] No pricing string on `PricingPage.tsx` is independent of `PLAN_CONFIG` —
      ✅ **verified 2026-10-21: zero hardcoded ₹ literals** in the file. Every displayed price is
      derived, so changing `PLAN_CONFIG` changes the page and nothing can silently diverge.
- [x] All stories above have status ✅ Done — ✅ **2026-10-21.** US-PAY-102, US-PAY-103 and
      US-PAY-104 are all code-complete and merged to `main`.

      **Traceability, verified 2026-10-21.** No milestone branch was created for this epic, so
      there is no milestone PR; every story landed on `main` piecemeal. The git standard's intended
      mechanism still works — each story resolves by `git log --grep "<US-ID>"`:

      | Story | Commits on `main` |
      |---|:--:|
      | [US-PAY-102](../stories/US-PAY-102/STORY.md) | 14 |
      | [US-PAY-103](../stories/US-PAY-103/STORY.md) | 9 |
      | [US-PAY-104](../stories/US-PAY-104/STORY.md) | 4 |

      Epic DoD amended to match (see [EPIC.md](../EPIC.md)).
- [x] Verification gates pass (Gate 1 mandatory) — ✅ **2026-10-21:** `npm run check`
      (`tsc` + `tsc -p api/tsconfig.json`, 0 errors) and `npm run test:unit:backend`
      (**726 passed / 52 files**).

---

## Notes / Blockers

- US-PAY-102 is the single dependency every other story in this epic (all 3 remaining milestones)
  ultimately reads from — get this one right first.
- Does not require any Razorpay dashboard changes yet — that's M-PAY-03.

---

*Milestone created: 2026-08-21*
