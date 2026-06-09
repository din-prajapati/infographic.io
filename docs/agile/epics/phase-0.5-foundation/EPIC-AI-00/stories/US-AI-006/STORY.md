# Story Card — US-AI-006

> **Status:** 🔲 Not Started
> **Feature:** F-AI-00-03 — Durable data persistence (extraction + conversations)
> **Epic:** [EPIC-AI-00](../../EPIC.md)
> **Milestone:** [M-AI-03-data-persistence](../../milestones/M-AI-03-data-persistence.md)
> **Linear:** LIN-US-AI-006
> **Created:** 2026-04-28 | **Closed:** —

---

## Story

*As a* real estate agent
*I want* my conversation history to survive a page refresh and be accessible across devices
*So that* I can continue previous conversations and not lose my work

---

## Acceptance Criteria

- [ ] **AC1:** All conversation CRUD operations (create, list, load, delete) use the backend `/api/v1/conversations` endpoints — no `localStorage.setItem` / `localStorage.getItem` calls remain for conversation data in `AIChatBox.tsx`
- [ ] **AC2:** After a hard refresh (`Cmd+Shift+R`), conversation history reloads from the backend (previous messages visible)
- [ ] **AC3:** Creating a new conversation via the UI creates a record in the `Conversation` table (verify in Prisma Studio)
- [ ] **AC4:** React Query cache is invalidated correctly after conversation create/delete — the sidebar list updates without a manual refresh
- [ ] **AC5:** `npm run check` passes

---

## Out of Scope

- Adding AI responses to conversations (EPIC-AI-01 — CAP-01)
- Changing the conversation schema
- Adding search or filtering to conversation list
- Message pagination

---

## Engineering / PR

- **Branch:** `fix/ai-us-ai-006-conversations-backend`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/ai-chat/AIChatBox.tsx`
  - `client/src/lib/api.ts` (if `conversationsApi` methods need adding)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — React frontend (port 5000), NestJS API (port 3001).
See CLAUDE.md. State: Zustand + React Query. API client: client/src/lib/api.ts.

Story: US-AI-006 — Connect conversations to backend API (remove localStorage)

Problem: AIChatBox.tsx loads/saves conversations to localStorage (lines ~154-187).
The backend conversations module exists with full CRUD API at /api/v1/conversations.
The conversationsApi object likely exists in client/src/lib/api.ts.

Fix:
1. Read AIChatBox.tsx (full file) to understand all localStorage conversation operations
2. Replace each localStorage operation with the corresponding conversationsApi call:
   - Load conversations on mount → conversationsApi.list()
   - Create conversation → conversationsApi.create({title, propertyType})
   - Load messages for conversation → conversationsApi.getMessages(conversationId)
   - Save message → conversationsApi.addMessage(conversationId, message)
   - Delete conversation → conversationsApi.delete(conversationId)
3. Use React Query (useQuery/useMutation) for all API calls — follow pattern of other components
4. Invalidate the conversations list query after create/delete

IMPORTANT:
- DO NOT change AI generation logic, validation logic, or UI layout
- DO NOT remove message objects from state — keep local state for in-flight messages
- Use existing conversationsApi methods — only add new methods to api.ts if they're missing
- Token/quota: AIChatBox.tsx is 480 lines — read the full file before making changes
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-006-01 | Manual | P0 | Load app → open DevTools Network → confirm GET /api/v1/conversations is called on mount | 🔲 | |
| TC-AI-006-02 | Manual | P0 | Create a conversation → hard refresh → conversation appears in list | 🔲 | |
| TC-AI-006-03| Manual | P0 | Delete a conversation → it disappears from list without page refresh | 🔲 | |
| TC-AI-006-04 | Manual | P1 | `grep -r "localStorage" client/src/components/ai-chat/AIChatBox.tsx` returns zero conversation-related calls | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified on `localhost:5000`
- [ ] PR merged (PR #{number})
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-04-28*
