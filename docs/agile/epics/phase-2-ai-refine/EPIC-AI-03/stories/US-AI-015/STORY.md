# Story Card — US-AI-015

> **Status:** 🔲 Not Started
> **Feature:** F-AI-03-01 — Quick Refine + Canvas-to-Chat connection
> **Epic:** [EPIC-AI-03](../../EPIC.md)
> **Milestone:** [M-AI-08-quick-refine](../../milestones/M-AI-08-quick-refine.md)
> **Linear:** LIN-US-AI-015 | **Created:** 2026-04-28

---

## Story

*As a* real estate agent who just received a generated infographic
*I want* quick one-tap refinement options after generation
*So that* I can improve the result without re-entering all property details

---

## Acceptance Criteria

- [ ] **AC1:** After generation completes, 3 Quick Refine chips appear below the result (e.g., "More luxurious", "Darker background", "Create Just Sold version")
- [ ] **AC2:** Tapping a chip re-calls `ConversationAiService` with the original infographic context + chip text as the refinement instruction
- [ ] **AC3:** A new refined version is generated and displayed in <15 seconds
- [ ] **AC4:** Quick Refine chips are contextually different from suggestion chips (they appear after generation, not after every AI reply)
- [ ] **AC5:** `npm run check` passes

---

## Out of Scope

- "Refine with AI" from canvas (US-AI-016)
- Element-level editing (US-AI-017)
- Persisting refine history beyond the session

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-015-quick-refine-chips`
- **Primary files touched:**
  - `client/src/components/ai-chat/AIChatBox.tsx`
  - `api/src/modules/ai-generation/services/quick-edit.service.ts` (new)

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-AI-015-01 | Manual | P0 | Generate infographic → 3 Quick Refine chips appear | 🔲 |
| TC-AI-015-02 | Manual | P0 | Tap "More luxurious" → new generation appears in <15s | 🔲 |

---

## Definition of Done

- [ ] All ACs checked ✅ | `npm run check` ✅ | `npm run test:unit` ✅ | PR merged | [TASKS.md](./TASKS.md) checked

*Story created: 2026-04-28*
