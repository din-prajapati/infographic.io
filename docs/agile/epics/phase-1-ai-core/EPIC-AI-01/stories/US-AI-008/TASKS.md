# PR Task List — US-AI-008

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-008-pregeneration-plan`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-US-AI-008
> **Type:** feat

---

## PR Scope Summary

**One-liner:** Show a task plan message in chat before generation starts, with live step progress
```
feat(ai): show pre-generation task plan message with live step progress — US-AI-008
```

---

## Task Breakdown

### T1 — Create GenerationPlanMessage component
**File:** `client/src/components/ai-chat/GenerationPlanMessage.tsx` (new)
**AC(s) covered:** AC2, AC3
**Changes:**
- Props: `steps: string[]`, `activeStep: number`, `completedSteps: number[]`
- Render steps as a numbered list with active/completed indicators
- Use design tokens for styling (no hardcoded colors)

**Commit:**
```bash
git add client/src/components/ai-chat/GenerationPlanMessage.tsx
git commit -m "feat(ai): create GenerationPlanMessage component — US-AI-008"
```

### T2 — Inject plan message on intent=ready
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
**AC(s) covered:** AC1
**Changes:**
- After receiving `intent = 'ready'` from ConversationAiService, insert a `{ type: 'task-plan', steps: [...] }` message into local messages state
- Then proceed with generation call

**Commit:**
```bash
git add client/src/components/ai-chat/AIChatBox.tsx
git commit -m "feat(ai): inject task plan message before generation on intent=ready — US-AI-008"
```

### T3 — Map Socket.io progress events to step updates
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
**AC(s) covered:** AC4
**Changes:**
- Subscribe to generation:progress events from useGenerationWebSocket
- Map event types to step index updates: `extracting→1`, `generating→2`, `rendering→3`, `complete→all`
- Update activeStep state which flows to GenerationPlanMessage props

**Commit:**
```bash
git add client/src/components/ai-chat/AIChatBox.tsx
git commit -m "feat(ai): map Socket.io progress events to task plan step indicators — US-AI-008"
```

---

## Exact Test Commands

```bash
# 1. TypeScript check
npm run check

# 2. Unit tests
npm run test:unit

# 3. Manual flow
# Provide full property details in chat
# Verify: task plan appears BEFORE image loads
# Verify: step indicators update during generation (not all at once after)
```

---

## Task Checklist

- [ ] T1 — Create GenerationPlanMessage component
- [ ] T2 — Inject plan message on intent=ready
- [ ] T3 — Map Socket.io progress to step updates
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual: plan message appears before image, steps update live ✅
- [ ] PR opened ✅
- [ ] STORY.md ACs updated ✅

---

*Tasks created: 2026-04-28*
