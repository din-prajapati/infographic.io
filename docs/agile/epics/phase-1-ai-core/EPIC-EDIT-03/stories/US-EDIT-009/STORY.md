---
title: Story Card — US-EDIT-009
type: story
tags: [edit, canvas, ai-chat, cleanup]
updated: 2026-09-01
---

# Story Card — US-EDIT-009

> **Status:** 🔲 Not Started
> **Feature:** F-EDIT-01 — Editable design discoverability
> **Epic:** [EPIC-EDIT-03](../../EPIC.md)
> **Milestone:** [M-EDIT-03-single-editable-path](../../milestones/M-EDIT-03-single-editable-path.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Created:** 2026-09-01 | **Closed:** —
>
> **Decision this implements (2026-09-01):** generation is **always flat**; extracting text into
> editable layers is **always** a post-placement canvas action.

---

## Story

*As* an agent generating a design
*I want* one way to get editable text, taken on the canvas after I can see the image
*So that* I am not asked to predict, before anything exists, whether I will later want to edit the text — a choice I have no basis to make at that moment and cannot change afterwards without regenerating

---

## Context — why there are two surfaces today

`M-EDIT-01` shipped `CanvasEditToolbar`: press "Edit elements" on a placed image and its text is
extracted into live canvas elements. It deliberately reads **only** the canvas, never `renderMode` —
its own comment records why:

> *"ORing it in here made every canvas in the session claim to be editable once any compose had
> succeeded — including a freshly opened template holding no AI content at all."*

The older surface was never removed. `AIChatBox.tsx:1461` still renders a "Flat / Editable" toggle,
and `renderMode` still steers generation at lines 852 / 1153 / 1168. So the same capability is
offered twice, at two moments, with the earlier one requiring a prediction.

`renderMode` currently spans **14 files** across client and API.

---

## Acceptance Criteria

> **Rule:** ACs are file-specific and binary.

- [ ] **AC1 [happy-path]:** The "Edit as: Flat / Editable" control is gone from
      `client/src/components/ai-chat/AIChatBox.tsx` (currently rendered at line 1461). Generating
      from AI Chat produces a flat image with no mode choice offered anywhere before generation.

- [ ] **AC2 [happy-path]:** `renderMode` is absent from `client/src/components/ai-chat/AIChatBox.tsx`
      and `client/src/components/editor/RightSidebar.tsx` — no reads, no writes, no conditional
      branches on it. `grep -c renderMode` returns 0 for both files.

- [ ] **AC3 [happy-path]:** The client no longer sends `renderMode`: it is absent from the request
      body built in `client/src/lib/api.ts` and from `GenerateFromChatInput` in
      `client/src/components/ai-chat/types.ts`.

- [ ] **AC4 [happy-path]:** The server no longer accepts it: `renderMode` is removed from
      `api/src/modules/infographics/dto/generate-from-chat.dto.ts`,
      `generations.controller.ts`, `generations.service.ts`, and `ai-orchestrator.service.ts`'s
      options type. A field nothing populates is worse than no field — it reads as configurable.

- [ ] **AC5 [regression]:** `CanvasEditToolbar` behaves exactly as before. Its existing tests pass
      unchanged, and it still derives its state from the canvas alone (`hasExtractedLayers`,
      `activeGenerationId`) — this story must not "tidy" that logic while nearby code is being
      removed. The bug its comment describes is easy to reintroduce.

- [ ] **AC6 [regression]:** `client/src/lib/layout/loadVariation.ts` and its 9 existing
      `renderMode` test assertions are updated to the flat-only contract without weakening what
      they check. `planVariationLoad`'s `EDITABLE_REQUIRES_UPGRADE_REASON` path — the plan-gating
      behaviour — still works: entitlement is unrelated to how the mode is chosen.

- [ ] **AC7 [error-path]:** A generation request that still includes a `renderMode` field (an old
      client, a cached bundle) is accepted and ignored rather than rejected. Removing a field must
      not 400 a user mid-session on a stale tab.

- [ ] **AC8 [happy-path]:** *(the Option A decision, in code)* The text-free branch in
      `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` (`useTextFree`, currently
      lines 269–272) drops its `renderMode === 'editable' &&` clause and keeps the rest verbatim:
      `typeof photoReference === 'string' && photoReference.length > 0`. That empty-string guard is
      US-AI-051's own AC7 and must survive untouched. A real-photo generation therefore takes the
      text-free prompt with no mode involved; a synthetic (no-photo) generation still takes the
      composed text-baked prompt, exactly as `88db72d` established. The `buildTextFreeImagePrompt`
      doc comment in `infographic-prompt.builder.ts:284` is updated — it currently states the
      `renderMode` condition that is being removed.

---

## Decisions — settled 2026-09-01

- [x] **The real-photo text-free path survives. → Option A.**

  `api/src/modules/ai-generation/services/infographic-prompt.builder.ts` has
  `buildTextFreeImagePrompt`, used today **only** when `renderMode === 'editable'` **and** a photo
  reference is present. Its doc says why:

  > *"Baking headline/price/address onto the user's actual listing photo is undesirable when
  > Editable mode is active — the layout engine (US-AI-043) will overlay those values as live
  > canvas elements."*

  **Decision: re-trigger it from `photoReference != null` alone.** The toggle was never the
  *reason* for the text-free variant — it was only the signal that happened to carry it. The real
  condition is a fact about the request, not a user preference, so it belongs in the code rather
  than in a question put to the user.

  Rejected alternative — accept the loss (one prompt path, simplest product): on real-photo
  generations the headline and price would get baked into the customer's own listing photograph,
  leaving `layerize-text` to lift them back off. `EPIC-INFRA-02`'s notes describe that endpoint as
  working *"best with clear, straight text in standard typography"* — a photograph is its hardest
  case, and it is the customer's own asset being marked up.

  **Implementation consequence:** the condition inverts cleanly — where the builder reads
  `renderMode === 'editable' && photoReference`, it reads `photoReference != null`. Synthetic
  (no-photo) generations are unaffected and keep producing text-baked images for extraction to
  detect, exactly as `88db72d` established. See AC8 and TC-EDIT-009-06.

- [x] **`US-AI-051` is not reopened and not superseded.** Under Option A its behaviour survives
      with a new trigger, so its ACs stay truthfully ✅. AC8 below is the one that keeps that true;
      the flag on that card is cleared when this story closes.

---

## Out of Scope

- **Any change to `CanvasEditToolbar`'s behaviour.** It is already correct under the flat-only
  decision. See AC5.
- **The editable-credit metering** (`US-LAUNCH-015`) — how extraction is *charged* is unrelated to
  how it is *triggered*.
- **Brand layers** (`M-EDIT-02`, US-EDIT-006/007).
- **Reviving `feat/ai/editable-layers-toolbar`.** Deleted 2026-09-01; see the milestone's note.

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
> Row IDs and AC mapping are generated by `orion tc-rows`. Scenario text is hand-written —
> the generator truncates the AC's first line, which is not a testable scenario. **If you re-run
> `harden`, this column is regenerated and these scenarios are lost** (the CLI preserves Status
> and Finding by TC ID, but not Scenario). Restore from git if that happens.

| TC ID | AC | Type | Priority | Scenario | Status | Finding |
|-------|:--:|------|:--------:|----------|:------:|---------|
| TC-EDIT-009-01 | AC1 | Unit | P0 | `AIChatBox` renders no flat/editable control — the toggle at line 1461 is gone and no mode choice appears anywhere pre-generation | 🔲 | |
| TC-EDIT-009-02 | AC2 | Unit | P0 | `grep -c renderMode` returns 0 for both `AIChatBox.tsx` and `RightSidebar.tsx` | 🔲 | |
| TC-EDIT-009-03 | AC3 | Unit | P0 | the generate request body built in `api.ts` contains no `renderMode` key, and `GenerateFromChatInput` has no such field | 🔲 | |
| TC-EDIT-009-04 | AC4 | Unit | P0 | the DTO, controller, service and orchestrator options type no longer declare `renderMode` | 🔲 | |
| TC-EDIT-009-05 | AC5 | Unit | **P0** | regression — **the one that matters:** `CanvasEditToolbar` still reports editable state from the canvas alone; a freshly opened template with no AI content does **not** claim to be editable after an unrelated compose succeeds | 🔲 | |
| TC-EDIT-009-06 | AC6 | Unit | P0 | regression: `planVariationLoad` still returns `EDITABLE_REQUIRES_UPGRADE_REASON` for an unentitled plan — plan gating is independent of how the mode was chosen | 🔲 | |
| TC-EDIT-009-07 | AC7 | Unit | P1 | error-path: a request body still carrying `renderMode` (stale tab, cached bundle) is accepted and ignored, not 400'd | 🔲 | |
| TC-EDIT-009-08 | AC8 | Unit | P0 | `buildTextFreeImagePrompt` is selected when a photo reference is present, with no `renderMode` involved | 🔲 | |
| TC-EDIT-009-09 | AC8 | Unit | P0 | regression: a synthetic (no-photo) generation still takes the composed text-baked prompt — the `88db72d` extraction path is unchanged | 🔲 | |
| TC-EDIT-009-10 | AC8 | Unit | P1 | edge-case: `photoReference` present but empty-string still falls through to the composed prompt — US-AI-051's AC7 guard survives | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

> **TC-09 and TC-10 are hand-added** beyond the generator's one-row-per-AC output. AC8 changes a
> three-conjunct branch condition; one row cannot cover entering it, not entering it, and the
> empty-string guard that must survive. `tc-rows --write` will drop them on a re-run.

---

## Definition of Done

- [ ] All ACs checked
- [x] The scope question is **decided and recorded in this card** — Option A, 2026-09-01
- [ ] Gate 1 passes (`npm run check` + `npm run test:unit`)
- [ ] Gate 2 — visual check on staging: generate from AI Chat, confirm no mode choice appears, then
      press "Edit elements" on the placed image and confirm text extracts
- [ ] `US-AI-051` stays ✅ and its "Reachability at risk" banner is removed (Option A preserved it)
- [ ] PR opened with story card as description
