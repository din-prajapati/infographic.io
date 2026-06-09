# Story Card — US-AI-004

> **Status:** 🔲 Not Started
> **Feature:** F-AI-00-02 — Correct LLM model routing (Nano Banana)
> **Epic:** [EPIC-AI-00](../../EPIC.md)
> **Milestone:** [M-AI-02-model-swap](../../milestones/M-AI-02-model-swap.md)
> **Linear:** LIN-US-AI-004
> **Created:** 2026-04-28 | **Closed:** —

---

## Story

*As a* TEAM or BROKERAGE plan user
*I want* my infographics to be generated with a premium, higher-quality model
*So that* I get professional-grade output for luxury and high-volume listings at 37% lower cost than Ideogram V2

---

## Acceptance Criteria

- [ ] **AC1:** TEAM and BROKERAGE tier generations use Nano Banana Pro (Gemini 3 Pro Image), NOT Ideogram V2
- [ ] **AC2:** A generated infographic on TEAM/BROKERAGE looks visually higher quality than Flash tier (manual test)
- [ ] **AC3:** `ai-models.config.ts` has a `nano-banana-pro` entry with `costPerImage: 0.10` (max)
- [ ] **AC4:** No Ideogram API calls remain for any plan tier — Ideogram is fully removed
- [ ] **AC5:** Model selection is internal only — no model name exposed to frontend or API responses
- [ ] **AC6:** `npm run check` passes

---

## Out of Scope

- FREE/SOLO model swap (covered by US-AI-003, which must be complete before this story)
- Changes to image prompt generation logic
- UI changes
- Pricing page changes

---

## Engineering / PR

- **Branch:** `fix/ai-us-ai-004-nano-banana-pro`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/config/ai-models.config.ts`
  - `api/src/modules/ai-generation/services/image-generation.service.ts`

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001).
See CLAUDE.md. US-AI-003 (Nano Banana Flash for FREE/SOLO) must be complete first.

Story: US-AI-004 — Replace Ideogram V2 with Nano Banana Pro for TEAM/BROKERAGE tier

Nano Banana Pro = Gemini 3 Pro Image API (Google AI).
Cost: $0.03–$0.10/image (vs Ideogram V2 $0.080 — ~37% cheaper, higher quality).
Model must NEVER be exposed in any API response or UI label.

Implementation:
1. Add 'nano-banana-pro' entry to ai-models.config.ts with costPerImage: 0.10
2. In image-generation.service.ts: route TEAM/BROKERAGE plan to Nano Banana Pro
3. Remove all remaining Ideogram imports and API calls (Ideogram is now fully retired)
4. Remove Ideogram entries from ai-models.config.ts

Key constraint: 'nano-banana', 'gemini', 'pro' must NOT appear in any frontend payload or UI label.
Verify with: grep -r "ideogram" api/src/ --include="*.ts" → zero results after this story.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-004-01 | Manual | P0 | Generate infographic on TEAM plan → server logs show Nano Banana Pro call, NOT Ideogram | 🔲 | |
| TC-AI-004-02 | Auto | P0 | `grep -r "ideogram" api/src/ --include="*.ts"` returns zero results | 🔲 | |
| TC-AI-004-03 | Manual | P1 | Pro-tier image is visually higher quality/detail than Flash-tier equivalent | 🔲 | |

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
