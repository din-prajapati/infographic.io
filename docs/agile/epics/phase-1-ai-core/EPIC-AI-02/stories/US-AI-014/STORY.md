# Story Card — US-AI-014

> **Status:** 🔲 Not Started
> **Feature:** F-AI-02-04 — Campaign Mode UI framing
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-07-quality-campaign](../../milestones/M-AI-07-quality-campaign.md)
> **Linear:** LIN-US-AI-014
> **Created:** 2026-04-28 | **Closed:** —

---

## Story

*As a* real estate agent
*I want* to see a "Campaign Mode" option in the chat panel
*So that* I know a full marketing set (Listing + Open House + Sold + Story) is coming in a future update and can opt in when it's ready

---

## Acceptance Criteria

- [ ] **AC1:** A "Campaign Mode" toggle or button exists in the chat UI
- [ ] **AC2:** Clicking it shows a "Coming Soon" state or tooltip explaining what Campaign Mode will do: "Generate a complete 4-piece marketing set: Listing, Open House, Sold, and Story"
- [ ] **AC3:** Campaign Mode toggle does NOT trigger any generation — backend is deferred to EPIC-AI-04
- [ ] **AC4:** The label says "Campaign Mode" (not "Thinking Mode", "Batch Mode", or any technical term)
- [ ] **AC5:** `npm run check` passes

---

## Out of Scope

- Campaign Mode backend / 4-piece generation (EPIC-AI-04 — CAP-09 backend, 24h effort)
- Any pricing gate for Campaign Mode (BROKERAGE enforcement is in EPIC-AI-04)

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-014-campaign-mode-ui`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/ai-chat/AIChatBox.tsx`

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — React frontend. CAP-10: Campaign Mode UI.

Story: US-AI-014 — Campaign Mode UI toggle (backend deferred)

Add a Campaign Mode toggle to AIChatBox.tsx:
1. A small toggle or button labeled "Campaign Mode" (consider a lightning bolt icon)
2. When clicked/toggled: show a tooltip or inline message:
   "Campaign Mode coming soon — generate a complete 4-piece marketing set:
    Listing · Open House · Just Sold · Story"
3. Do NOT send any campaign-related flag to the backend
4. Toggle state is local only (no persistence needed)

Use existing design tokens. Keep the component small — one state variable, one tooltip.
Do NOT implement any backend logic.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-014-01 | Manual | P0 | Campaign Mode toggle visible in chat panel | 🔲 | |
| TC-AI-014-02 | Manual | P0 | Clicking toggle shows "Coming Soon" state, does NOT trigger generation | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] `npm run check` passes
- [ ] Manual: toggle shows coming-soon state ✅
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-04-28*
