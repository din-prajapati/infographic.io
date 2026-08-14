# Story Card — US-AI-051

> **Status:** ✅ All ACs Verified — Gate 1 Green (pre-PR)
> **Feature:** F-AI-06-10 — Text-free background generation (M-AI-18's original design intent)
> **Epic:** [EPIC-AI-06](../../EPIC.md)
> **Milestone:** [M-AI-18-editable-text-overlay](../../milestones/M-AI-18-editable-text-overlay.md)
> **Size:** M
> **Depends on:** extraction-led editable path (`88db72d`) working as the default — this story is the *photo-flow* complement, not a replacement
> **Linear:** LIN-XXX
> **Created:** 2026-08-13 | **Closed:** —

---

## Why this story exists

`renderMode` reaches the backend in `generate-from-chat.dto.ts` (`renderMode?: 'flat' | 'editable'`) but nothing on the server reads it — every generation, regardless of mode, produces the same fully-composed image with text baked in. This was fine once extraction started working (2026-08-13 fix): a composed image *with* text is exactly what layerize needs to detect blocks. It only becomes a problem for **EPIC-AI-06's real-photo flow (M-AI-17/US-AI-031)** — a listing photo used as the background. There, baking marketing text onto the user's actual photo is undesirable regardless of whether it's later editable; the original M-AI-18 intent (text-free background + overlay) still applies specifically to that path.

This story scopes the fix narrowly: read `renderMode` only where it changes anything real — the prompt sent for the photo-composition path — rather than reopening the ordering decision made in `88db72d`.

---

## Story

*As a* solo real estate agent uploading a real listing photo
*I want* the AI-composed background to omit text when I've chosen Editable mode
*So that* my actual property photo isn't permanently marked up with text I'm about to move/replace anyway.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When `renderMode='editable'` AND a photo reference is present (the `composeWithSourceImage` / real-photo path), the prompt sent to Ideogram omits headline/price/address copy — a text-free prompt variant, distinct from the existing composed prompt.
- [x] **AC2 [regression]:** When `renderMode='flat'` (or absent), behaviour is **byte-for-byte unchanged** — the existing composed (text-baked) prompt path is untouched. Regression-tested by diffing the prompt builder's output for `renderMode: undefined`.
- [x] **AC3 [regression]:** When `renderMode='editable'` and there is **no** photo reference (the synthetic/Quick-Generate path this session verified), behaviour is unchanged — text-free generation is scoped to the real-photo flow only; the standard flow keeps generating text-baked images for extraction to detect (per `88db72d`'s finding that this is the higher-fidelity path).
- [x] **AC4 [happy-path]:** With a text-free background, `composeDesignForEdit` naturally returns `blocksDetected: 0` (nothing to extract) — verify `planVariationLoad` falls through correctly to `composeFromCanonicalValues` (the layout-engine path), not to a blank canvas.
- [x] **AC5 [happy-path]:** Live verify: upload a real photo, generate with Editable selected, confirm the resulting editable canvas shows the *unmarked* photo as background with text elements from the layout engine, not extraction.
- [x] **AC6 [error-path]:** Given the text-free prompt builder in `infographic-prompt.builder.ts` throws or returns an empty/invalid prompt string, when `ai-orchestrator.service.ts` invokes it for the `renderMode='editable'` + photo-reference path, then the orchestrator catches the failure and falls back to building the existing composed (text-baked) prompt rather than letting the generation request fail outright.
- [x] **AC7 [edge-case]:** Given `renderMode` arrives as an unexpected/malformed value (anything other than `'flat'`, `'editable'`, or `undefined`) or a photo reference that is present but falsy/empty-string, when `ai-orchestrator.service.ts` evaluates the branch condition guarding the text-free prompt path, then the condition is treated as not satisfied and the existing composed (text-baked) prompt build in `infographic-prompt.builder.ts` runs unchanged.

---

## Out of Scope

- **Changing the ordering/precedence decided in `88db72d`** — extraction still leads whenever it detects blocks; this story only removes blocks from one specific generation path.
- **Backfilling this for already-generated infographics** — applies to new generations only.
- **Any change to the synthetic (no-photo) Quick Generate flow** — AC3 makes that explicit.
- **UI copy explaining the difference to the user** — if needed, a follow-up DESIGN-domain story.

---

## Engineering / PR

- **Branch:** `feat/ai/us-ai-051-textfree-photo-background`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/ai-generation/services/infographic-prompt.builder.ts` — text-free variant (already noted in EPIC.md as "text-free prompt variant" under Architecture Notes — confirm current state, may be partially scaffolded)
  - `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` — route `renderMode` + photo-reference presence to the right prompt builder call
  - `api/src/modules/infographics/dto/generate-from-chat.dto.ts` — confirm `renderMode` already threaded to orchestrator (TBC — may just need reading, not adding)
  - `api/tests/ai-generation/infographic-prompt.builder.spec.ts` — new cases for the text-free variant

---

## AI Implementation Prompt

```
Context: InfographicAI — see CLAUDE.md. Read this STORY.md + TASKS.md and
EPIC-AI-06/EPIC.md's 2026-08-13 log entry for what's already proven working.

Story: US-AI-051 — Text-free background prompt for the real-photo + editable combination

Trace how renderMode currently flows from generate-from-chat.dto.ts through to
ai-orchestrator.service.ts's composeWithSourceImage call. It is read into the DTO
but not consulted before prompt-building. Add a text-free prompt path in
infographic-prompt.builder.ts, used ONLY when renderMode==='editable' AND a photo
reference is present. Every other combination must produce byte-identical prompts
to today (write the regression test FIRST, from AC2, before touching the builder).

Rules: only listed files; out-of-scope is law; tests ship with their task's commit;
runtime-first — trace the actual call chain before writing code (this codebase has
a documented history of stories that looked complete but were never wired — see
US-AI-047's log entry).
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-051-01 | Auto | P0 | renderMode='editable' + photo present → prompt omits headline/price/address text (AC1) | ✅ Pass | `api/tests/ai-generation/infographic-prompt.builder.spec.ts` |
| TC-AI-051-02 | Auto | P0 | renderMode=undefined → prompt byte-identical to pre-story baseline (AC2, regression) | ✅ Pass | `api/tests/ai-generation/infographic-prompt.builder.spec.ts` |
| TC-AI-051-03 | Auto | P0 | renderMode='editable', no photo → prompt unchanged from today (AC3) | ✅ Pass | `api/tests/ai-generation/infographic-prompt.builder.spec.ts` |
| TC-AI-051-04 | Auto | P1 | Text-free background → compose returns blocksDetected:0 → planVariationLoad falls to layout-engine path, not blank (AC4) | ✅ Pass | `client/src/lib/layout/__tests__/loadVariation.spec.ts` |
| TC-AI-051-05 | E2E | P1 | Live: real photo + Editable → canvas shows unmarked photo + layout-engine text elements (AC5) | ✅ Pass | `e2e/us-ai-051-textfree-photo-background.spec.ts` — live run 2026-08-14: `blocksDetected:0` confirmed, layout-engine canvas elements present. Found and fixed a real bug en route (see EPIC.md log): editable mode was unreachable from AI Chat's actual render path — `onEditVariation` and the render-mode toggle only existed in a branch (`hasActiveConversation===false`) that can never show results in practice |
| TC-AI-051-06 | Auto | P0 | error-path: text-free prompt builder failure in infographic-prompt.builder.ts falls back to composed prompt via ai-orchestrator.service.ts, request does not fail (AC6) | ✅ Pass | `api/tests/ai-generation/ai-orchestrator.textfree-fallback.spec.ts` — buildTextFreeImagePrompt mocked to throw; asserts generateInfographic resolves, composeWithSourceImage receives buildImagePrompt's composed output, and the infographic record is persisted as completed |
| TC-AI-051-07 | Auto | P1 | edge-case: malformed renderMode value or falsy/empty-string photo reference is treated as not satisfying the text-free branch condition, composed prompt unchanged (AC7) | ✅ Pass | `api/tests/ai-generation/infographic-prompt.builder.spec.ts` |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ · test cases recorded · Gate 1 green
- [ ] EPIC-AI-06 M-AI-17/18 re-scope note (open since 2026-08-12) addressed or explicitly deferred with reason
