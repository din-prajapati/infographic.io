# Story Card — US-AI-007

> **Status:** 🔲 Not Started
> **Feature:** F-AI-01-01 — Conversational AI core
> **Epic:** [EPIC-AI-01](../../EPIC.md)
> **Milestone:** [M-AI-04-conversational-core](../../milestones/M-AI-04-conversational-core.md)
> **Linear:** LIN-US-AI-007
> **Created:** 2026-04-28 | **Closed:** —

---

## Story

*As a* real estate agent
*I want* the AI to respond naturally to my messages and ask follow-up questions when it needs more information
*So that* I feel like I'm talking to a knowledgeable assistant, not filling out a form

---

## Acceptance Criteria

- [ ] **AC1:** `POST /conversations/:id/chat` endpoint accepts `{ message: string }` and returns `{ reply: string, intent: string, chips: string[] }`
- [ ] **AC2:** `ConversationAiService` sends the full conversation history (not just the latest message) to GPT-4o for context
- [ ] **AC3:** Intent classification returns one of: `gather_info` | `ready` | `refine` | `campaign`
  - `gather_info`: AI asks a follow-up question (missing address, price, or property type)
  - `ready`: AI has enough data to generate — triggers task plan + generation flow
  - `refine`: Post-generation modification request
  - `campaign`: Request for a full 4-piece marketing set
- [ ] **AC4:** The `validatePromptFields()` regex check in `AIChatBox.tsx` is bypassed — messages are sent to the AI endpoint instead of being regex-validated
- [ ] **AC5:** `npm run check` passes

---

## Out of Scope

- Pre-generation task plan message display (US-AI-008)
- Suggestion chips (US-AI-009)
- Property photo upload (EPIC-AI-02)
- Campaign Mode backend (EPIC-AI-04)

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-007-conversation-ai-service`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/conversations/conversations.controller.ts` (new route)
  - `api/src/modules/conversations/conversation-ai.service.ts` (new service)
  - `api/src/modules/conversations/conversations.module.ts` (register service)
  - `client/src/components/ai-chat/AIChatBox.tsx` (call new endpoint, bypass regex)
  - `client/src/lib/api.ts` (add `conversationsApi.chat()`)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
See CLAUDE.md. EPIC-AI-00 must be complete first.

Story: US-AI-007 — ConversationAiService + Intent Classification (CAP-01 + CAP-02)

BACKEND — Create ConversationAiService:
1. New file: api/src/modules/conversations/conversation-ai.service.ts
2. Method: chat(conversationId: string, userMessage: string): Promise<ChatResponse>
   - Load conversation history from DB (last 10 messages)
   - Build system prompt: "You are an AI assistant for real estate agents creating marketing infographics.
     Analyze the conversation and classify intent. If missing property details, ask ONE follow-up question.
     If you have address, price, property type → respond with intent=ready.
     Always respond in JSON: { reply, intent, chips[3] }"
   - Call GPT-4o with history + system prompt
   - Parse response: { reply: string, intent: 'gather_info'|'ready'|'refine'|'campaign', chips: string[] }
   - Save user message + AI reply to Message table
   - Return ChatResponse

3. New route in conversations.controller.ts:
   POST /conversations/:id/chat → calls ConversationAiService.chat()

FRONTEND:
4. Add conversationsApi.chat(conversationId, message) to client/src/lib/api.ts
5. In AIChatBox.tsx handleSubmit: instead of calling validatePromptFields() as gate,
   call conversationsApi.chat() → display AI reply in chat panel
   If intent='ready' → proceed to generation flow
   If intent='gather_info' → display reply only, wait for user's next message

CRITICAL: Do NOT expose intent names, model names, or technical details in any UI label.
The user sees only the AI's natural language reply.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-007-01 | Manual | P0 | Type "I want to make an infographic" → AI replies with a follow-up question (no error) | 🔲 | |
| TC-AI-007-02 | Manual | P0 | Provide address + price + type → AI intent = `ready` → generation flow starts | 🔲 | |
| TC-AI-007-03 | Manual | P1 | 5-turn conversation stays coherent (AI references earlier messages) | 🔲 | |
| TC-AI-007-04 | Auto | P1 | POST /conversations/:id/chat returns { reply, intent, chips } with correct shape | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual 5-turn conversation works on `localhost:5000`
- [ ] PR merged (PR #{number})
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-04-28*
