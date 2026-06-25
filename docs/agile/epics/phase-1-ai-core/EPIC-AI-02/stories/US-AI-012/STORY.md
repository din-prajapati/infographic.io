# Story Card — US-AI-012

> **Status:** 🔲 Not Started
> **Feature:** F-AI-02-03 — Quality tier selector (model-transparent)
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-07-quality-campaign](../../milestones/M-AI-07-quality-campaign.md)
> **Linear:** LIN-US-AI-012
> **Created:** 2026-04-28 | **Closed:** —

---

## Story

*As a* real estate agent
*I want* to choose between "Social" and "Print Quality" for my infographic
*So that* I get the right quality for my use case without needing to know which AI model is used

---

## Acceptance Criteria

- [ ] **AC1:** A quality selector appears in the chat panel with two options: "Social" and "Print Quality"
- [ ] **AC2:** "Social" maps internally to the Flash model tier (fast, lower cost); "Print Quality" maps to the Pro model tier (higher detail)
- [ ] **AC3:** Quality label in the UI is "Social" or "Print Quality" — no model names, resolution numbers, or API details are ever shown
- [ ] **AC4:** For SOLO/FREE plans, "Print Quality" is disabled or shows an upgrade prompt (Print Quality is TEAM+ only)
- [ ] **AC5:** `npm run check` passes

---

## Out of Scope

- Upscaling to 4K (EPIC-AI-03 — CAP-17)
- Custom quality parameters
- Showing cost difference to user

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-012-quality-tiers`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/ai-chat/AIChatBox.tsx`
  - `api/src/modules/ai-generation/services/image-generation.service.ts`

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS. CAP-08: Generation quality tiers.

Story: US-AI-012 — Quality tiers: Social vs Print Quality

Quality → internal model mapping (NEVER shown to user):
- "Social"        → Nano Banana Flash (quick, lower cost)
- "Print Quality" → Nano Banana Pro (higher detail, higher cost)

Quality is available per plan:
- FREE/SOLO: Social only (Print Quality is disabled / shows upgrade prompt)
- TEAM/BROKERAGE: both Social and Print Quality available

FRONTEND:
1. Add quality toggle (two-pill selector) in AIChatBox.tsx
2. If user plan is FREE/SOLO: Print Quality pill is disabled, shows tooltip "Upgrade to TEAM for Print Quality"
3. Default: Social

BACKEND:
4. Accept `qualityTier: 'social' | 'print'` in generation request
5. Map to model selection in image-generation.service.ts (social → Flash, print → Pro)
   Combine with plan tier: TEAM+print → Pro, SOLO+social → Flash

CRITICAL: qualityTier param must NOT leak to any API response the frontend renders as a label.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-012-01 | Manual | P0 | Select Social → generate → server logs show Flash model used | 🔲 | |
| TC-AI-012-02 | Manual | P0 | Select Print Quality (TEAM plan) → server logs show Pro model used | 🔲 | |
| TC-AI-012-03 | Manual | P0 | FREE/SOLO plan: Print Quality selector is disabled | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] `npm run check` passes
- [ ] Manual: quality selector works per plan ✅
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-04-28*
