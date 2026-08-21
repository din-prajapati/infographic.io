---
title: Story Card — US-PAY-107
type: story
tags: [orion, pay, pricing, billing]
updated: 2026-08-21
---

# Story Card — US-PAY-107

> **Status:** 🔲 Not Started
> **Feature:** F-PAY-02 — Discount & Campaign Architecture
> **Epic:** [EPIC-PAY-05](../../EPIC.md)
> **Milestone:** [M-PAY-02-discount-architecture](../../milestones/M-PAY-02-discount-architecture.md)
> **Linear:** LIN-XXX
> **Size:** S
> **Created:** 2026-08-21 | **Closed:** —

---

## Story

*As* a customer choosing annual billing
*I want* a standing, always-on annual price equal to 10× the monthly price (2 months free), matching
how Claude/Cursor present annual SaaS pricing
*So that* I get a real, permanent discount for committing to a year — separate from any time-boxed
promotional campaign, and correct after this epic replaces the current, different, incorrect formula

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** For every paid tier, `annualPrice = monthlyPrice × 10` exactly (e.g.
      SOLO: `549900 × 10 = 5499000` paise = ₹54,990), replacing the current
      `PricingPage.tsx:176-182` formula (`monthly × 12 × 0.85`), which produces a different number.
- [ ] **AC2 [error-path]:** If a new tier is added to `PLAN_CONFIG` without an explicit annual price
      override, the ×10 formula applies by default — no tier can silently end up unpriced for annual
      billing.
- [ ] **AC3 [security]:** N/A — pure pricing-formula story, no data flow change. Mark explicitly
      `N/A` per harden convention.
- [ ] **AC4 [currency-edge]:** The ×10 multiplication is done in integer paise (`monthlyPricePaise *
      10`), never floating-point rupees, and never rounds — the result is always an exact integer by
      construction (any integer × 10 is exact).

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
| TC-PAY-107-01 | Unit | P0 | Given SOLO monthly price 549900, when getAnnualPrice() is called, then it returns 5499000 | 🔲 | |
| TC-PAY-107-02 | Unit | P0 | Given every PLAN_CONFIG paid tier, when annual price is computed, then it equals exactly monthly×10 for all | 🔲 | |
| TC-PAY-107-03 | Manual | P1 | Given PricingPage.tsx annual toggle, when checked on staging, then displayed annual prices match ×10, not ×12×0.85 | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes
- [ ] Gate 2 passes (frontend)
- [ ] Manual flow verified
- [ ] PR merged
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

## Implementation Update (log)

---

*Story created: 2026-08-21*
