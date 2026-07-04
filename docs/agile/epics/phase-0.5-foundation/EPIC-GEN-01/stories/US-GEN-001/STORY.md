# US-GEN-001 — V4 Magic-Prompt Pipeline: Modular Restructure with Verified Exact Text

> **Epic:** [EPIC-GEN-01](../../EPIC.md) · **Milestone:** [M-GEN-01](../../milestones/M-GEN-01-v4-magic-prompt-pipeline.md)
> **Size:** L · **Status:** 🟡 Implemented — PR pending
> **Branch:** `fix/ai-ideogram-v4-text-quality`

---

## Story

As a **real estate agent generating an infographic**, I want **every text element (headline, price, address, stats, agent) rendered exactly and legibly**, so that **I can publish the output without proofreading pixel text or risking a wrong price on my marketing**.

## Problem & Evidence

V4 generations produced garbled pseudo-text. A 4-image isolation experiment ([docs/testing/reports/ideogram-v4-experiment-2026-07-03/](../../../../../testing/reports/ideogram-v4-experiment-2026-07-03/SUMMARY.md)) proved:
- E1/E2: our hand-built sparse `json_prompt` caused the model to invent filler panels of garbled text — at BOTH Turbo and Default speeds (speed was not the cause)
- E3: Ideogram's own flow (text prompt → `magic-prompt-v4` → generate) was flawless
- E4: blanket post-conversion text replacement corrupts faithful conversions — repair must be conservative

## Acceptance Criteria

- [x] **AC1** — New pure-function module `infographic-prompt.builder.ts` is the single source of prompt text for all model families (V2/V3/V4); no AI calls inside
- [x] **AC2** — V4 generations route: `buildImagePrompt` → `magic-prompt-v4` conversion → `verifyAndRepairV4JsonPrompt` → `generate-v4`
- [x] **AC3** — `verifyAndRepairV4JsonPrompt` leaves faithful conversions untouched; repairs only missing/drifted values (targeted overwrite or append)
- [x] **AC4** — `rendering_speed` maps from the user's model tier (`ideogram-4-turbo→TURBO`, `ideogram-4→DEFAULT`, `ideogram-4-quality→QUALITY`); never hardcoded
- [x] **AC5** — V4 conversion failure falls back to the proven V3 text path instead of failing the generation
- [x] **AC6** — Placeholder agent name ("Agent") never rendered onto the image
- [x] **AC7** — Every 💰 AI-call site marked in code comments (headline LLM, magic-prompt, image generation); `openai.service.ts` contains only paid LLM calls
- [x] **AC8** — V2/V3 text-prompt paths unchanged in behavior
- [x] **AC9** — E2E: app generation renders all strings exactly with zero invented panels
      ✅ Verified 2026-07-03 — generation `cmr515lmh0006gp10cg3sphwi`: 34.3s, $0.064, zero repairs, `APP-TEST-e2e-result.png`
- [ ] **AC10** — PR merged with story card as description

## Out of Scope

- Unit tests for the builder module (US-GEN-002)
- Real listing photos as background (EPIC-AI-06)
- Preview/finalize variation cost flow (US-KIT-003)
- Frontend model-picker changes
- `V4_MAGIC_PROMPT_COST` invoice verification (epic-level DoD)

## Test Notes

```bash
npm run check                 # ✅ passes
cd api && npx vitest run      # ✅ 41/41
# E2E: POST /api/v1/infographics/generations with chat prompt → completed → image has exact text
```

---

*Created: 2026-07-03 · Session log: [docs/research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md](../../../../../research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md)*
