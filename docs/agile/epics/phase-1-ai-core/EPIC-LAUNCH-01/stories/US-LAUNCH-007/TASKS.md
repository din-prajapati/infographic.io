# PR Task List — US-LAUNCH-007

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/launch-us-launch-007-brokerage-gate`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** fix

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — file list + ordered tasks + exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded

---

## PR Scope Summary

**One-liner:** Gate tiers without configured plan IDs (BROKERAGE) behind Contact-us; 400 not 500 server-side
```
fix(payments): plan-availability gate for unconfigured tiers — US-LAUNCH-007 (PT-06)
```

---

## Task Breakdown

### T1 — Pricing page availability gate
**File:** `client/src/pages/PricingPage.tsx`
**AC(s) covered:** AC1, AC2
**Changes:** *(fill during implementation session — inspect how plan data reaches the page first)*

### T2 — Backend 400 PLAN_NOT_AVAILABLE
**File:** `api/src/modules/payments/services/payments.service.ts` `(TBC)`
**AC(s) covered:** AC3
**Changes:** *(fill during implementation session)*

### T3 — Unit test + PT-06 close-out
**Files:** `api/tests/payments/plan-availability.spec.ts` (new), `docs/agile/PROJECT_CONTEXT.md`
**AC(s) covered:** AC4
**Changes:** *(fill during implementation session)*

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `client/src/pages/PricingPage.tsx` | T1 | AC1, AC2 | availability-driven, not tier-hardcoded |
| `payments.service.ts` | T2 | AC3 | |
| test + PROJECT_CONTEXT.md | T3 | AC4 | PT-06 → resolved |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/payments/plan-availability.spec.ts --reporter=verbose
# Manual: /pricing → BROKERAGE shows Contact us; SOLO/TEAM checkout unchanged
```

---

## Task Checklist

- [ ] T1 — pricing gate
- [ ] T2 — 400 path
- [ ] T3 — test + PT-06 close-out
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual test recorded ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT hardcode `tier === 'BROKERAGE'` — gate on plan-ID availability
- Do NOT create or reference RazorPay BROKERAGE plan IDs anywhere
- Do NOT restructure PricingPage rendering beyond the CTA swap (US-LAUNCH-004 also touches this file — coordinate merge order)

---

*Tasks created: 2026-07-07*
