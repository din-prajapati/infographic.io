---
title: PR Task List — US-PAY-106
type: template
tags: [orion, template]
updated: 2026-08-21
---

# PR Task List — US-PAY-106

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

**One-liner:** Add the single price-resolution service composing base price + campaign + annual.

```
feat(pay): add getEffectivePrice() resolution service — US-PAY-106
```

---

## Task Breakdown

### T1 — pricing-resolution.service.ts
- **File:** `api/src/modules/payments/services/pricing-resolution.service.ts`
- **Type:** `feat`
- **AC(s) covered:** AC1, AC2, AC3, AC4
- **Changes:**
  - `getEffectivePrice(tier, interval): { regularPrice, effectivePrice, campaignId, badge? }`
  - Reads `PLAN_CONFIG[tier].price` as base, calls `PricingCampaignService.getActiveCampaign()` for
    the discount, applies `getAnnualPrice()` (from US-PAY-107) to the *resulting* rate when
    `interval === 'annual'` — order doesn't matter mathematically for PERCENT-type discounts
    (multiplication commutes), so implement in whichever order is simplest to write
  - Reject `FLAT`-type `tierDiscounts` entries explicitly (throw / logged error) — not supported yet,
    never silently computed as if it were `PERCENT`
  - No client-facing HTTP surface in this story — pure service, consumed directly by other backend
    code (checkout, pricing API endpoint if one exists)

**Commit:**
```bash
git add api/src/modules/payments/services/pricing-resolution.service.ts
git commit -m "feat(pay): add getEffectivePrice() price-resolution service — US-PAY-106"
```

---

### T2 — Unit tests
- **File:** `api/tests/payments/pricing-resolution.service.spec.ts` (new)
- **Type:** `test`
- **AC(s) covered:** AC1, AC2, AC3, AC4
- **Changes:**
  - Cover TC-PAY-106-01 through 05, including the FLAT-type rejection case explicitly

**Commit:**
```bash
git add api/tests/payments/pricing-resolution.service.spec.ts
git commit -m "test(pay): cover price-resolution correctness and FLAT-type rejection — US-PAY-106"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `pricing-resolution.service.ts` | T1 | AC1-4 | new file, depends on US-PAY-102/105/107 |
| `pricing-resolution.service.spec.ts` | T2 | AC1-4 | new file |

---

## Exact Test Commands

```bash
npm run check
cd api && npx vitest run tests/payments/pricing-resolution.service.spec.ts --reporter=verbose
```

---

## Task Checklist

- [x] T1 — resolution service (file: `pricing-resolution.service.ts`, type: `feat`) — commit `ccbbe37`
- [x] T2 — unit tests (file: `pricing-resolution.service.spec.ts`, type: `test`) — commit `4c2147f`
- [x] Gate 1 passes ✅ — `npm run check` (0 errors), 403/403 backend tests pass
- [ ] Gate 4 passes — not separately run this pass
- [ ] Manual test verified — pending
- [ ] PR opened with story card as description — pending (milestone PR)
- [x] STORY.md ACs ticked off ✅
- [x] EPIC.md "Implementation Update" log appended ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT let checkout (`US-PAY-110`) recompute price independently — it must call this service.
- Do NOT silently accept a `FLAT`-type `tierDiscounts` entry and guess a composition order for it —
  reject it explicitly. `PERCENT` composition order is a non-issue (math, not a product decision).

---

*Tasks created: 2026-08-21*
