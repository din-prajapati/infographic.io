# Story Card — US-AI-008

> **Status:** 🔲 Not Started
> **Feature:** F-AI-01-02 — Pre-generation transparency — task plan message
> **Epic:** [EPIC-AI-01](../../EPIC.md)
> **Milestone:** [M-AI-04-conversational-core](../../milestones/M-AI-04-conversational-core.md)
> **Linear:** LIN-US-AI-008
> **Created:** 2026-04-28 | **Closed:** —

---

## Story

*As a* real estate agent
*I want* to see what the AI is about to do before it starts generating
*So that* I can redirect or cancel before credits are used on something I don't want

---

## Acceptance Criteria

- [ ] **AC1:** When `ConversationAiService` returns `intent = 'ready'`, a task plan message is inserted into the chat BEFORE image generation begins
- [ ] **AC2:** The task plan message lists at least 3 steps in plain English, e.g.: "Analyzing your property details", "Building the visual layout", "Generating your infographic"
- [ ] **AC3:** The task plan message is visually distinct from regular AI replies (e.g., a structured list or step indicator style)
- [ ] **AC4:** Steps update/tick off as the generation progresses (using existing Socket.io progress events)
- [ ] **AC5:** `npm run check` passes

---

## Out of Scope

- Allowing the user to edit or cancel mid-generation (future)
- AI-generating custom plan steps based on property type (keep generic for now)
- Campaign Mode multi-step plan (EPIC-AI-04)

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-008-pregeneation-plan`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/ai-chat/AIChatBox.tsx` (inject plan message before generation)
  - `client/src/components/ai-chat/GenerationPlanMessage.tsx` (new component, or inline)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — React frontend (port 5000).
See CLAUDE.md. US-AI-007 (ConversationAiService) must be complete first.

Story: US-AI-008 — Pre-generation task plan message (CAP-04)

When the AI returns intent='ready', before calling the generation API:
1. Insert a special message into the chat messages array with type='task-plan'
   Content: { steps: ['Analyzing property details', 'Building visual layout', 'Generating your infographic'] }
2. Render this message with a visually distinct component (use existing UI token styles)
3. As Socket.io generation:progress events arrive, update the step indicators
   (step 1 ✓ when extraction done, step 2 ✓ when layout built, step 3 ✓ when image ready)

The plan is static text for now — do not call AI to generate custom steps.

Existing Socket.io progress events from useGenerationWebSocket can be mapped to steps:
- 'extracting' → step 1 active
- 'generating' → step 2 active
- 'rendering' → step 3 active
- 'complete' → all steps done

Keep the component small. Use existing design tokens for styling.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-008-01 | Manual | P0 | Provide full property details → task plan message appears in chat before image loads | 🔲 | |
| TC-AI-008-02 | Manual | P0 | Task plan steps update as generation progresses (step indicators activate) | 🔲 | |
| TC-AI-008-03 | Manual | P1 | Task plan message is visually distinct from regular chat messages | 🔲 | |

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
