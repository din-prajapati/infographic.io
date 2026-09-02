---
title: Story Card — US-EDIT-009
type: story
tags: [edit, canvas, ai-chat, cleanup]
updated: 2026-09-01
---

# Story Card — US-EDIT-009

> **Status:** 🟡 Implemented — Gate 1 green, Gate 2 (staging) pending
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

- [x] **AC1 [happy-path]:** The "Edit as: Flat / Editable" control is gone from
      `client/src/components/ai-chat/AIChatBox.tsx` (currently rendered at line 1461). Generating
      from AI Chat produces a flat image with no mode choice offered anywhere before generation.

- [x] **AC2 [happy-path]:** `renderMode` is absent from `client/src/components/ai-chat/AIChatBox.tsx`
      and `client/src/components/editor/RightSidebar.tsx` — no reads, no writes, no conditional
      branches on it. `grep -c renderMode` returns 0 for both files. *(Verified literally 0/0. The
      explanatory comments say "render-mode preference" rather than the identifier, so this stays
      a real check rather than one that only passes by intent.)*

- [x] **AC3 [happy-path]:** The client no longer sends `renderMode`: it is absent from the request
      body built in `client/src/lib/api.ts` and from `GenerateFromChatInput` in
      ~~`client/src/components/ai-chat/types.ts`~~ — **correction:** `GenerateFromChatInput` is
      declared in `api.ts`, not `types.ts`. `types.ts` held only a doc comment plus
      `Template.composedDesign`, now marked dormant (see Follow-ups). Also removed from the
      `useGenerationPrefs` store, which the AC did not name and which was the field's real home.

- [x] **AC4 [happy-path]:** ⚠️ **Satisfied except in the DTO, deliberately — AC4 and AC7 cannot
      both hold literally.** `main.ts` sets `forbidNonWhitelisted: true`, so an *undeclared*
      property is a 400. Deleting `renderMode` from
      `api/src/modules/infographics/dto/generate-from-chat.dto.ts` would therefore break every
      generate from a stale browser tab — exactly what AC7 forbids. It is kept as an ignored
      compatibility shim: untyped, unvalidated, omitted from Swagger, read by nothing, with a
      "remove once no deployed client sends it" note. Removed outright from
      `generations.controller.ts`, `generations.service.ts`, and the orchestrator's options type.

- [x] **AC5 [regression]:** `CanvasEditToolbar` is untouched — zero lines changed, verified by
      diff. ⚠️ **Its premise was wrong: it has no existing tests** (no React test harness exists
      in this project). Covered structurally instead by
      `client/src/hooks/__tests__/useGenerationPrefs.spec.ts`: the bug its comment warns about
      needed a session-global `renderMode` to OR in, and there is no longer such a field, so the
      failure mode is now structurally impossible rather than avoided by convention. The rendered
      behaviour still needs the Gate 2 staging check.

- [x] **AC6 [regression]:** ⚠️ **This AC was wrong as written and was not followed.**
      `loadVariation.ts` is unchanged, and that is the correct outcome. Its `renderMode` is a
      *function parameter*, not the session preference — `CanvasEditToolbar` passes it hardcoded
      as `'editable'`, which is the surviving post-placement path. "Updating it to the flat-only
      contract" would have broken the one path the story exists to preserve, and contradicted AC5
      and Out of Scope. All 9 existing assertions pass unchanged. `EDITABLE_REQUIRES_UPGRADE_REASON`
      plan-gating still works and now runs on the CanvasEditToolbar path, which surfaces it as a
      modal rather than a toast.

- [x] **AC7 [error-path]:** A generation request that still includes a `renderMode` field (an old
      client, a cached bundle) is accepted and ignored rather than rejected. Removing a field must
      not 400 a user mid-session on a stale tab. *(This is what forced AC4's exception — see above.)*

- [x] **AC8 [happy-path]:** *(the Option A decision, in code)* The text-free branch in
      `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` (`useTextFree`, currently
      lines 269–272) drops its `renderMode === 'editable' &&` clause and keeps the rest verbatim:
      `typeof photoReference === 'string' && photoReference.length > 0`. That empty-string guard is
      US-AI-051's own AC7 and must survive untouched. A real-photo generation therefore takes the
      text-free prompt with no mode involved; a synthetic (no-photo) generation still takes the
      composed text-baked prompt, exactly as `88db72d` established. The `buildTextFreeImagePrompt`
      doc comment in `infographic-prompt.builder.ts:284` is updated — it currently states the
      `renderMode` condition that is being removed.

- [x] **AC9 [regression]:** `client/src/components/ai-chat/AIChatBox.tsx` publishes its completed
      generation id to `useGenerationPrefs.activeGenerationId`, as `RightSidebar` already did.
      *(Added during implementation — a regression the original ACs would have shipped.)*

      Found by tracing the surviving path rather than by review. `setActiveGenerationId` was
      called in exactly one place — RightSidebar's *panel-triggered* WebSocket handler — so with
      AI Chat's own editable branch removed (AC1), every AI Chat design would answer *"Design
      isn't linked to a generation"* on "Edit elements". That toast already claimed the feature
      works "right after a Quick Generate or AI Chat result", which was untrue for AI Chat and
      merely didn't matter while AI Chat composed for itself.

      The stale case is worse than the empty one: a leftover id from an earlier Quick Generate
      would have composed the text of a design the user is no longer looking at.

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

> **Do not run `orion tc-rows --write` against this table.** Row IDs and the AC mapping came from
> it (9 rows, one per AC), but the Scenario column is hand-written: the generator emits the AC's
> truncated first line, which is not a testable scenario. It also assumes a 6-column table, so on
> this 7-column one it inserts a second header and shifts every cell one column left; and it drops
> the supplementary rows below, since it writes exactly one row per AC. It does preserve Status
> and Finding by TC ID. If it runs anyway, restore this section from git.

| TC ID | AC | Type | Priority | Scenario | Status | Finding |
|-------|:--:|------|:--------:|----------|:------:|---------|
| TC-EDIT-009-01 | AC1 | Static | P0 | `AIChatBox` renders no flat/editable control — both toggle blocks removed, no mode choice appears anywhere pre-generation | ⚠️ | Verified by diff + Gate 2, not by a test: no React test harness exists |
| TC-EDIT-009-02 | AC2 | Static | P0 | `grep -c renderMode` returns 0 for both `AIChatBox.tsx` and `RightSidebar.tsx` | ✅ | 0 and 0 |
| TC-EDIT-009-03 | AC3 | Static | P0 | the generate request body built in `api.ts` contains no `renderMode` key | ✅ | `GenerateFromChatInput` lives in `api.ts`, not `types.ts` as the AC said |
| TC-EDIT-009-04 | AC4 | Static | P0 | controller, service and orchestrator options type no longer declare `renderMode` | ⚠️ | Passes except the DTO shim, kept deliberately — see AC4 |
| TC-EDIT-009-05 | AC5 | Unit | **P0** | regression: a freshly opened template with no AI content does **not** claim to be editable after an unrelated compose succeeds | ⚠️ | `useGenerationPrefs.spec.ts` proves the *ingredient* is gone (no session-global renderMode to OR in). The rendered behaviour is **not** covered — needs Gate 2 |
| TC-EDIT-009-06 | AC6 | Unit | P0 | regression: `planVariationLoad` still returns `EDITABLE_REQUIRES_UPGRADE_REASON` for an unentitled plan | ✅ | All 9 pre-existing `loadVariation.spec.ts` assertions pass unchanged |
| TC-EDIT-009-07 | AC7 | Unit | P1 | error-path: a request body still carrying `renderMode` is accepted and ignored, not 400'd | ⚠️ | Implemented via the DTO shim; **no test asserts it** — see Follow-ups |
| TC-EDIT-009-08 | AC8 | Unit | P0 | `buildTextFreeImagePrompt` is selected when a photo reference is present, with no `renderMode` involved | ✅ | `ai-orchestrator.textfree-trigger.spec.ts`. **Mutation-checked:** disabling the condition makes it fail |
| TC-EDIT-009-09 | AC8 | Unit | P0 | regression: a synthetic (no-photo) generation still takes the composed text-baked prompt | ✅ | Passes. Does not discriminate under mutation — the branch is nested inside `if (photoReference)`, so a synthetic generation cannot reach it. A guard, not a proof |
| TC-EDIT-009-10 | AC8 | Unit | P1 | edge-case: `photoReference` present but empty-string still falls through to the composed prompt | ✅ | Passes, also non-discriminating: `if (photoReference)` at line 243 already excludes `''`, making US-AI-051's inner `length > 0` conjunct redundant. Kept — it fails if a refactor lifts the branch out of that nesting |
| TC-EDIT-009-11 | AC9 | Unit | P0 | the store still exposes `activeGenerationId` and round-trips it through its setter | ✅ | `useGenerationPrefs.spec.ts` |
| TC-EDIT-009-12 | AC9 | E2E | **P0** | an AI Chat generation (not Quick Generate) placed on the canvas → "Edit elements" extracts text rather than reporting *"Design isn't linked to a generation"* | 🔲 | **Gate 2.** The store test above proves the setter works, not that AI Chat calls it on the real completion path. This is the check that would have caught the AC9 regression |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

### Gate 2 — visual check (human; `automated: false` in PROJECT_CONTEXT.yaml)

Automated evidence stops short in two specific places, and these are the checks that close them.
Both need a real generation, so neither can be faked from a unit test.

Run on staging after merge (`main` auto-deploys), or locally with `npm run dev` — the local run
costs one real Ideogram generation.

| # | Step | Pass condition | Closes |
|:-:|------|----------------|--------|
| 1 | Open the editor, open AI Chat, and look before generating | **No "Edit as: Flat / Editable" control anywhere** — not above the input, not beside the results | TC-01 |
| 2 | Generate from AI Chat (no photo). Place a result with "Edit" | Design lands flat, no mode was ever asked for | AC1 |
| 3 | With that AI Chat design on the canvas, press **"Edit elements"** | Text extracts into editable layers. It must **not** say *"Design isn't linked to a generation"* | **TC-12 / AC9** — the regression found during implementation; the unit test proves the setter works, not that AI Chat calls it |
| 4 | Open a fresh template (no AI content) in the same session, after step 3 succeeded | "Edit elements" does **not** claim the canvas is editable | **TC-05** — the bug `CanvasEditToolbar`'s comment warns about |
| 5 | Upload a real listing photo and generate | Background comes back **unmarked** — no headline/price/address burned into the photo | **AC8 / T4a** — the one behaviour change that reaches existing users |

Step 5 is the one to look at hardest: it changes output for every real-photo generation, including
for users who never touched the old toggle.

### Follow-ups this story deliberately did not do

1. **`Template.composedDesign` is dormant.** Its only producer was AI Chat's editable branch
   (removed in T1); its consumer, `CenterCanvas.tsx:93`, is now unreachable. `CenterCanvas.tsx`
   is not in this story's file scope, so producer and consumer are not removed in the same change.
2. **`CanvasEditToolbar`'s comments** still describe `renderMode` as a live session preference.
   They are now historical. Untouched on purpose — AC5 and Out of Scope both say don't.
3. **No test covers AC7.** The DTO shim is exercised by nothing; an integration test posting a
   body with `renderMode` and asserting 200-not-400 would close it.
4. **The DTO shim should be deleted** once no deployed client sends `renderMode`.
5. **No React component test harness exists.** TC-01 and TC-05 are the two ACs that want one.
   Adding `@testing-library/react` is a project-level call, not this story's.

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
