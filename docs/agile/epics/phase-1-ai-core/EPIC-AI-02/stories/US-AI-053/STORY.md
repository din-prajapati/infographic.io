---
title: Story Card — US-AI-053
type: story
tags: [ai, canvas, editor, regression]
updated: 2026-09-03
---

# Story Card — US-AI-053

> **Status:** 🟡 Implemented — Gate 1 green (497 backend + 271 client). Gate 2 pending.
> **Feature:** F-AI-02-05 — Canvas-aware generation
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-20-canvas-image-lifecycle](../../milestones/M-AI-20-canvas-image-lifecycle.md)
> — created 2026-09-03 for this work. `M-AI-06` closed 2026-08-05 and was not reopened.
> **Size:** S–M (~3–4h, see Estimate)
> **Follows:** [US-AI-036](../US-AI-036/STORY.md) AC3 — this fixes a consequence of that decision
> **Created:** 2026-09-03 | **Closed:** —

---

## Story

*As* an agent iterating on a design over a template
*I want* a new AI generation to replace the previous one rather than pile up behind it
*So that* what I see is what I have, and I can step back if I preferred the last one

---

## The problem, and where it came from

`US-AI-036` (✅ Done 2026-08-03) fixed a genuinely destructive bug: generating over a template
**wiped the canvas**. Its repro is in that card — open Instagram Story (1080×1920), Quick Generate,
"Use This Design", and the Story canvas is gone, replaced by a 1280×720 landscape one.

Its fix (AC3) was: when the canvas has a deliberate origin, insert the AI image as a **new layer**
behind existing content and leave the canvas alone. That was right. What it did not settle is what
happens on the *second* generation.

`canvasState.ts` currently does:

```ts
elements: [imageElement, ...existingElements]
```

It prepends, unconditionally. Nothing looks for an existing `isAiImport` element, so a second
generation adds a second AI background at `minZIndex - 1`, a third adds another. They stack
invisibly beneath the template. The user sees one design and is carrying three.

Two consequences beyond the clutter:

1. **`CanvasEditToolbar` composes against the wrong image.** It resolves the AI element with
   `elements.find(...)` — the *first* match — so once layers stack, "Edit elements" can extract
   text from an image the user is no longer looking at, at real API cost.
2. **Export and save carry the dead layers.** Every stacked image is serialised into the design.

---

## Prior art — what Canva and Figma do here

Neither asks. Both make replacement structural rather than conversational:

- **The background is a singleton slot.** Canva's page background and a Figma frame's image fill
  each hold exactly one image; setting a new one replaces the old. Neither accumulates.
- **Replacement is aimed, not confirmed.** Figma replaces when you drop onto an existing fill;
  Canva has an explicit "Replace" on the element. The gesture carries the intent.
- **Undo is the safety net, not a modal.** Canvas edits are non-blocking because Ctrl+Z is cheap.

A confirmation dialog would be actively wrong for this product: generation is iterative and each
attempt costs real money, so agents generate repeatedly. A modal per attempt taxes exactly the
behaviour the product depends on.

*(Product behaviour as understood at a May 2026 knowledge cutoff; these tools iterate quickly.
Treat it as the shape of the pattern, not a current spec.)*

---

## ⚠️ The thing that makes this more than a one-line fix

**Placing an AI design is not undoable today.** `useCanvasStore.loadCanvas` (line 240) sets state
directly and never calls `pushToHistory`. `canvasState.ts` has **zero** `pushToHistory` calls —
there are only 2 in the entire client.

So the toolbar Undo (⟲ / Ctrl+Z, backed by 50 steps) does nothing for this action, and the toast
Undo lasts about 4 seconds (`<Toaster />` in `App.tsx:210` sets no `duration`, so sonner's 4s
default applies).

**Shipping singleton-replace without AC2 would convert a clutter bug into data loss.** AC2 is not
optional polish; it is the precondition that makes AC1 safe.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** In `client/src/lib/canvasState.ts`'s `loadAiVariationToCanvas`,
      the deliberate-origin branch removes any existing element with `isAiImport === true` before
      prepending the new one. After N generations onto the same template, the canvas holds
      **exactly one** `isAiImport` element. Template/user elements are untouched, canvas
      dimensions unchanged, and the new image keeps its `minZIndex - 1` placement.

- [x] **AC2 [regression]:** `pushToHistory` is called with the pre-change element snapshot before
      the `loadCanvas` mutation in `loadAiVariationToCanvas`, so the toolbar Undo restores the
      previous canvas — including the replaced AI image. Verified by asserting `history.past`
      grows by one and `undo()` returns the prior element set. **AC1 must not merge without this.**

- [x] **AC3 [happy-path]:** Replacement announces itself: a toast reading *"Background replaced"*
      with an **Undo** action wired to `useCanvasStore.undo`. Shown only when an image was actually
      replaced — the first generation onto a template is an insert, not a replacement, and must
      stay silent.

- [x] **AC4 [edge-case]:** Stale extracted layers. When the canvas holds `composed-` prefixed
      elements (output of a previous "Edit elements") and the AI background is replaced, those
      elements are removed with it, and the toast says so: *"Background replaced — press Edit
      elements to extract text from the new design."* Their geometry was measured from the old
      image, so keeping them leaves text positioned for a design that no longer exists.
      *(Settled 2026-09-03 — drop them; see Decision below.)*

- [x] **AC5 [regression]** *(satisfied by construction; no test — see TC-06)*: The blank-canvas path is untouched. With no deliberate origin,
      `loadAiVariationToCanvas` still auto-sizes a new artboard via `resolveAiArtboard()` exactly
      as US-AI-036 AC4 specifies. That branch has no prior image to replace.

- [x] **AC6 [regression]:** `CanvasEditToolbar`'s `elements.find(...)` resolves correctly by
      construction — with one `isAiImport` element there is no ambiguity. Its own code is
      **not modified**; this AC is a test asserting the invariant holds after two generations.

- [x] **AC7 [error-path]** *(satisfied by construction; no test — see TC-08)*: If the image fails to load or decode, the canvas is left exactly as it
      was — no element removed, no history entry pushed, no toast. The existing `catch` returns
      `false`; removal must not happen before the image is known good.

---

## Decision — settled 2026-09-03

- [x] **Stale `composed-` layers are dropped with the background they were measured from.**

  Their geometry came from extraction against the *old* image. Keeping them puts the headline over
  the house and the price off the scrim — a canvas that looks broken rather than one that looks
  changed. The user's *edits* to that text are real work; the *positions* are not theirs, and AC2's
  undo restores both.

  Rejected: **keep** (cheapest diff, visibly broken output) and **ask** (a modal inside an
  iterative, paid loop — the exact tax this story's prior-art section argues against).

  The toast carries the consequence rather than hiding it: *"press Edit elements to extract text
  from the new design."*

---

## Out of Scope

- **Any change to `CanvasEditToolbar`** — AC6 is an assertion about it, not an edit to it.
- **`loadComposedDesignToCanvas`'s own missing history push.** It has the same gap as
  `loadAiVariationToCanvas` and deserves the same fix, but widening this story into "add undo
  coverage across all canvas loaders" makes it un-reviewable. File separately.
- **A general undo-coverage audit** of the client's 2 `pushToHistory` callers.
- **Changing the toast duration** or `<Toaster />` configuration globally.
- Re-opening US-AI-036's insert-behind decision. This story depends on it being right.

---

## Test Cases

> Canonical 6-column shape, so `orion tc-rows --write` can regenerate it without corrupting the
> table (BL-17: it assumes exactly these columns and shifts every cell if given more). The AC each
> row covers is named in the Scenario text instead of a separate column.

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-AI-053-01 | Unit | P0 | AC1 — two generations onto a template leave exactly one `isAiImport` element | ✅ | `canvasState.aiBackground.spec.ts` |
| TC-AI-053-02 | Unit | P0 | AC1 — template/user elements and canvas dimensions survive the replacement unchanged | ✅ | `canvasState.aiBackground.spec.ts` |
| TC-AI-053-03 | Unit | P0 | AC2 — `history.past` grows by one, and `undo()` restores the previous AI image | ✅ | `canvasState.aiBackground.spec.ts` |
| TC-AI-053-04 | Unit | P1 | AC3 — first generation onto a template shows no "replaced" toast; the second does | ✅ | `canvasState.aiBackground.spec.ts` |
| TC-AI-053-05 | Unit | P1 | AC4 — `composed-` elements are removed alongside the replaced background | ✅ | `canvasState.aiBackground.spec.ts` |
| TC-AI-053-06 | Unit | P0 | AC5 — blank canvas still auto-sizes the artboard, US-AI-036 AC4 unchanged | 🔲 | **Not written.** True by construction — the change is inside the `hasDeliberateOrigin` branch, so the blank-canvas `else` is textually untouched. Exercising it needs the image pipeline this repo deliberately does not mock. Gate 2 covers it |
| TC-AI-053-07 | Unit | P0 | AC6 — after two generations the single `isAiImport` element is the newest one | ✅ | `canvasState.aiBackground.spec.ts` |
| TC-AI-053-08 | Unit | P1 | AC7 — a failed image load leaves elements, history and toasts untouched | 🔲 | **Not written.** True by construction — removal happens after `await loadImageFromSrc`, so a decode failure throws before any mutation. Same mocking limitation as TC-06 |

---

## Estimate

| Task | Effort | Note |
|------|:------:|------|
| T1 — singleton replace (AC1) | ~30m | One filter in the deliberate-origin branch |
| T2 — history push (AC2) | ~45m | The uncertain one. Touching history semantics in a store with only 2 existing callers; watch the artboard-sync `useEffect` in `CenterCanvas` |
| T3 — replacement toast + Undo (AC3) | ~30m | Same shape as existing toasts |
| T4 — stale `composed-` handling (AC4) | ~30m | Shape depends on the Open Question |
| T5 — unit tests (8 TCs) | ~1h | No React harness needed — all store/helper level (BL-20 not a blocker here) |
| Gate 1 | ~15m | `npm run check` + `npm run test:unit` |
| **Total** | **~3–4h** | One focused session |

**Gate 2 (staging)** adds ~30m but is currently gated by **BL-22** — AI Chat's backend validation
intermittently refuses valid prompts, which blocked five E2E attempts on 2026-09-03. Quick Generate
bypasses that gate and is the more reliable route for verifying this story.

**What could push it past 4h:** if `pushToHistory` in the load path interacts badly with the
artboard-sync effect, or if undo turns out to need canvas dimensions in the snapshot (history
currently stores `CanvasElement[]` only, not width/height — so undoing a *blank-canvas* generation
would restore elements but not the artboard size). That last point is worth checking during T2;
if it bites, it is a separate story, not scope creep into this one.

---

## Definition of Done

- [ ] All ACs checked
- [ ] The Open Question is decided and recorded in this card
- [ ] A milestone is assigned (M-AI-06 is closed — do not reopen)
- [ ] `orion harden US-AI-053` run and locked
- [ ] Gate 1 green
- [ ] Gate 2 — generate twice onto one template via Quick Generate; confirm one background,
      confirm toolbar Undo restores the previous one
- [ ] PR opened with story card as description
