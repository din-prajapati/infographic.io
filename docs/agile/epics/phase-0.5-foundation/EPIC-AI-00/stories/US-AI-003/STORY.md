# Story Card — US-AI-003

> **Status:** 🔲 Not Started
> **Feature:** F-AI-00-02 — Correct LLM model routing (Nano Banana)
> **Epic:** [EPIC-AI-00](../../EPIC.md)
> **Milestone:** [M-AI-02-model-swap](../../milestones/M-AI-02-model-swap.md)
> **Linear:** LIN-US-AI-003
> **Created:** 2026-04-28 | **Closed:** —

---

## Story

*As a* FREE or SOLO plan user
*I want* my infographics to be generated with a faster, cheaper, higher-quality model
*So that* I get better results without the business paying 12× more than necessary

---

## Acceptance Criteria

- [ ] **AC1:** FREE and SOLO tier infographic generations no longer call the Ideogram API — they use Nano Banana Flash (Gemini 2.5 Flash Image)
- [ ] **AC2:** A generated infographic on FREE/SOLO tier looks visually correct (manual test)
- [ ] **AC3:** `ai-models.config.ts` has a `nano-banana-flash` entry with `costPerImage: 0.016` (max)
- [ ] **AC4:** Model selection is internal only — no model name is exposed to the frontend or returned in any API response
- [ ] **AC5:** `npm run check` passes

---

## Out of Scope

- TEAM/BROKERAGE tier model swap (US-AI-004)
- Changes to image prompt generation logic
- Changes to UI components
- TEAM/BROKERAGE tier image generation

---

## Engineering / PR

- **Branch:** `fix/ai-us-ai-003-nano-banana-flash`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/config/ai-models.config.ts`
  - `api/src/modules/ai-generation/services/image-generation.service.ts`
  - `.env.example` (add `NANO_BANANA_API_KEY`)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001).
See CLAUDE.md for architecture. Current image model: Ideogram Turbo ($0.025/image).

Story: US-AI-003 — Replace Ideogram Turbo with Nano Banana Flash for FREE/SOLO tier

Nano Banana Flash = Gemini 2.5 Flash Image API (Google AI).
Cost: $0.002–$0.016/image (vs Ideogram $0.025 — ~72% cheaper).
Model must NEVER be exposed in any API response or UI label.

Implementation:
1. Add 'nano-banana-flash' entry to ai-models.config.ts with costPerImage: 0.016
2. In image-generation.service.ts: detect plan tier (FREE/SOLO) and route to Nano Banana Flash API instead of Ideogram
3. Add NANO_BANANA_API_KEY to .env.example
4. The existing plan tier detection logic should be reused/extended — check how plan is passed to the service

Key constraint: the string "nano-banana", "gemini", "flash" must NOT appear in any frontend
response payload, API error message, or UI label.

Test: generate an infographic on FREE plan → image is produced → no Ideogram call in server logs.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-003-01 | Manual | P0 | Generate infographic on FREE plan → server logs show Nano Banana call, NOT Ideogram | 🔲 | |
| TC-AI-003-02 | Manual | P0 | Generated image quality is acceptable (real estate style) | 🔲 | |
| TC-AI-003-03 | Manual | P1 | API response JSON contains no model name references | 🔲 | |

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
