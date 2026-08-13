# PR Task List — US-AI-050

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai/us-ai-050-editable-latency-affordance`
> **PR:** #_____ · **Linear:** LIN-XXX · **Type:** feat

---

## Four Pillars Pre-flight

- [x] **Brain** — STORY.md filled
- [x] **Muscle** — this file has tasks + test commands
- [x] **Map** — ARCHITECTURE.mmd current
- [x] **Env** — ENV.yaml loaded

---

## PR Scope Summary

```
feat(editor): show elapsed-time progress during the editable compose wait — US-AI-050
```

---

## Task Breakdown

### [x] T1 — useComposeProgress hook
**Files:** `client/src/hooks/useComposeProgress.ts` (new), `client/src/hooks/__tests__/useComposeProgress.spec.ts` (new)
**AC(s):** AC1, AC2

### [x] T2 — Wire into RightSidebar + AIChatBox (shared, not duplicated)
**Files:** `client/src/components/editor/RightSidebar.tsx`, `client/src/components/ai-chat/AIChatBox.tsx`
**AC(s):** AC3, AC5

### [x] T3 — Client request timeout ≥ server's 90s
**Files:** `client/src/lib/api.ts`, `client/src/lib/__tests__/api.spec.ts` (update or new)
**AC(s):** AC4

### [ ] T4 — Live verification on both surfaces
**Files:** none (manual + harness run)
**AC(s):** TC-AI-050-03, -04, -05

---

## File-to-Task Mapping

| File | Task(s) |
|------|---------|
| `useComposeProgress.ts` + spec | T1 |
| `RightSidebar.tsx` | T2 |
| `AIChatBox.tsx` | T2 |
| `api.ts` | T3 |

---

## Test Commands

```bash
npm run check
cd client && npx vitest run --reporter=verbose
```

---

## Anti-patterns (story-specific)

- Do NOT implement the timer twice (once per surface) — exactly the US-AI-047 lesson; one hook, both callers.
- Do NOT let the client timeout be shorter than the server's LAYERIZE_TIMEOUT_MS (90s) — that reintroduces a false-failure UX bug.
- Do NOT block the flat-load path on this hook — flat stays instant and unaffected.
