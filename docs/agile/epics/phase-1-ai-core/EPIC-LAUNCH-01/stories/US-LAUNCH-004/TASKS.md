# PR Task List — US-LAUNCH-004

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/launch-us-launch-004-beta-mode`
> **PR:** [#18](https://github.com/din-prajapati/infographic.io/pull/18)
> **Linear:** LIN-XXX
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [x] **Brain** — STORY.md filled
- [x] **Muscle** — file list + ordered tasks + exact test commands
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [x] **Env** — [ENV.yaml](../../ENV.yaml) loaded (BETA_MODE, VITE_BETA_MODE)

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
**Changes:** Added `isBetaMode = import.meta.env.VITE_BETA_MODE === 'true'`; green "Free during beta" banner when true; paid-tier CTA buttons replaced with disabled "Available after beta" state; FREE tier unaffected.

### T2 — Backend 403 beta guard
**File:** `api/src/modules/payments/controllers/payments.controller.ts`
**AC(s) covered:** AC2, AC4
**Changes:** Added `ForbiddenException` import; guard check `process.env.BETA_MODE === 'true'` at top of `createSubscription()` — throws 403 `{ code: 'BETA_MODE_ACTIVE' }` before any service call.

### T3 — Disclaimer on generation result surface
**File:** `client/src/components/ai-chat/ResultsVariations.tsx`
**AC(s) covered:** AC3
**Changes:** Added disclaimer paragraph after "Regenerate all" button: "Imagery may include AI-generated visuals. Verify all details before publishing to represent a real listing." No vendor names.

### T4 — Unit test + .env.example
**Files:** `api/tests/payments/beta-guard.spec.ts` (new), `.env.example`
**AC(s) covered:** AC5
**Changes:** 5 tests covering 403 throw (BETA_MODE=true), response code assertion, service bypass, and AC4 passthrough for unset/false. `.env.example` documents BETA_MODE + VITE_BETA_MODE with inline comment.

### T5 — test-story hardening: AC3 fix + expanded coverage (added post-implementation)
**Files:** `client/src/components/ai-chat/MessageBubble.tsx`, `api/tests/payments/beta-guard.spec.ts` (+4 tests), `e2e/us-launch-004-beta-mode.spec.ts` (new)
**AC(s) covered:** AC3 (fix), AC1/AC2/AC4 (E2E + additional unit coverage)
**Changes:** `/test-story` E2E coverage found AC3 did not hold — the disclaimer in `ResultsVariations.tsx` was unreachable once a conversation starts (`hasActiveConversation=true` switches to `MessageBubble.tsx`, which had no disclaimer). Fixed by adding the same disclaimer paragraph to `MessageBubble.tsx`. Also added 4 unit tests (HTTP 403 status, non-empty message, and two tests documenting that the `BETA_MODE` guard is case-sensitive — `BETA_MODE=TRUE`/`' true'` silently bypass it) and a 6-test Playwright spec covering pricing-page beta gating and the disclaimer. Verified against both a beta-on and a beta-off local server.

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

- [x] T1 — pricing beta state
- [x] T2 — 403 guard
- [x] T3 — disclaimer
- [x] T4 — test + env example
- [x] T5 — test-story hardening: AC3 fix + expanded coverage
- [x] `npm run check` passes ✅
- [x] `npm run test:unit` passes ✅
- [x] Manual test recorded ✅ (E2E runs against `localhost:5000`, beta-on and beta-off)
- [x] PR opened with story card as description ✅
- [x] STORY.md ACs updated ✅

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
