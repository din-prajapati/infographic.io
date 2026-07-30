# PR Task List — US-AI-014

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-014-campaign-mode-ui`
> **PR:** #_____ (fill when opened)
> **Type:** feat

---

## PR Scope Summary

```
feat(ai): add Campaign Mode UI toggle with coming-soon state — US-AI-014
```

---

## Task Breakdown

### T1 — Add Campaign Mode toggle to AIChatBox.tsx
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
- Add `campaignMode` boolean state (default false)
- Render a toggle/button with label "Campaign Mode" (lightning bolt icon optional)
- On click: show tooltip/popover "Coming soon — generate a complete 4-piece marketing set"
- Do NOT send any flag to the backend

---

## Task Checklist

- [ ] T1 — Campaign Mode toggle with coming-soon tooltip
- [ ] `npm run check` passes ✅
- [ ] Manual: toggle visible, no backend call triggered ✅

---

*Tasks created: 2026-04-28*
