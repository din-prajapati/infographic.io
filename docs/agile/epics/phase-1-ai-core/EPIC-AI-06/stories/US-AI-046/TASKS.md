# PR Task List — US-AI-046

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai/us-ai-046-layout-connector` (deleted post-merge, 2026-08-14)
> **PR:** — (merged directly, `b8601eb`)
> **Linear:** LIN-XXX
> **Type:** feat

> **Retroactive record.** This story was implemented and merged 2026-08-13 before this card existed. Tasks below are reconstructed from the real commit — one commit, not split by task, since it shipped as a single unit before the "one task, one commit" convention was applied retroactively. Written 2026-08-14 alongside the STORY.md backfill.

---

## Four Pillars Pre-flight (retroactively confirmed)

- [x] **Brain** — STORY.md backfilled 2026-08-14 with the real ACs the shipped code satisfies
- [x] **Muscle** — this file
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) — updated same week (US-AI-043's commit) to show background→planner(intent)→flow-renderer→canvas
- [x] **Env** — [ENV.yaml](../../ENV.yaml) — no new env vars introduced

---

## PR Scope Summary

**Actual commit:**
```
feat(editor): wire the layout engine to the editable canvas — US-AI-046
```
Commit `c256fd3`, merged to `main` via `b8601eb` (2026-08-13).

---

## What shipped (single commit, no task split)

**Files:**
- `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` — surface canonicalValues
- `api/src/modules/ai-generation/types/composed-design.types.ts` — new field
- `client/src/components/ai-chat/AIChatBox.tsx` — route Edit through connectLayout
- `client/src/lib/api.ts` — thread type through
- `client/src/lib/layout/connectLayout.ts` (new)
- `client/src/lib/layout/__tests__/connectLayout.spec.ts` (new — 11 tests)

**AC(s) covered:** AC1–AC7 (see STORY.md)

**Gate 1 at ship time:** 254 backend + 165 client passing, tsc clean.

---

## Test Commands

```bash
npm run check
cd client && npx vitest run src/lib/layout/__tests__/connectLayout.spec.ts --reporter=verbose
npm run test:unit
```

---

## Anti-patterns (story-specific, noted for the record)

- This story's own ordering decision (layout-engine leads) was revised the *same week* once the real cause of extraction's failure was found — a reminder that an architecture call made under an unverified assumption ("extraction doesn't work") should be revisited the moment the assumption is checked, not treated as settled.
- Connecting a well-tested unit (US-AI-043's engine) to a caller does not by itself prove the feature is reachable by a real user — see US-AI-047 and the 2026-08-14 AI Chat reachability fix, both needed on top of this story before the feature actually worked end to end.
