# PR Task List — US-AI-006

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `fix/ai-us-ai-006-conversations-backend`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-US-AI-006
> **Type:** fix

---

## PR Scope Summary

**One-liner:** Replace localStorage conversation storage with backend API calls using React Query
```
fix(ai): connect conversations to backend API, remove localStorage — US-AI-006
```

---

## Task Breakdown

### T1 — Audit existing localStorage usage in AIChatBox.tsx
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
**AC(s) covered:** AC1 (prep)
**Changes:**
- Read full file (480 lines)
- List all localStorage calls: `getItem`, `setItem`, `removeItem` for conversation data
- Identify which React Query hooks / conversationsApi methods to replace them with

### T2 — Replace load-on-mount with React Query
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
**AC(s) covered:** AC1, AC2
**Changes:**
- Replace `localStorage.getItem('conversations')` on mount with `useQuery(['conversations'], conversationsApi.list)`
- Replace per-conversation message loading with `useQuery(['messages', conversationId], () => conversationsApi.getMessages(conversationId))`

**Commit:**
```bash
git add client/src/components/ai-chat/AIChatBox.tsx
git commit -m "fix(ai): load conversations and messages from backend API — US-AI-006"
```

### T3 — Replace create/save with mutations
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
**AC(s) covered:** AC1, AC3, AC4
**Changes:**
- Replace `localStorage.setItem` (new conversation) with `useMutation(conversationsApi.create)` + invalidate `['conversations']`
- Replace message save with `conversationsApi.addMessage(conversationId, message)`

**Commit:**
```bash
git add client/src/components/ai-chat/AIChatBox.tsx
git commit -m "fix(ai): create/save conversations via backend mutations — US-AI-006"
```

### T4 — Replace delete with mutation
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
**AC(s) covered:** AC1, AC4
**Changes:**
- Replace `localStorage.removeItem` (delete conversation) with `useMutation(conversationsApi.delete)` + invalidate `['conversations']`

**Commit:**
```bash
git add client/src/components/ai-chat/AIChatBox.tsx
git commit -m "fix(ai): delete conversations via backend mutation — US-AI-006"
```

### T5 — Add any missing conversationsApi methods
**File:** `client/src/lib/api.ts`
**AC(s) covered:** AC1, AC2
**Changes:**
- If `conversationsApi.getMessages()` or `conversationsApi.addMessage()` are missing, add them
- Follow existing API client patterns in the file

**Commit:**
```bash
git add client/src/lib/api.ts
git commit -m "fix(ai): add missing conversationsApi methods — US-AI-006"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `client/src/components/ai-chat/AIChatBox.tsx` | T1, T2, T3, T4 | AC1–AC4 | main change |
| `client/src/lib/api.ts` | T5 | AC1 | only if methods missing |

---

## Exact Test Commands

```bash
# 1. TypeScript check
npm run check

# 2. Unit tests
npm run test:unit

# 3. Verify localStorage removed
grep -n "localStorage" client/src/components/ai-chat/AIChatBox.tsx
# Expected: zero conversation-related results

# 4. Manual flow
# Open localhost:5000 → Network tab → confirm GET /api/v1/conversations on load
# Create a conversation → hard refresh → it's still there
# Delete a conversation → list updates immediately (no refresh needed)
```

---

## Task Checklist

- [ ] T1 — Audit localStorage calls in AIChatBox.tsx
- [ ] T2 — Replace mount/load with React Query useQuery
- [ ] T3 — Replace create/save with useMutation
- [ ] T4 — Replace delete with useMutation + cache invalidation
- [ ] T5 — Add missing conversationsApi methods (if needed)
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual: conversations persist across refresh ✅
- [ ] Manual: list updates on create/delete without refresh ✅
- [ ] PR opened ✅
- [ ] STORY.md ACs updated ✅

---

## Anti-Patterns to Avoid in This Story

- Do NOT change AI generation logic, regex validation, or prompt submission flow
- Do NOT change the UI layout or message display components
- Do NOT add pagination — keep it simple, load all messages for a conversation
- Do NOT use useEffect + fetch — use React Query pattern consistently

---

*Tasks created: 2026-04-28*
