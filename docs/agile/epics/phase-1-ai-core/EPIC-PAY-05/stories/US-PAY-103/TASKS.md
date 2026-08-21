---
title: PR Task List — US-PAY-103
type: template
tags: [orion, template]
updated: 2026-08-21
---

# PR Task List — US-PAY-103

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/pay/m-01-pricing-relaunch`
> **PR:** #_____
> **Linear:** LIN-XXX

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — T1..T3 with exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded

---

## PR Scope Summary

**One-liner:** Add a display-only editable-usage-remaining count, sourced from real US-LAUNCH-015 metering.

```
feat(pay): display real editable-design remaining count (Path A relabel) — US-PAY-103
```

---

## Task Breakdown

### T1 — getEditableUsageQuota() service method
- **File:** `api/src/modules/infographics/services/usage-limit.service.ts`
- **Type:** `feat`
- **AC(s) covered:** AC1, AC2, AC3, AC4
- **Changes:**
  - New method: counts this-cycle credit-charged editable composes (query `UsageRecord` where the
    charge originated from `isExtraCompose`), subtracts from `PLAN_CONFIG[tier].editableLimit`
  - FREE tier: return 0 if `hasUsedEditableTrial()` is true, else `1`
  - Uses `getEffectiveTier()` so a mid-cycle plan change reflects immediately (no caching)

**Commit:**
```bash
git add api/src/modules/infographics/services/usage-limit.service.ts
git commit -m "feat(pay): add getEditableUsageQuota() — US-PAY-103"
```

---

### T2 — Wire into existing usage-remaining UI component
- **File:** `client/src/components/*` (the existing AI-design-remaining display)
- **Type:** `feat`
- **AC(s) covered:** AC1
- **Changes:**
  - Add editable-remaining alongside the existing AI-design-remaining count
  - No new component if an existing usage-display component can be extended

**Commit:**
```bash
git add client/src/components/
git commit -m "feat(pay): show editable-design remaining count in usage UI — US-PAY-103"
```

---

### T3 — Unit tests
- **File:** `api/tests/infographics/usage-limit.service.spec.ts` (extend existing)
- **Type:** `test`
- **AC(s) covered:** AC1, AC2, AC3
- **Changes:**
  - Cover TC-PAY-103-01/02/03 from STORY.md

**Commit:**
```bash
git add api/tests/infographics/usage-limit.service.spec.ts
git commit -m "test(pay): cover editable-usage-quota display logic — US-PAY-103"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `usage-limit.service.ts` | T1 | AC1-4 | new method, no gating change |
| `client/src/components/*` | T2 | AC1 | extend existing |
| `usage-limit.service.spec.ts` | T3 | AC1-3 | |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
```

---

## Task Checklist

- [ ] T1 — getEditableUsageQuota() (file: `usage-limit.service.ts`, type: `feat`)
- [ ] T2 — wire into usage UI (file: `client/src/components/*`, type: `feat`)
- [ ] T3 — unit tests (file: `usage-limit.service.spec.ts`, type: `test`)
- [ ] Gate 1 passes ✅
- [ ] Gate 4 passes ✅
- [ ] Manual test verified ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs ticked off ✅
- [ ] EPIC.md "Implementation Update" log appended ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT touch `generations.service.ts`'s gating logic (`isExtraCompose`, `hasUsedEditableTrial`,
  the 402 exception) — this story is read-only display, not a behavior change.
- Do NOT build a second, separate editable-credit counter — reuse the real metering data that
  already exists.

---

*Tasks created: 2026-08-21*
