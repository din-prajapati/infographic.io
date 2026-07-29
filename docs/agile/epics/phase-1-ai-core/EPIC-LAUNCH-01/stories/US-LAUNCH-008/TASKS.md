# PR Task List — US-LAUNCH-008

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `test/launch-us-launch-008-metering-guard`
> **PR:** none — merged directly to `main` at `aaf3aef`
> **Linear:** LIN-XXX
> **Type:** test + docs

---

## Three Pillars Pre-flight (check before starting AI session)

- [x] **Brain** — STORY.md filled
- [x] **Muscle** — file list + ordered tasks + exact test commands
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [x] **Env** — [ENV.yaml](../../ENV.yaml) loaded

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
**Changes:** 6 tests covering orchestrator path (creditsUsed: 1, costUsd = actual), processor path (same), and UsageLimitService credit-based enforcement (FREE=3, error-path + happy-path). Passthrough `vi.mock('@prisma/client')` added to fix Vitest module-load ordering when AI services are imported alongside UsageLimitService.

### T2 — Policy documentation
**Files:** `docs/agile/PROJECT_CONTEXT.md`, `CLAUDE.md`
**AC(s) covered:** AC1
**Changes:** Added metering policy blockquote to Plan Tiers section of PROJECT_CONTEXT.md; added one-line policy note after the plan-tiers line in CLAUDE.md. Both state: generations = user unit, creditsUsed: 1 per generation, costUsd = true provider spend (intentionally different).

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

- [x] T1 — tests
- [x] T2 — docs
- [x] `npm run check` passes ✅
- [x] `npm run test:unit` passes ✅
- [x] ~~PR opened with story card as description~~ _(no PR — merged directly to `main` at `aaf3aef`)_
- [x] STORY.md ACs updated ✅

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
