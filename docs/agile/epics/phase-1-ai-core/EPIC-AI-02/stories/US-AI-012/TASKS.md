# PR Task List — US-AI-012

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-012-quality-tiers`
> **PR:** #_____ (fill when opened)
> **Type:** feat

---

## PR Scope Summary

```
feat(ai): add Social/Print Quality selector with plan-tier enforcement — US-AI-012
```

---

## Task Breakdown

### T1 — Frontend: quality selector UI
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
- Add 2-pill selector: "Social" | "Print Quality"
- If plan is FREE/SOLO: Print Quality disabled + tooltip
- Default: Social

### T2 — Backend: qualityTier → model routing
**File:** `api/src/modules/ai-generation/services/image-generation.service.ts`
- Accept `qualityTier: 'social' | 'print'`
- Combine with plan tier: SOLO+social=Flash, TEAM+print=Pro, TEAM+social=Flash, SOLO+print=reject(403) or downgrade

---

## Exact Test Commands

```bash
npm run check && npm run test:unit
# Manual: toggle quality, generate, check server logs for correct model
```

---

## Task Checklist

- [ ] T1 — Quality selector UI with plan enforcement
- [ ] T2 — qualityTier → model routing in backend
- [ ] `npm run check` passes ✅
- [ ] Manual: Social=Flash, Print=Pro, FREE=Social only ✅

---

*Tasks created: 2026-04-28*
