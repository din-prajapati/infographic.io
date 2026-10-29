# PR Task List — US-AI-015

> **Story:** [STORY.md](./STORY.md) | **Branch:** `feat/ai-us-ai-015-quick-refine-chips` | **Type:** feat

```
feat(ai): add Quick Refine chips post-generation with <15s refinement — US-AI-015
```

### T1 — Create QuickEditService
**File:** `api/src/modules/ai-generation/services/quick-edit.service.ts` (new)
- Method: `refine(infographicId, originalContext, refinementInstruction)` → triggers new generation with modified prompt

### T2 — Add POST /infographics/:id/quick-refine endpoint
**File:** `api/src/modules/infographics/infographics.controller.ts`

### T3 — Render Quick Refine chips after generation
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
- After generation result arrives: show 3 hardcoded refinement chips ("More luxurious", "Darker background", "Just Sold version")
- On chip click: call quick-refine endpoint with chip text

## Checklist
- [ ] T1 QuickEditService | T2 endpoint | T3 frontend chips
- [ ] `npm run check` ✅ | `npm run test:unit` ✅ | Refinement <15s verified ✅

*Tasks created: 2026-04-28*
