# M-AI-03-data-persistence — Persist Extraction + Connect Conversations to Backend

> **Epic:** [EPIC-AI-00](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** 2026-05-12

---

## Goal

Extraction results are written to the `Extraction` table after every generation so regeneration flows work, and all conversation CRUD uses the backend API so history survives page refresh and is accessible across devices.

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-AI-005](../stories/US-AI-005/STORY.md) | Persist Extraction data to database | 🔲 | — |
| [US-AI-006](../stories/US-AI-006/STORY.md) | Connect conversations to backend API (remove localStorage) | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] After a generation run, `Extraction` table in Prisma Studio shows a new row with `conversationId`, `propertyAddress`, `extractedData`
- [ ] Regeneration from the same conversation does not 404
- [ ] Hard-refreshing the browser loads conversation history from `/api/v1/conversations`
- [ ] No `localStorage.setItem` / `localStorage.getItem` calls remain for conversation data in `AIChatBox.tsx`
- [ ] Conversation list updates in real-time after a new conversation is created (no stale state)
- [ ] `npm run check` + `npm run test:unit` pass
- [ ] All stories above have status ✅ Done

---

## Notes / Blockers

- US-AI-005 (3h) should be implemented before US-AI-006 (8h) — extraction persistence unlocks the full regeneration flow which US-AI-006 also touches
- The `conversations` NestJS module already exists — this is wiring, not building from scratch
- US-AI-006 is the largest story in this epic (8h) — ensure React Query cache invalidation is handled correctly after CRUD operations

---

*Milestone created: 2026-04-28*
