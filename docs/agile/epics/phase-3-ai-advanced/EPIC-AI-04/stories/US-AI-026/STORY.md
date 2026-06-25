# Story Card — US-AI-026

> **Status:** 🔲 Not Started
> **Feature:** F-AI-04-04 | **Epic:** [EPIC-AI-04](../../EPIC.md)
> **Milestone:** [M-AI-14-campaign-backend](../../milestones/M-AI-14-campaign-backend.md)
> **Capability:** CAP-09 backend (24h) | **Created:** 2026-04-28

## Story

*As a* brokerage admin or senior agent
*I want* to generate a complete 4-piece marketing campaign (Listing, Open House, Just Sold, Story) in one request
*So that* I have a full, visually consistent marketing set without making 4 separate requests

## Acceptance Criteria

- [ ] **AC1:** Campaign Mode (wired from US-AI-014 UI toggle) triggers 4 sequential image generations using `CampaignOrchestrator`
- [ ] **AC2:** All 4 images are visually consistent — same color palette, agent block, and design language
- [ ] **AC3:** Each image has the correct theme: Listing (blue/neutral), Open House (warm/inviting), Just Sold (green/celebration), Story (9:16 vertical)
- [ ] **AC4:** BROKERAGE plan only — FREE/SOLO/TEAM see "Upgrade to Brokerage" prompt
- [ ] **AC5:** All 4 images displayed in the chat panel as a campaign result card
- [ ] **AC6:** `npm run check` passes

## Engineering / PR

- **Branch:** `feat/ai-us-ai-026-campaign-backend`
- **Primary files:** `api/src/modules/ai-generation/services/campaign-orchestrator.service.ts` (new), `client/src/components/ai-chat/AIChatBox.tsx`

## AI Implementation Prompt

```
Context: InfographicAI SaaS — NestJS (port 3001) + React (port 5000). See CLAUDE.md.
Read EPIC-AI-04/EPIC.md and ARCHITECTURE.mmd before starting.
Capability: CAP-09 backend — Campaign Mode full 4-piece generation

This is the largest single story in the AI roadmap (24h). Plan for multiple sessions.

CampaignOrchestrator:
- Accept campaign request with property data
- Generate 4 images sequentially (not parallel — avoid rate limits):
  1. Listing infographic (neutral blue theme)
  2. Open House infographic (warm theme, add event date if provided)  
  3. Just Sold infographic (celebration green theme, sold price)
  4. Story format (9:16, simplified layout)
- Ensure visual consistency: same agent block, colors, fonts across all 4
- Store all 4 in R2 (requires US-AI-020 complete)
- Return { campaignId, images: [{ type, url, signedUrl }] }

BROKERAGE plan gate: check subscription tier before allowing campaign generation.
No model names in any response payload.
```

## Test Cases

| TC ID | Type | Priority | Scenario | Status |
|-------|------|----------|----------|--------|
| TC-AI-026-01 | Manual | P0 | BROKERAGE plan: Campaign Mode generates 4 images | 🔲 |
| TC-AI-026-02 | Manual | P0 | All 4 images visually consistent | 🔲 |
| TC-AI-026-03 | Manual | P0 | TEAM plan: Campaign Mode shows upgrade prompt | 🔲 |

## Definition of Done

- [ ] All ACs ✅ | `npm run check` ✅ | `npm run test:unit` ✅ | PR merged | [TASKS.md](./TASKS.md) checked

*Story created: 2026-04-28*
