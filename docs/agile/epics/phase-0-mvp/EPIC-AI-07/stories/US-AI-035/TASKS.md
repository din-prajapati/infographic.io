# PR Task List — US-AI-035

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-035-progress-fallback-resync`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — file list + ordered tasks + exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded
- [ ] **Dependency** — US-AI-034 merged (root cause fixed) before this ships as the *only* fix relied on

---

## PR Scope Summary

**One-liner:** Bounded REST fallback re-sync when generation progress socket events stall
```
feat(ai): client-side progress fallback re-sync — US-AI-035
```

---

## Task Breakdown

### T1 — Stall detection + fallback REST check
**File:** `client/src/hooks/useGenerationWebSocket.ts`
**AC(s) covered:** AC1, AC2, AC3, AC4
**Changes:** *(fill during implementation session)*

### T2 — Unit tests
**File:** `client/src/hooks/__tests__/useGenerationWebSocket.spec.ts` (new, TBC exact path — match existing test file conventions in the repo)
**AC(s) covered:** AC1, AC2, AC3
**Changes:** *(fill during implementation session)*

### T3 — Regression check
**File:** `e2e/us-design-003-generation-ux.spec.ts` (verify only)
**AC(s) covered:** AC5
**Changes:** confirm passes unmodified; do not edit unless a genuine timing conflict is found

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `client/src/hooks/useGenerationWebSocket.ts` | T1 | AC1–AC4 | additive fallback, not a replacement |
| new unit test file | T2 | AC1–AC3 | mock-based, no real socket/network |
| `e2e/us-design-003-generation-ux.spec.ts` | T3 | AC5 | verify only |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
npx playwright test e2e/us-design-003-generation-ux.spec.ts   # AC5
# Manual: localhost:5000, generate normally, confirm no extra status polls in Network tab (AC4/TC-AI-035-05)
```

---

## Task Checklist

- [ ] T1 — fallback implemented
- [ ] T2 — unit tests
- [ ] T3 — regression check
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT let the fallback poll indefinitely — AC3's 8-attempt/2-minute bound is not optional
- Do NOT build a second, separate results-rendering path for the fallback — it must reuse the exact same completion handler the socket path uses (AC2)
- Do NOT treat this story as a substitute for US-AI-034 — ship both, in order

---

*Tasks created: 2026-07-09*
