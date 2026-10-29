# PR Task List — US-AI-007

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-007-conversation-ai-service`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-US-AI-007
> **Type:** feat

---

## PR Scope Summary

**One-liner:** Build ConversationAiService with intent classification and wire to frontend chat submission
```
feat(ai): add ConversationAiService + intent classification, bypass regex gate — US-AI-007
```

---

## Task Breakdown

### T1 — Create ConversationAiService
**File:** `api/src/modules/conversations/conversation-ai.service.ts` (new file)
**AC(s) covered:** AC1, AC2, AC3
**Changes:**
- Injectable NestJS service
- `chat(conversationId, userMessage)` method:
  - Load last 10 messages from DB
  - Build system prompt with intent classification instructions
  - Call GPT-4o (openai.service.ts or directly via OpenAI SDK)
  - Parse JSON response: `{ reply, intent, chips }`
  - Save user message + AI reply to Message table
  - Return `ChatResponse`

**Commit:**
```bash
git add api/src/modules/conversations/conversation-ai.service.ts
git commit -m "feat(ai): create ConversationAiService with intent classification — US-AI-007"
```

### T2 — Register service + add POST route
**File:** `api/src/modules/conversations/conversations.module.ts`, `conversations.controller.ts`
**AC(s) covered:** AC1
**Changes:**
- Add `ConversationAiService` to module providers
- Add `POST /conversations/:id/chat` route in controller

**Commit:**
```bash
git add api/src/modules/conversations/conversations.module.ts api/src/modules/conversations/conversations.controller.ts
git commit -m "feat(ai): register ConversationAiService, add POST chat route — US-AI-007"
```

### T3 — Add conversationsApi.chat() to frontend API client
**File:** `client/src/lib/api.ts`
**AC(s) covered:** AC1
**Changes:**
- Add `chat(conversationId: string, message: string)` method to `conversationsApi` object

**Commit:**
```bash
git add client/src/lib/api.ts
git commit -m "feat(ai): add conversationsApi.chat() to API client — US-AI-007"
```

### T4 — Wire frontend handleSubmit to ConversationAiService
**File:** `client/src/components/ai-chat/AIChatBox.tsx`
**AC(s) covered:** AC4
**Changes:**
- In `handleSubmit` / `handleGenerate`: call `conversationsApi.chat(conversationId, message)`
- If `intent === 'ready'` → proceed to existing generation flow
- If `intent === 'gather_info'` → display AI reply, wait for next input
- Remove regex validation as the primary gate (keep as soft hint only if needed)

**Commit:**
```bash
git add client/src/components/ai-chat/AIChatBox.tsx
git commit -m "feat(ai): wire handleSubmit to ConversationAiService, bypass regex gate — US-AI-007"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/src/modules/conversations/conversation-ai.service.ts` | T1 | AC1–AC3 | new file |
| `api/src/modules/conversations/conversations.module.ts` | T2 | AC1 | register service |
| `api/src/modules/conversations/conversations.controller.ts` | T2 | AC1 | new route |
| `client/src/lib/api.ts` | T3 | AC1 | new method |
| `client/src/components/ai-chat/AIChatBox.tsx` | T4 | AC4 | bypass regex |

---

## Exact Test Commands

```bash
# 1. TypeScript check
npm run check

# 2. Unit tests
npm run test:unit

# 3. Manual flow
# Open localhost:5000
# Type "I want to create an infographic"
# Verify: AI replies with a question (not an error/validation message)
# Provide full property details → verify generation starts
```

---

## Task Checklist

- [ ] T1 — Create ConversationAiService
- [ ] T2 — Register service + add POST route
- [ ] T3 — Add conversationsApi.chat() to api.ts
- [ ] T4 — Wire AIChatBox.tsx handleSubmit
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual 5-turn conversation works ✅
- [ ] PR opened ✅
- [ ] STORY.md ACs updated ✅

---

*Tasks created: 2026-04-28*
