# PR Task List — US-LAUNCH-004

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/launch-us-launch-004-beta-mode`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — file list + ordered tasks + exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded (BETA_MODE, VITE_BETA_MODE)

---

## PR Scope Summary

**One-liner:** Beta mode — paid checkout off (UI + 403 guard) + AI-content disclaimer
```
feat(launch): beta mode flag + AI-content disclaimer — US-LAUNCH-004
```

---

## Task Breakdown

### T1 — PricingPage beta rendering
**File:** `client/src/pages/PricingPage.tsx`
**AC(s) covered:** AC1, AC4
**Changes:** *(fill during implementation session)*

### T2 — Backend 403 beta guard
**File:** payments controller/service `(TBC)`
**AC(s) covered:** AC2, AC4
**Changes:** *(fill during implementation session)*

### T3 — Disclaimer on generation result surface
**File:** `(TBC — locate result/export component)`
**AC(s) covered:** AC3
**Changes:** *(fill during implementation session)*

### T4 — Unit test + .env.example
**Files:** `api/tests/payments/beta-guard.spec.ts` (new), `.env.example`
**AC(s) covered:** AC5
**Changes:** *(fill during implementation session)*

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `client/src/pages/PricingPage.tsx` | T1 | AC1 | |
| payments controller | T2 | AC2 | defense in depth |
| result/export component | T3 | AC3 | copy has no vendor names |
| test + `.env.example` | T4 | AC5 | |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/payments/beta-guard.spec.ts --reporter=verbose
# Manual: VITE_BETA_MODE=true npm run dev → /pricing shows beta state; generate → disclaimer visible
```

---

## Task Checklist

- [ ] T1 — pricing beta state
- [ ] T2 — 403 guard
- [ ] T3 — disclaimer
- [ ] T4 — test + env example
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

- Do NOT gate revenue on the UI alone — the backend 403 is the real gate
- Do NOT name AI vendors in the disclaimer copy (model opacity rule)
- Do NOT alter plan limits or the FREE tier flow
- Do NOT build a feature-flag abstraction — two env vars, nothing more

---

*Tasks created: 2026-07-07*
