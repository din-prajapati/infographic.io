# PR Task List — US-GEN-001

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `fix/ai-ideogram-v4-text-quality`
> **PR:** pending
> **Type:** fix
> **Status:** 🟡 Implemented — PR pending

---

## PR Scope Summary

**One-liner:** Fix garbled V4 text by adopting Ideogram's magic-prompt reference flow with a conservative verify/repair layer; restructure generation into a modular, cost-transparent pipeline.
```
fix(ai): V4 magic-prompt pipeline — verified exact text, modular prompt builder — US-GEN-001
```

---

## Task Breakdown

### T1 — Prompt builder module (NEW)
**File:** `api/src/modules/ai-generation/services/infographic-prompt.builder.ts`
**AC(s):** AC1, AC3, AC6
- `buildImagePrompt` (canonical text prompt, all models), `buildExpectedTexts`, `verifyAndRepairV4JsonPrompt` (conservative: verify → targeted overwrite → append), `applyStylePreset`, `getVariationModifier`, formatting helpers moved from openai.service
- `realAgentName()` guard: literal "Agent" placeholder treated as absent

### T2 — Ideogram service V4 flow
**File:** `api/src/modules/ai-generation/services/ideogram.service.ts`
**AC(s):** AC2, AC4
- `convertTextPromptToV4Json()` — 💰 magic-prompt-v4 call (JSON body, verified live)
- `generateImageV4(jsonPrompt, model, …)` — `V4_RENDERING_SPEED` map replaces hardcoded TURBO
- V2/V3 `generateImage` unchanged (V3 speed: turbo→TURBO else DEFAULT)

### T3 — Orchestrator pipeline restructure
**File:** `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`
**AC(s):** AC2, AC5, AC7
- Numbered STEP comments with FREE/💰 markers; headline skip for user-typed headlines (merged with Gemini tier routing from PR #9/#10)
- V4: convert → verify/repair (logs `v4:jsonprompt:repaired` on drift) → generate; conversion failure → `v4:magicprompt:fallback-v3` → V3 text path
- Private `applyStylePreset`/`getVariationModifier` removed (moved to builder)

### T4 — LLM-only openai.service
**File:** `api/src/modules/ai-generation/services/openai.service.ts`
**AC(s):** AC7
- `buildV4JsonPrompt` (root cause) deleted; `generateImagePrompt` + helpers moved to builder; header comment: every method = 💰 paid call

### T5 — Queue processor + cost config
**Files:** `infographic.processor.ts`, `api/src/config/ai-models.config.ts`
**AC(s):** AC7, AC8
- Processor uses `buildImagePrompt` from builder
- `V4_MAGIC_PROMPT_COST = 0` documented with invoice-verification TODO

### T6 — Carried WIP (same branch)
**Files:** `image-generation.config.ts`, `generate-from-chat.dto.ts`, `generations.service/controller.ts`, `PropertyDetailsForm.tsx`, `usePropertyStore.ts`, `AIChatBox.tsx`, `api.ts`
- V3/V4 model aliases + aspect formats; optional user `headline` field end-to-end (skips headline LLM call)

---

## Exact Test Commands

```bash
npm run check          # ✅
cd api && npx vitest run --config vitest.config.ts   # ✅ 41/41
# E2E (done 2026-07-03): register → POST /api/v1/infographics/generations → completed, exact text
```

## Task Checklist

- [x] T1–T6 implemented
- [x] `npm run check` ✅ · unit tests 41/41 ✅
- [x] E2E app verification ✅ (`APP-TEST-e2e-result.png`)
- [x] Live magic-prompt JSON-body call verified (HTTP 200)
- [ ] PR opened with story card as description
- [ ] STORY.md AC10 checked after merge

---

*Tasks created: 2026-07-03*
