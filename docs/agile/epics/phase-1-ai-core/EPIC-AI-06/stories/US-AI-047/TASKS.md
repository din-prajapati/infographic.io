# PR Task List — US-AI-047

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai/us-ai-047-shared-rendermode` (deleted post-merge, 2026-08-14)
> **PR:** — (merged directly)
> **Linear:** LIN-XXX
> **Type:** feat

> **Retroactive record.** Implemented and merged 2026-08-13 before this card existed. Written 2026-08-14 alongside the STORY.md backfill.

---

## Four Pillars Pre-flight (retroactively confirmed)

- [x] **Brain** — STORY.md backfilled 2026-08-14
- [x] **Muscle** — this file
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd)
- [x] **Env** — no new env vars

---

## PR Scope Summary

**Actual commit:**
```
feat(editor): make editable mode reachable from Quick Generate — US-AI-047
```
Commit `362a057`, merged directly to `main` (2026-08-13).

---

## What shipped (single commit, no task split)

**Files:**
- `client/src/components/ai-chat/AIChatBox.tsx`
- `client/src/components/editor/RightSidebar.tsx`
- `client/src/hooks/useGenerationPrefs.ts` (new)
- `client/src/lib/layout/__tests__/loadVariation.spec.ts` (new)
- `client/src/lib/layout/loadVariation.ts` (new)

**AC(s) covered:** AC1–AC6 (see STORY.md)

**Gate 1 at ship time:** 254 backend + 170 client passing, 1 skipped, tsc clean.

---

## Test Commands

```bash
npm run check
cd client && npx vitest run src/lib/layout/__tests__/loadVariation.spec.ts --reporter=verbose
npm run test:unit
```

---

## Anti-patterns (story-specific, noted for the record)

- Do not re-litigate the AC6 skip by loosening the assertion to make it pass — the skip with reasoning attached is the honest state; a passing-but-wrong test would be worse.
- This story fixed *one* of three reachability gaps in the editable feature (Quick Generate). Do not assume "the toggle exists in the code" means "a real user can reach it" for any *other* surface without live-verifying that surface specifically — this exact assumption was wrong twice more in the same feature (the generation-id bug the next day, the AI Chat conversation-view bug the day after that).
