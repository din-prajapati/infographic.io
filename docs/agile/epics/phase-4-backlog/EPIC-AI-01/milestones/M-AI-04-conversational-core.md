# M-AI-04-conversational-core — ConversationAiService + Intent + Pre-Plan

> **Epic:** [EPIC-AI-01](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** 2026-06-30

---

## Goal

The AI sends a meaningful conversational reply to every user message, classifies intent to route the conversation correctly, and shows a task plan before image generation begins.

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-AI-007](../stories/US-AI-007/STORY.md) | ConversationAiService + Intent Classification | 🔲 | — |
| [US-AI-008](../stories/US-AI-008/STORY.md) | Pre-generation task plan message | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] `POST /conversations/:id/chat` endpoint exists and returns an AI message
- [ ] AI reply appears in the chat panel within 5 seconds of sending a message
- [ ] Intent classification correctly identifies `gather_info` (missing data → ask), `ready` (has enough → plan+generate), `refine` (has result → modify), `campaign` (wants full set)
- [ ] When intent = `ready`, a task plan message appears in chat BEFORE image generation starts
- [ ] Task plan lists at least: "Analyzing property data", "Building visual layout", "Generating infographic"
- [ ] Regex validation no longer used as the primary routing mechanism
- [ ] All stories above have status ✅ Done

---

## Notes / Blockers

- US-AI-007 must be complete before US-AI-008 (pre-plan is part of the `ready` intent flow)
- EPIC-AI-00 (especially US-AI-006 conversations backend) must be complete first
- The `ConversationAiService` is a new NestJS service — it lives in the conversations module or a new ai-chat sub-module

---

*Milestone created: 2026-04-28*
