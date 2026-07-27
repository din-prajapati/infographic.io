# PR Task List — US-AI-011

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-011-format-selector`
> **PR:** #_____ (fill when opened)
> **Type:** feat

---

## PR Scope Summary

```
feat(ai): add output format selector (Instagram/Facebook/Story/Print) — US-AI-011
```

---

## Task Breakdown

### T1 — Frontend: format selector component
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
- Add tab pill or select with 4 options; default = Instagram Square
- Store selected format in local state

### T2 — Backend: accept outputFormat in generation request
**Files** (corrected 2026-07-27 — `image-generation.service.ts` no longer exists; see ⚠️ overlap note in STORY.md before starting this task):
- `api/src/modules/infographics/dto/generate-from-chat.dto.ts` — add `outputFormat` (or extend the existing `orientation` field, pending the overlap decision)
- `api/src/config/image-generation.config.ts` — add format→dimensions map, following the existing `ORIENTATION_TO_IDEOGRAM_ASPECT` pattern
- `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` + `ideogram.service.ts` — thread the resolved dimensions through the same path `orientation` already uses

### T3 — Persist format per conversation
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
- Save format selection to conversation state in backend (or sessionStorage if backend doesn't support it yet)

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
# Manual: select each format, generate, inspect image dimensions
```

---

## Task Checklist

- [ ] T1 — Format selector UI
- [ ] T2 — Backend format→dimensions mapping
- [ ] T3 — Persist format selection
- [ ] `npm run check` passes ✅
- [ ] Manual: Instagram=1:1, Print=4:3 verified ✅

---

*Tasks created: 2026-04-28*
