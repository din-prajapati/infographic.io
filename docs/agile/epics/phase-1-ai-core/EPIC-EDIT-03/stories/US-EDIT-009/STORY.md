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

---

## Open Questions — decide before implementing

- [ ] **What happens to the real-photo text-free path?** ⚠️ **This is the one that changes scope.**

  `api/src/modules/ai-generation/services/infographic-prompt.builder.ts` has
  `buildTextFreeImagePrompt`, used **only** when `renderMode === 'editable'` **and** a photo
  reference is present. Its doc says why:

  > *"Baking headline/price/address onto the user's actual listing photo is undesirable when
  > Editable mode is active — the layout engine (US-AI-043) will overlay those values as live
  > canvas elements."*

  Remove `renderMode` naively and that path becomes unreachable. On real-photo generations the
  headline and price get **baked into the customer's own listing photograph**, and `layerize-text`
  has to lift them off afterwards — an endpoint `EPIC-INFRA-02`'s own notes describe as working
  *"best with clear, straight text in standard typography."*

  | Option | Trade |
  |---|---|
  | **A — Drive it from "photo present" instead of `renderMode`** ← recommended | Keeps the quality reason the path was built for, still removes the toggle. The condition becomes a fact about the request rather than a user preference. Slightly larger diff in the prompt builder. |
  | **B — Accept the loss** | One prompt path, simplest product. Real-photo designs depend entirely on extraction quality to become editable, on photographs where text is hardest to lift. |

  Option A is recommended because the toggle was never the *reason* for the text-free variant — it
  was only the signal that happened to carry it. `photoReference != null` is the real condition.

- [ ] **Does `US-AI-051` need reopening?** Its text-free generate-time path is currently reachable
      only through the toggle this story removes. Under Option A it survives with a new trigger;
      under Option B it is dead code and the story should be marked superseded rather than left
      claiming ✅.

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
| TC-EDIT-009-01 | Unit | P0 | `AIChatBox` renders no flat/editable control; `grep -c renderMode` is 0 in that file and `RightSidebar` | 🔲 | |
| TC-EDIT-009-02 | Unit | P0 | The generate request body contains no `renderMode` key | 🔲 | |
| TC-EDIT-009-03 | Unit | **P0** | regression: `CanvasEditToolbar` still reports editable state from the canvas alone — a freshly opened template with no AI content does **not** claim to be editable after an unrelated compose | 🔲 | |
| TC-EDIT-009-04 | Unit | P0 | `planVariationLoad` still returns `EDITABLE_REQUIRES_UPGRADE_REASON` for an unentitled plan | 🔲 | |
| TC-EDIT-009-05 | Unit | P1 | error-path: a request body still carrying `renderMode` is accepted and ignored, not 400'd | 🔲 | |
| TC-EDIT-009-06 | Unit | P1 | *(Option A only)* `buildTextFreeImagePrompt` is selected when a photo reference is present, with no `renderMode` involved | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked
- [ ] The Open Question above is **decided and recorded in this card**, not left open
- [ ] Gate 1 passes (`npm run check` + `npm run test:unit`)
- [ ] Gate 2 — visual check on staging: generate from AI Chat, confirm no mode choice appears, then
      press "Edit elements" on the placed image and confirm text extracts
- [ ] `US-AI-051` status reconciled per the second open question
- [ ] PR opened with story card as description
