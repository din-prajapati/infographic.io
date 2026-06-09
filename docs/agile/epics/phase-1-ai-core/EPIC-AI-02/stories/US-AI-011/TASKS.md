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
**File:** `api/src/modules/ai-generation/services/image-generation.service.ts`
- Add format→dimensions map
- Pass correct width/height to Nano Banana API

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
