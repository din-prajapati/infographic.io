# PR Task List — US-AI-009

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-009-dynamic-chips`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-US-AI-009
> **Type:** feat

---

## PR Scope Summary

**One-liner:** Wire AI-returned chips array to SuggestionChips component, replacing static list post-response
```
feat(ai): render AI-generated suggestion chips from ConversationAiService response — US-AI-009
```

---

## Task Breakdown

### T1 — Update SuggestionChips to accept dynamic chips prop
**File:** `client/src/components/ai-chat/SuggestionChips.tsx`
**AC(s) covered:** AC4
**Changes:**
- Add optional `dynamicChips?: string[]` prop
- When `dynamicChips` is provided and non-empty, render those instead of static list

**Commit:**
```bash
git add client/src/components/ai-chat/SuggestionChips.tsx
git commit -m "feat(ai): add dynamicChips prop to SuggestionChips component — US-AI-009"
```

### T2 — Store and pass chips from AI response
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
**AC(s) covered:** AC1, AC2, AC3, AC5
**Changes:**
- After receiving chat response, store `response.chips` in state: `const [lastChips, setLastChips] = useState<string[]>([])`
- Pass `lastChips` as `dynamicChips` prop to `<SuggestionChips />`
- Clear chips when user sends a new message (chips update after each AI response)

**Commit:**
```bash
git add client/src/components/ai-chat/AIChatBox.tsx
git commit -m "feat(ai): pass AI-generated chips to SuggestionChips after each response — US-AI-009"
```

---

## Exact Test Commands

```bash
# 1. TypeScript check
npm run check

# 2. Unit tests
npm run test:unit

# 3. Manual flow
# Send any message in chat
# After AI responds: verify 3 chips appear that are contextually relevant
# Click a chip: verify it submits as next message
# Check: chips change after each AI response
```

---

## Task Checklist

- [ ] T1 — Update SuggestionChips with dynamicChips prop
- [ ] T2 — Store and pass chips from AI response in AIChatBox
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual: 3 relevant chips appear after every AI reply ✅
- [ ] Manual: clicking chip sends it as next message ✅
- [ ] PR opened ✅
- [ ] STORY.md ACs updated ✅

---

*Tasks created: 2026-04-28*
