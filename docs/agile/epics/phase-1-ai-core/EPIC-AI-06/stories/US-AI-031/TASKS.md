# PR Task List — US-AI-031

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai/m-17-real-photo-background`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** feat
> **Estimated total:** ~3h 30m

---

## Four Pillars Pre-flight (check before starting the AI session)

- [x] **Brain** — [STORY.md](./STORY.md) read: ACs written, out-of-scope listed, AI Implementation Prompt ready
- [x] **Muscle** — This TASKS.md: file list + ordered tasks + exact test commands below
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) reviewed (rewritten 2026-08-11 — the old json_prompt flow is dead)
- [x] **Env** — [ENV.yaml](../../ENV.yaml) loaded; `IDEOGRAM_API_KEY` present in local `.env`

> ⛽ **Credit status:** the Ideogram account is out of credit. T7's live checks are gated — implement and ship with them unticked rather than faking a pass.

---

## Required reading before T1

1. [SPIKE-031-ideogram-photo-background.md](../../SPIKE-031-ideogram-photo-background.md) — authoritative on endpoints, parameters and cost. Section 7 carries the file-level change list this breakdown is derived from.
2. [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) — where this story sits (composition plane only).

---

## PR Scope Summary

**One-liner:**
```
feat(ai): compose listing designs around the agent's real property photo — US-AI-031
```

---

## Task Breakdown

### T1 — Extract the photo-read helper and make it fail loudly
**File:** `api/src/modules/ai-generation/services/ideogram.service.ts`
**AC(s) covered:** AC4
**Estimate:** 30m

- [x] Add private `readSourcePhoto(photoPath, generationId?): Buffer` helper
- [x] Throws `HttpException(422)` when file is unreadable (replacing `catch { logGen(...'warn') }`)
- [x] Keeps `logGen` event names; adds new `image:reference:unreadable` error event
- [x] `PHOTO_UPLOADS_DIR` cross-reference comment added

**Commit:** `fix(ai): T1 fail loudly when a referenced photo is unreadable — US-AI-031`

---

### T2 — Remove the undocumented `style_reference_images` attach from the V4 generate path
**Files:** `api/src/modules/ai-generation/services/ideogram.service.ts`, `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`
**AC(s) covered:** AC7
**Estimate:** 15m

- [x] Deleted `style_reference_images` append from `generateImageV4` (undocumented on that endpoint)
- [x] Removed `photoReferencePath` parameter from `generateImageV4` signature
- [x] Comment recording why (spike, TC-AI-010-02 link)
- [x] Orchestrator call site updated (removed `photoReference` arg)

**Commit:** `fix(ai): T2 drop undocumented style_reference_images from the V4 generate call — US-AI-031`

---

### T3 — Add the remix capability
**File:** `api/src/modules/ai-generation/services/ideogram.service.ts`
**AC(s) covered:** AC1, AC2
**Estimate:** 60m

- [x] Added `IDEOGRAM_V4_REMIX_URL` constant
- [x] Added `REMIX_IMAGE_WEIGHT = 75` local constant (unverified pending OQ-2)
- [x] Added `composeWithSourceImage(prompt, photoPath, model, orientation, generationId)` method
- [x] Multipart: `image` + `text_prompt` + `image_weight` + `rendering_speed` + `resolution`
- [x] Decision trail comment: V4 over V3 (architecture owner decision 2026-08-11)

**Commit:** `feat(ai): T3 add source-image composition via the remix endpoint — US-AI-031`

---

### T4 — Branch the orchestrator on photo presence
**File:** `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`
**AC(s) covered:** AC1, AC2, AC3, AC4
**Estimate:** 45m

- [x] `HttpException` added to imports
- [x] Photo path branches at STEP-3/STEP-4 boundary: calls `composeWithSourceImage` per variation
- [x] Clean-typography instruction appended to remix prompt only (AC2)
- [x] No-photo path is byte-identical (AC3) — not refactored
- [x] Catch block preserves `HttpException` with user-visible message (AC4)
- [x] Cost accounting comment: remix = generate tier (cost-neutral)

**Commit:** `feat(ai): T4 route photo-backed generations through source-image composition — US-AI-031`

---

### T5 — Record remix cost with evidence
**Files:** `api/src/config/ai-models.config.ts`, `api/src/config/image-generation.config.ts`
**AC(s) covered:** AC6
**Estimate:** 25m

- [x] `REMIX_COST_PER_IMAGE` exported with evidence comment + source URL
- [x] Instructional Edit rejection documented ($0.20 flat, 150% of TEAM at cap)
- [x] `REMIX_RENDERING_SPEED` map exported from `image-generation.config.ts`
- [x] `REMIX_IMAGE_WEIGHT = 75` exported with unverified/OQ-2 comment

**Commit:** `docs(ai): T5 record remix pricing and the rejected edit-path economics — US-AI-031`

---

### T6 — Validate `photoReference` (security)
**Files:** `api/src/modules/infographics/dto/generate-from-chat.dto.ts`, `api/src/modules/infographics/services/generations.service.ts`
**AC(s) covered:** AC5, AC4
**Estimate:** 20m

- [x] `@Matches(/^[0-9a-f]{8}-...\.(jpg|jpeg|png)$/i)` added to `photoReference` field
- [x] `Matches` added to class-validator imports
- [x] `HttpException` added to generations.service.ts imports
- [x] Photo-unreadable error detected and surfaced distinctly in background task catch

**Commit:** `fix(security): T6 validate photoReference against path traversal — US-AI-031`

---

### T7 — Tests
**Files:** `api/tests/ai-generation/ideogram.service.spec.ts` *(new)*, `api/tests/ai-generation/infographic-prompt.builder.spec.ts`
**AC(s) covered:** AC1, AC2, AC3, AC4, AC5, AC7
**Estimate:** 55m

- [x] New spec `ideogram.service.spec.ts` (20 tests)
  - TC-AI-031-02: photo unreadable → HttpException(422), no HTTP call
  - TC-AI-031-04: `../../etc/passwd` rejected by DTO validation
  - TC-AI-031-05: `generateImageV4` sends no `style_reference_images`
  - TC-AI-031-06: remix prompt receives clean-typography instruction
  - Orchestrator routing: photo path → remix; no-photo path → V4 json_prompt
- [x] AC3 guard block added to `infographic-prompt.builder.spec.ts` (3 new tests)
- [x] All 23 pre-existing builder tests pass unchanged

**Commit:** `test(ai): T7 cover source-image composition, hard-fail and traversal guard — US-AI-031`

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `api/src/modules/ai-generation/services/ideogram.service.ts` | T1, T2, T3 | AC1, AC2, AC4, AC7 | Core. Do not rename the file — see Model portability |
| `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` | T2, T4 | AC1–AC4 | No-photo branch must stay byte-identical |
| `api/src/config/ai-models.config.ts` | T5 | AC6 | Cite the source URL |
| `api/src/config/image-generation.config.ts` | T5 | AC2 | `image_weight` is unverified pending live test |
| `api/src/modules/infographics/dto/generate-from-chat.dto.ts` | T6 | AC5 | Live path-traversal fix |
| `api/src/modules/infographics/services/generations.service.ts` | T6 | AC4 | Error surfacing only |
| `api/tests/ai-generation/ideogram.service.spec.ts` | T7 | AC1, AC2, AC4, AC7 | New file |
| `api/tests/ai-generation/infographic-prompt.builder.spec.ts` | T7 | AC3 | 23 existing tests + 3 new AC3 guard tests |

---

## Verification (Gate 1 — mandatory)

```bash
npm run check                                              # TypeScript
cd api && npx vitest run --config vitest.config.ts         # unit tests
cd api && npx vitest run tests/ai-generation/ --reporter=verbose   # this story's surface
```

**Gate 1 result (2026-08-11):**
- `npm run check`: ✅ 0 errors
- `npx vitest run --config vitest.config.ts`: ✅ 213 tests, 18 files, all pass
- `npx vitest run tests/ai-generation/`: ✅ 77 tests, 3 files, all pass
  - Pre-existing `infographic-prompt.builder.spec.ts`: 33 tests (23 original + 3 AC3 guard + 7 pre-existing formatters) ✅
  - New `ideogram.service.spec.ts`: 17 tests ✅
  - Existing `locale.spec.ts`: 27 tests ✅

⛽ **Gated — cannot run until Ideogram credit is topped up:** TC-AI-031-01 and TC-AI-031-07. AC1 left unchecked.

---

## Out of Scope reminder

Do **not** implement durable photo storage, layer extraction, canonical text rendering, the editable canvas, or a variation-count change. Each is tracked elsewhere; see STORY.md → Out of Scope.
