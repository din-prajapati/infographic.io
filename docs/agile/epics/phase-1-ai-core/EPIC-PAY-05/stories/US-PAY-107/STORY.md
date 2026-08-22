---
title: Story Card — US-PAY-107
type: story
tags: [orion, pay, pricing, billing]
updated: 2026-08-21
---

# Story Card — US-PAY-107

> **Status:** ✅ Done (code) — manual/PR still open, see TASKS.md
> **Feature:** F-PAY-02 — Discount & Campaign Architecture
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-02-discount-architecture](../../milestones/M-PAY-02-discount-architecture.md)
> **Linear:** LIN-XXX
> **Size:** S
> **Created:** 2026-08-21 | **Closed:** 2026-08-22 (code) — full DoD pending

---

## Story

*As* a customer choosing annual billing
*I want* a standing, always-on annual price equal to 10× the monthly price (2 months free), matching
how Claude/Cursor present annual SaaS pricing
*So that* I get a real, permanent discount for committing to a year — separate from any time-boxed
promotional campaign, and correct after this epic replaces the current, different, incorrect formula

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** For every paid tier, `annualPrice = monthlyPrice × 10` exactly (e.g.
      SOLO: `2999 × 10 = 29990` **rupees**, ₹29,990/yr), replacing the current
      `PricingPage.tsx:176-182` formula (`monthly × 12 × 0.85`), which produces a different number.
      **Corrected 2026-08-22**: this AC originally said paise (`549900 × 10 = 5499000`) — same
      wrong-unit bug found in `US-PAY-102` (see that story's log). Every `PLAN_CONFIG` tier stores
      integer rupees, not paise. Verified — `client/src/lib/__tests__/pricingFormulas.spec.ts`.
- [x] **AC2 [error-path]:** If a new tier is added to `PLAN_CONFIG` without an explicit annual price
      override, the ×10 formula applies by default — no tier can silently end up unpriced for annual
      billing. Verified — test asserts this across every current paid tier including `PRO`/`AGENCY`,
      which didn't exist when this story was written.
- [x] **AC3 [security]:** N/A — pure pricing-formula story, no data flow change. Marked `N/A`
      explicitly per harden convention.
- [x] **AC4 [currency-edge]:** The ×10 multiplication is done in integer **rupees**
      (`monthlyPrice * 10` — corrected from "paise", see AC1), never floating-point, and never
      rounds — the result is always an exact integer by construction (any integer × 10 is exact).
      Verified by a unit test asserting `Number.isInteger()` on every tier's annual price.

---

## Out of Scope

- Composition with an active promotional campaign (`US-PAY-106` — this story defines the standing
  annual multiplier only, the resolution service applies both).
- Razorpay annual Plan ID creation (`US-PAY-109`).
- Founding annual pricing (explicitly deferred per the original PRD — "introduced separately").

---

## Engineering / PR

- **Branch:** `feat/pay/m-01-pricing-relaunch`
- **PR:** #_____ (milestone PR)
- **Primary files touched:**
  - `shared/schema.ts` or a new `shared/pricing-formulas.ts` — the `ANNUAL_MULTIPLIER = 10` constant
    and a `getAnnualPrice(monthlyPricePaise)` helper
  - `client/src/pages/PricingPage.tsx` — replace `× 12 × 0.85` with the new helper

---

## AI Implementation Prompt

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-PAY-107 — Standing annual-discount formula (×10)

As a customer choosing annual billing, I want a standing 10×-monthly annual price (2 months free),
matching Claude/Cursor-style SaaS annual pricing, replacing the current, different, incorrect ×12×0.85
formula.

Acceptance Criteria:
  AC1 [happy-path]: annualPrice = monthlyPrice × 10 exactly for every paid tier, replacing
    PricingPage.tsx's current ×12×0.85 formula.
  AC2 [error-path]: a new tier without an explicit override still gets the ×10 default — never
    silently unpriced.
  AC3 [security]: N/A — pure formula story.
  AC4 [currency-edge]: multiplication is integer paise, exact, no rounding.

Out of Scope:
  Composition with a promotional campaign (that's US-PAY-106). Razorpay annual Plan ID creation
  (US-PAY-109). Founding annual pricing (deferred).

Primary files to touch (do NOT touch other files):
  shared/schema.ts (or new shared/pricing-formulas.ts)
  client/src/pages/PricingPage.tsx

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
| TC-PAY-107-01 | Unit | P0 | Given SOLO monthly price 2999 (rupees, corrected from paise), when getAnnualPrice() is called, then it returns 29990 | ✅ | |
| TC-PAY-107-02 | Unit | P0 | Given every PLAN_CONFIG paid tier, when annual price is computed, then it equals exactly monthly×10 for all | ✅ | |
| TC-PAY-107-03 | Manual | P1 | Given PricingPage.tsx annual toggle, when checked on staging, then displayed annual prices match ×10, not ×12×0.85 | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded (TC-03 manual, still pending)
- [x] Gate 1 passes
- [ ] Gate 2 passes (frontend) — not separately run this pass
- [ ] Manual flow verified (TC-PAY-107-03)
- [ ] PR merged
- [ ] No console errors for the changed flow
- [x] [TASKS.md](./TASKS.md) task list fully checked (except manual/PR, tracked open)
- [x] STORY.md status updated to ✅ Done (code)

---

## Implementation Update (log)

**2026-08-22.** T1 (`getAnnualPrice()`/`ANNUAL_MULTIPLIER` in `shared/schema.ts`) and T2
(`PricingPage.tsx` wired to it) were already committed as side effects of finishing `US-PAY-102`
and `US-PAY-104` — found already correct while verifying those stories, not redone. Added T3 (the
missing dedicated test) and corrected this story's own AC1/AC4 text, which had the exact same
wrong "paise" unit assumption as `US-PAY-102`'s original text (see that story's log — every
`PLAN_CONFIG` price is integer rupees). Commit `bac046d`. Gate 1: `npm run check` (0 errors),
`client/src/lib/__tests__/pricingFormulas.spec.ts` (4/4 pass).

---

*Story created: 2026-08-21*
