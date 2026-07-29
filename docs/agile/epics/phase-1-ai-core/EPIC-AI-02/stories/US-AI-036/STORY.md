# Story Card — US-AI-036

> **Status:** 🔲 Not Started
> **Feature:** F-AI-02-05 — Canvas-aware generation orientation
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-06-photo-and-format](../../milestones/M-AI-06-photo-and-format.md)
> **Size:** M (~5h)
> **Replaces:** [US-AI-011](../US-AI-011/STORY.md) (superseded — see its STORY.md)
> **Linear:** LIN-US-AI-036
> **Created:** 2026-07-29 | **Closed:** —

---

## Story

*As a* real estate agent who has a template or design already open
*I want* AI generation to respect the canvas I'm already working in
*So that* my chosen format (e.g. an Instagram Story canvas) isn't silently discarded when I generate

---

## Background

Confirmed by reading the code directly (not assumed): **Quick Generate hardcodes `orientation: "landscape"`** in `RightSidebar.tsx`'s `handleGenerate()`, regardless of what canvas is open. Separately, **`loadAiVariationToCanvas()` always resizes/replaces the entire canvas** to match the generated image's own orientation, via `AI_ARTBOARDS[orientation]`, with no awareness of whatever template canvas was already active. Concrete repro: open the "Instagram Story" premium template (1080×1920) → Quick Generate → generates landscape anyway → "Use This Design" → the Story canvas is gone, replaced by a new 1280×720 landscape canvas.

This story makes generation orientation follow the *already-open* canvas, and makes "Use This Design" insert into that canvas instead of replacing it — without touching the Format Picker or template-saving work (separate stories, see Out of Scope).

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** When a canvas is active, Quick Generate (`RightSidebar.tsx`) derives orientation from the canvas's current `canvasWidth`/`canvasHeight` (nearest of `landscape`/`portrait`/`square`) instead of the hardcoded `"landscape"` value.
- [ ] **AC2 [happy-path]:** AI Chat's orientation picker (`AIChatBox.tsx`) defaults to the active canvas's derived orientation when the panel opens; the user can still manually override it per generation, same as today.
- [ ] **AC3 [happy-path]:** When "Use This Design" is clicked and the active canvas has a deliberate origin (`templateId` present, or `type === 'template'`), the generated image is inserted as a new image layer sized to fit within the *existing* canvas dimensions (`objectFit: 'contain'`) — the canvas itself is not resized or replaced.
- [ ] **AC4 [edge-case]:** When there is no deliberate origin (a true blank/default canvas with no `templateId`), "Use This Design" keeps today's behavior unchanged — auto-sizing a new artboard via `resolveAiArtboard()`.
- [ ] **AC5 [error-path]:** If the active canvas's `canvasWidth`/`canvasHeight` are missing, zero, or otherwise malformed, orientation derivation falls back to `DEFAULT_ORIENTATION` ('landscape') rather than throwing or producing a broken generation request.
- [ ] **AC6 [regression]:** `npm run check` and `npm run test:unit` pass. Existing manual-override behavior in the AI Chat orientation picker continues to work exactly as before this change.

---

## Out of Scope

- The Format Picker / unified New Design / New Template entry flow (**US-AI-038**)
- Save-as-Template and the personal template library (**US-AI-037**)
- Adding new generation-time aspect ratios beyond the existing three `AI_ARTBOARDS` buckets (landscape/portrait/square) — this story maps whatever canvas is open onto those three buckets, it doesn't expand them
- Any change to the backend generation endpoint, DTO, or Ideogram service — this is a frontend-only fix; `orientation` is already a valid, working param end-to-end

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-036-canvas-aware-orientation`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/editor/RightSidebar.tsx` (`handleGenerate` — derive orientation instead of hardcoding it)
  - `client/src/components/ai-chat/AIChatBox.tsx` (orientation picker default value)
  - `client/src/lib/canvasState.ts` (`loadAiVariationToCanvas` — add insert-as-layer path; new helper to derive orientation from active `canvasWidth`/`canvasHeight`)
  - `client/src/store/canvasStore.ts` *(verify exact filename/path at implementation start — wherever the active canvas's `canvasWidth`/`canvasHeight`/`templateId`/`type` origin is currently exposed to components)*

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: Buildographic (React + NestJS). See CLAUDE.md.

Story: US-AI-036 — Canvas-aware generation orientation

Two independent bugs to fix, both confirmed by reading the code:

1. client/src/components/editor/RightSidebar.tsx's handleGenerate() hardcodes
   orientation: "landscape" in the generationsApi.generate() call. Replace with a
   derived value from the active canvas's canvasWidth/canvasHeight, using the same
   landscape/portrait/square bucketing that AI_ARTBOARDS and resolveAiArtboard()
   in canvasState.ts already use for images. Write a small pure helper
   (e.g. deriveOrientationFromCanvas(width, height)) and reuse it in both
   RightSidebar.tsx and AIChatBox.tsx's orientation-picker default.

2. client/src/lib/canvasState.ts's loadAiVariationToCanvas() always creates/replaces
   the canvas via AI_ARTBOARDS[orientation]. Add a branch: if the currently active
   canvas has a deliberate origin (templateId present, or type === 'template' —
   find exactly where this is tracked in the canvas store), insert the generated
   image as a new ImageElement sized to fit inside the EXISTING canvasWidth/Height
   (objectFit: 'contain', centered) instead of replacing the canvas. Otherwise
   (no deliberate origin — true blank slate), keep today's auto-resize behavior
   exactly as it is now.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope"
- The existing AI Chat manual orientation override must keep working — this story
  only changes the DEFAULT, not the user's ability to pick a different one
- When done: list files changed, ACs checked, test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-036-01 | Auto (unit) | P0 | `deriveOrientationFromCanvas(1080, 1920)` → `'portrait'`; `(1080, 1080)` → `'square'`; `(1280, 720)` → `'landscape'` | 🔲 | |
| TC-AI-036-02 | Manual | P0 | Open Instagram Story template → Quick Generate → generated image is portrait, not landscape | 🔲 | |
| TC-AI-036-03 | Manual | P0 | From TC-036-02, click "Use This Design" → image lands inside the existing Story canvas; canvas dimensions unchanged | 🔲 | |
| TC-AI-036-04 | Manual | P1 | Open AI Chat on a Square template → orientation picker defaults to Square; manually switch to Landscape → override respected | 🔲 | |
| TC-AI-036-05 | Manual | P1 | Start a true blank canvas (no template) → Quick Generate → "Use This Design" → today's auto-resize behavior unchanged | 🔲 | |
| TC-AI-036-06 | Auto (unit) | P2 | `deriveOrientationFromCanvas(0, 0)` / `(undefined, undefined)` → falls back to `'landscape'`, does not throw | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified on `localhost:5000`
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-29*
