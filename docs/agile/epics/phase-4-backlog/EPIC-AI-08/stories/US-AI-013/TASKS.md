# PR Task List — US-AI-013

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-013-property-quality-routing`
> **PR:** #_____ (fill when opened)
> **Type:** feat

---

## PR Scope Summary

```
feat(ai): add property type → model routing (luxury auto-upgrades to Pro) — US-AI-013
```

---

## Task Breakdown

### T1 — Implement resolveModel() function
**File:** `api/src/modules/ai-generation/services/image-generation.service.ts`
- Add `resolveModel(planTier, propertyType, qualityTier): 'nano-banana-flash' | 'nano-banana-pro'`
- Rules: FREE/SOLO → Flash, TEAM+print → Pro, TEAM+social+luxury → Pro, TEAM+social+other → Flash

---

## Exact Test Commands

```bash
npm run check && npm run test:unit
```

---

## Task Checklist

- [ ] T1 — resolveModel() with all routing rules
- [ ] `npm run check` passes ✅

---

*Tasks created: 2026-04-28*
