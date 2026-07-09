# PR Task List — US-LAUNCH-008

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `test/launch-us-launch-008-metering-guard`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** test + docs

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — file list + ordered tasks + exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded

---

## PR Scope Summary

**One-liner:** Pin metering policy (1 generation = 1 credit; costUsd = true spend) with tests + docs
```
test(ai): metering policy guard — US-LAUNCH-008
```

---

## Task Breakdown

### T1 — Metering policy unit tests
**File:** `api/tests/ai/metering-policy.spec.ts` (new)
**AC(s) covered:** AC2, AC3, AC4
**Changes:** *(fill during implementation session)*

### T2 — Policy documentation
**Files:** `docs/agile/PROJECT_CONTEXT.md`, `CLAUDE.md`
**AC(s) covered:** AC1
**Changes:** *(fill during implementation session)*

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/tests/ai/metering-policy.spec.ts` | T1 | AC2–AC4 | mock Prisma, no DB |
| `PROJECT_CONTEXT.md`, `CLAUDE.md` | T2 | AC1 | docs only |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/ai/metering-policy.spec.ts --reporter=verbose
```

---

## Task Checklist

- [ ] T1 — tests
- [ ] T2 — docs
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT change production metering logic — this story pins current behavior as policy
- Do NOT zero/average costUsd to "match" credits — the divergence is the point (margin analytics)
- Do NOT touch the usage dashboard or plan limits

---

*Tasks created: 2026-07-07*
