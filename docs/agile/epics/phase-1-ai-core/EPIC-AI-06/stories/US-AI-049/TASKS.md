# PR Task List — US-AI-049

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai/us-ai-049-font-mapping`
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
feat(editor): map extracted font identifiers to real fonts on the editable canvas — US-AI-049
```

---

## Task Breakdown

### T1 — fontMap.ts mapper + spec ✅
**Files:** `client/src/lib/fontMap.ts` (new), `client/src/lib/__tests__/fontMap.spec.ts` (new)
**AC(s):** AC1, AC2

### T2 — Apply in loadComposedDesignToCanvas + font loading in shell ✅
**Files:** `client/src/lib/canvasState.ts`, `client/index.html` (or `index.css`), `api/tests/canvas/canvasState.helpers.spec.ts` (update)
**AC(s):** AC3, AC4

### T3 — Live harness verification + screenshot ⏸ (deferred — PROBE_TOKEN not available in CI/worktree)
**Files:** none (run `scripts/e2e-editable-verify.mjs`); store screenshot in this story dir
**AC(s):** AC5

---

## File-to-Task Mapping

| File | Task(s) |
|------|---------|
| `client/src/lib/fontMap.ts` + spec | T1 |
| `client/src/lib/canvasState.ts` | T2 |
| `client/index.html` / `index.css` | T2 |

---

## Test Commands

```bash
npm run check
cd client && npx vitest run src/lib/__tests__/fontMap.spec.ts --reporter=verbose
npm run test:unit
```

---

## Anti-patterns (story-specific)

- Do NOT ship raw `.ttf` strings into TextElement.fontFamily — the whole point is removing them.
- Do NOT fetch fonts from the provider CDN at runtime — Google Fonts / self-hosted only.
- Do NOT "fix" wrapping by changing extracted geometry — geometry is provider truth; only typography resolution changes.
