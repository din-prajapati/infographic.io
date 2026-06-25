# Story Card — US-AI-013

> **Status:** 🔲 Not Started
> **Feature:** F-AI-02-03 — Quality tier selector (model-transparent)
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-07-quality-campaign](../../milestones/M-AI-07-quality-campaign.md)
> **Linear:** LIN-US-AI-013
> **Created:** 2026-04-28 | **Closed:** —

---

## Story

*As a* product owner
*I want* luxury and commercial property listings to automatically use the Pro model tier
*So that* high-value listings always get the best output quality without the agent needing to choose

---

## Acceptance Criteria

- [ ] **AC1:** When a BROKERAGE/TEAM user generates for a "luxury" or "commercial" property type (detected from conversation context), the Pro model is used automatically regardless of quality selector
- [ ] **AC2:** The routing is invisible — no message or label tells the agent "switching to Pro model"
- [ ] **AC3:** The logic lives in `image-generation.service.ts` as a routing function: `resolveModel(planTier, propertyType, qualityTier) → model`
- [ ] **AC4:** `npm run check` passes

---

## Out of Scope

- Exposing property tier to users
- Any UI changes

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-013-property-quality-routing`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/ai-generation/services/image-generation.service.ts`

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS NestJS API. CAP-09: Property type → quality routing.

Story: US-AI-013 — Property type → quality routing (hidden internal logic)

Implement resolveModel(planTier, propertyType, qualityTier) in image-generation.service.ts:

Routing rules:
- FREE → always Flash (regardless of propertyType or qualityTier)
- SOLO → always Flash
- TEAM/BROKERAGE + qualityTier='print' → Pro
- TEAM/BROKERAGE + qualityTier='social' + propertyType in ['luxury', 'commercial', 'penthouse'] → Pro (auto-upgrade)
- TEAM/BROKERAGE + qualityTier='social' + other propertyType → Flash

Property types that auto-upgrade: 'luxury', 'penthouse', 'commercial', 'estate'
This is detected from the extracted property data (extractedData.propertyType field).

No UI changes. No user-visible label. Logic is purely backend.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-013-01 | Manual | P0 | TEAM plan + luxury property + Social quality → server uses Pro model | 🔲 | |
| TC-AI-013-02 | Manual | P0 | FREE plan + luxury property → server uses Flash model (no upgrade) | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] `npm run check` passes
- [ ] Manual: routing function tested with luxury + residential property types ✅
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-04-28*
