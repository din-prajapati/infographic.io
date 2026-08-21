---
title: PR Task List — US-PAY-107
type: template
tags: [orion, template]
updated: 2026-08-21
---

# PR Task List — US-PAY-107

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/pay/m-01-pricing-relaunch`
> **PR:** #_____
> **Linear:** LIN-XXX

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — T1-T2 with exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded

---

## PR Scope Summary

**One-liner:** Replace the ×12×0.85 annual formula with the correct standing ×10 discount.

```
fix(pay): standing annual discount is monthly×10, not ×12×0.85 — US-PAY-107
```

---

## Task Breakdown

### T1 — getAnnualPrice() helper
- **File:** `shared/schema.ts`
- **Type:** `feat`
- **AC(s) covered:** AC1, AC2, AC4
- **Changes:**
  - `export const ANNUAL_MULTIPLIER = 10;`
  - `export function getAnnualPrice(monthlyPricePaise: number): number { return monthlyPricePaise * ANNUAL_MULTIPLIER; }`

**Commit:**
```bash
git add shared/schema.ts
git commit -m "feat(pay): add getAnnualPrice() standing ×10 formula — US-PAY-107"
```

---

### T2 — Replace ×12×0.85 in PricingPage.tsx
- **File:** `client/src/pages/PricingPage.tsx`
- **Type:** `fix`
- **AC(s) covered:** AC1
- **Changes:**
  - Replace the `monthly * 12 * 0.85` computation at ~lines 176-182 with `getAnnualPrice(monthly)`

**Commit:**
```bash
git add client/src/pages/PricingPage.tsx
git commit -m "fix(pay): use getAnnualPrice() standing formula, remove ×12×0.85 — US-PAY-107"
```

---

### T3 — Unit tests
- **File:** `shared/__tests__/pricing-formulas.spec.ts` (new)
- **Type:** `test`
- **AC(s) covered:** AC1, AC2, AC4
- **Changes:**
  - Cover TC-PAY-107-01/02

**Commit:**
```bash
git add shared/__tests__/pricing-formulas.spec.ts
git commit -m "test(pay): cover standing annual-discount formula — US-PAY-107"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `shared/schema.ts` | T1 | AC1, AC2, AC4 | |
| `PricingPage.tsx` | T2 | AC1 | replaces old formula |
| `pricing-formulas.spec.ts` | T3 | AC1, AC2, AC4 | new file |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
```

---

## Task Checklist

- [ ] T1 — getAnnualPrice() helper (file: `shared/schema.ts`, type: `feat`)
- [ ] T2 — replace old formula (file: `PricingPage.tsx`, type: `fix`)
- [ ] T3 — unit tests (file: `pricing-formulas.spec.ts`, type: `test`)
- [ ] Gate 1 passes ✅
- [ ] Gate 2 passes ✅
- [ ] Manual test verified ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs ticked off ✅
- [ ] EPIC.md "Implementation Update" log appended ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT layer campaign-discount logic into this formula — annual and campaign discounts compose in
  `US-PAY-106`'s resolution service, not here.

---

*Tasks created: 2026-08-21*
