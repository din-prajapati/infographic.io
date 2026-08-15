# Story Card — US-AI-032

> **Status:** 🔶 In Progress — AC1/2/3/4/6/7 done (AC1/2/3 live-verified 2026-08-14, AC6 unit-tested 2026-08-15). AC5 (export parity) is real, separate scope — deliberately deferred to [BL-09](../../../../../BACKLOG.md), not built this pass.
> **Feature:** F-AI-06-03 — Editable listing canvas
> **Epic:** [EPIC-AI-06](../../EPIC.md)
> **Milestone:** [M-AI-18](../../milestones/M-AI-18-editable-text-overlay.md)
> **Size:** L
> **Depends on:** [US-AI-031b](../US-AI-031b/STORY.md) — consumes its `ComposedDesign` contract · US-DESIGN-012 (slot infrastructure) — ✅ Done
> **Linear:** LIN-XXX
> **Created:** 2026-07-03 | **Rewritten:** 2026-08-11 | **Closed:** —

---

## ⚠️ Rewritten 2026-08-11 — the old AC2 was unimplementable

The original AC2 said slots are *"positioned/styled from the V4 json_prompt element descriptions."* A codebase investigation found `json_prompt` elements are `{ type, desc, text? }` where `desc` is **English prose**:

```json
{ "desc": "Large stacked headline across the upper portion of the charcoal panel,
           set in an elegant Didone-style serif in muted antique gold #B8924A",
  "text": "SLEEK\nCONTEMPORARY\nOASIS", "type": "text" }
```

Position is *"upper portion of the charcoal panel"*. Font size is *"Large"*. There are **no coordinates, no bounding boxes and no numeric font sizes** anywhere in the format, and no `V4JsonPrompt` type exists in the repo — it is `Record<string, any>` throughout.

Under the architecture locked 2026-08-11, geometry now arrives as **measured values** from [US-AI-031b](../US-AI-031b/STORY.md). This story no longer derives positions from `json_prompt`, and its dependency moves from US-AI-031 to US-AI-031b. It is substantially **simpler** than originally written.

---

## Story

*As an* agent who spots a typo or wants to tweak a headline after generation
*I want* the listing text to be editable elements on the canvas instead of baked pixels
*So that* I can fix and restyle it instantly without regenerating — and without paying for another generation

---

## Scope

Consume a `ComposedDesign` from US-AI-031b and turn it into a real, editable, persistable canvas document. Text values are already correct when they arrive; this story makes them **editable, exportable and durable**.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** An edited generation opens in the editor as a background layer plus independently selectable text elements at their supplied positions. **Live-verified 2026-08-14** — `e2e/us-ai-032-editable-canvas.spec.ts`: 2+ elements land with distinct (non-collapsed) screen positions, and clicking a text element succeeds.
- [x] **AC2 [happy-path]:** Each element carries its `slot` tag, so the existing sidebar Customize sections edit the values live (`RightSidebar.tsx:297-300` already derives active slots reactively from elements). **Live-verified 2026-08-14** — editing the Price field under Property (reached via the "Edit Details" back-link, a real navigation step the test had to discover — see Notes) updates the on-canvas text within 10s, no reload needed.
- [x] **AC3 [happy-path]:** The design persists and reloads with all elements intact. **Live-verified 2026-08-14** — Save → `/editor?designId=...` → hard reload → same element count, edited price value survives.
- [x] **AC4 [regression]:** Flat mode remains available and unchanged; the user chooses per generation.
- [ ] **AC5 [regression]:** **Export matches the composed preview at full resolution.** This is *not* true today — see Export parity below. Real work, not a checkbox. **Not covered by the 2026-08-14 live E2E pass** — needs a pixel-diff harness against the two competing export renderers, separate scope from this pass.
- [x] **AC6 [error-path]:** An element with missing or malformed geometry renders with a safe default placement and style. Never crashes the editor, never silently drops the value. **Fixed and verified 2026-08-15** — extracted the inline safe-geometry computation into a standalone pure function, `computeSafeTextGeometry` (`canvasState.ts`), matching this repo's own canvas-testing decision (`client/vitest.config.ts` header: "pure geometry helpers, zero extra dependencies" — rather than mocking the full image-fetch/canvas pipeline a live-data test can't control anyway). 9 new unit tests (`client/src/lib/__tests__/canvasState.safeGeometry.spec.ts`) cover null/undefined geo, NaN, Infinity, zero, and negative values for every field, plus a per-field (not all-or-nothing) degradation case — all pass, never throw.
- [x] **AC7 [edge-case]:** A `slot` id absent from the sidebar catalogs **fails loudly at dev time** rather than vanishing. Today `TemplateSection` returns `null` when nothing matches (`TemplateSlotSection.tsx:210-211`), so a typo'd slot silently deletes a value from the UI — exactly the failure AC6 forbids.

---

## ⚠️ Verification status — read before ticking anything else

**Update 2026-08-14: AC1/AC2/AC3 resolved.** Real Playwright E2E coverage
(`e2e/us-ai-032-editable-canvas.spec.ts`) against a live generation +
real extraction now verifies them — this is the "client test infrastructure"
this section originally said was missing, arriving as an E2E harness rather
than a jsdom unit suite (the right call: the concerns here — DOM positioning,
sidebar↔canvas reactivity, a real save→reload round trip — are genuinely
E2E-shaped, not unit-shaped; see US-DEPLOY-007's own strategy note on why
canvas logic stays unit-tested only at the pure-geometry-helper layer).
AC5 and AC6 remain open — see their AC notes above. The critique below of
the *old* AC1/2/3/6 evidence (the crude spec that didn't call real code)
stands as history and as a caution against that failure mode recurring.

**Implementation for AC1, AC2, AC3 and AC6 is complete and on the branch. Those ACs are unticked because nothing verifies them.**

`api/tests/canvas/canvasState.helpers.spec.ts` adds 13 passing tests, but none execute the code this story wrote. Its own header says so: *"Client tests (AC3 round-trip, AC1 element array) cannot run here — there is no client test infrastructure in this repo (US-DEPLOY-007)."*

| Test | What it actually asserts | Verifies the story? |
|---|---|---|
| Safe-geometry (AC6) | A `safeGeo()` **copy** declared inside the spec, with a "keep in sync with canvasState.ts" comment | ❌ Passes even if `loadComposedDesignToCanvas` is deleted |
| Slot round-trip (AC3) | `JSON.stringify`/`JSON.parse` preserves a field on an object literal | ❌ Passes on any repo; never calls `captureCanvasData` |
| AC8 guard | Reads `ai-orchestrator.service.ts` as **text** and asserts a substring is absent from a slice | ⚠️ Crude tripwire only — defeated by a rename, a reformat, an alias, or an indirect call |

The two ACs that remain ticked have real evidence: **AC4** because `loadAiVariationToCanvas` and both its call sites are provably untouched in the diff, and **AC7** because the `SlotId` union is enforced by `npm run check`, which passes (the dev-time throw itself is still unverified).

**These ACs become verifiable when [US-DEPLOY-007](../../../EPIC-DEPLOY-01/stories/US-DEPLOY-007/STORY.md) lands.** Do not tick them on the strength of the current suite — and treat "254 tests passing" as evidence about the backend, not about this story.

---

## Notes — live E2E pass, 2026-08-14

Writing `e2e/us-ai-032-editable-canvas.spec.ts` surfaced a real navigation
fact not documented anywhere before this: once a design loads, the
RightSidebar shows the **results panel** (Quick Generate button + variation
cards), not the Design/Property/Agent tabs — those are the *pre-generation*
property-entry form's tabs (`RightSidebar.tsx:1040-1078`), reachable again
post-load only via the "← Edit Details" back-link (`setShowResults(false)`).
The canvas itself is untouched by this toggle — it's purely a sidebar-view
switch — but AC2's own claim ("the existing sidebar Customize sections edit
the values live") is not reachable by a naive "click Property" the way a
first read of the AC suggests. No code change needed; documenting the real
click path here so the next person (or agent) doesn't lose time rediscovering it.

---

## Export parity — AC5 is real work, deferred to [BL-09](../../../../../BACKLOG.md)

**2026-08-15: deliberately deferred, not built.** Confirmed as genuinely separate, sizeable scope (confirm which of two competing export functions is live, build a pixel-diff harness, fix the 4 mismatches below) — user's call, alongside building AC6 in the same pass since AC6 was cheap and AC5 is not. Tracked as BL-09; this section stands as its spec.

Export re-renders from the Zustand store rather than snapshotting the DOM (`canvasExport.ts:20-52`), which is the right architecture. But **preview and export are two independent renderers that visibly disagree**:

| | Preview (DOM) | Export (canvas) |
|---|---|---|
| Text padding | `px-2 py-1` (`TextElement.tsx:184-200`) | none (`canvasExport.ts:168-275`) |
| Image fit | `object-fit: contain` | `ctx.drawImage(img,x,y,w,h)` — **stretches** (`:466`) |
| `element.crop` | honoured | ignored |
| Web fonts | browser-managed | `ctx.font` set with no readiness wait |

On a design that is precisely *"background image + overlaid text"*, those are exactly the two element types that diverge.

⚠️ There are also **two competing export functions** — `canvasExport.ts:20` (native) and `canvasState.ts:423` (html2canvas, whose own comments say it breaks on this codebase's oklch theme). **First task: confirm which one the Export button actually calls.**

---

## Known structural facts — build on these, do not re-derive

Verified by codebase investigation 2026-08-11:

- **Slot model** is one optional string on the base element — `client/src/lib/canvasTypes.ts:9-29`, field `slot?: string`. There is no `Slot` interface or registry.
- **Binding** is string equality over the live store — `client/src/lib/templateSlots.ts:17-19` `findElementsBySlot`; `getSlotValue` `:33-40`; `updateSlot` `:52-75`.
- **Slot vocabulary is duplicated and unsynced** — `TemplateSlotSection.tsx:40-70` (14 entries) and `CustomizePanel.tsx:39-66` (23 entries), with a stale comment referencing `premiumTemplates.ts`, a file **deleted** in US-AI-037 (confirmed at `api/scripts/seed-premium-templates.ts:250-253`). A shared const + typed `SlotId` union is a prerequisite for AC7.
- **No file in the repo currently authors a `slot:` tag on an element.** This story is the first in-repo producer.
- **The generation→editor handoff is typed as a raster.** `AIChatBox.tsx:1073-1107` builds a Template whose only payload is `previewImage: string` → `CenterCanvas.tsx:82-104` → `canvasState.ts:296-418` `loadAiVariationToCanvas(imageUrl, name, orientation)`, whose blank-canvas branch does `elements: [imageElement]` at `:401`, **replacing the entire element array with one raster**. Second call site at `RightSidebar.tsx:431`. Also `ImageElement.tsx` renders `isAiImport` as `absolute inset-0 pointer-events-none`, and `CenterCanvas.tsx:49-73` force-syncs the artboard to that single element. **This is a genuine refactor of the AI-import path, not a parameter addition.**
- **Persistence:** `api/src/modules/designs/services/designs.service.ts:69-89` `save()` writes an `Infographic` with `aiModel:'canvas-editor'` and the canvas under `propertyData.canvasDesign.canvasData`. No server-side writer produces `canvasData` today — `CreateDesignDto` is only ever populated by the browser. **Simplest path: the client composes elements and POSTs to `/designs`.**

---

## Out of Scope

- **Layer extraction and canonical text binding** — [US-AI-031b](../US-AI-031b/STORY.md). Values arrive already correct.
- **The remix/composition call** — [US-AI-031](../US-AI-031/STORY.md).
- **Object/shape decomposition.** Only text is editable. The property photo and decorative graphics remain one fused background image. Separating them is general design understanding and is explicitly not attempted.
- **Font matching beyond family/weight approximation.**
- **Editing the background image itself** (EPIC-AI-04) — though the background *is* an ordinary image element, so a user can replace it with their own photo. That falls out of AC1 for free; no extra work.
- **Renaming existing symbols** — `canvasState.ts`, `loadAiVariationToCanvas`, `isAiImport`, `templateSlots.ts` keep their names.

---

## Do not re-run the exact-text repair on this path

`verifyAndRepairV4JsonPrompt`'s append branch (`infographic-prompt.builder.ts:253-260`) **adds** text elements when they are missing — the exact opposite of what a text-erased background needs. It is EPIC-GEN-01's headline metric with 23 tests behind it, so it must be **bypassed under the mode flag, never loosened**. A guard test belongs in this story.

---

## Model portability

Per `feedback-generic-ai-naming`. The editor must remain **agnostic to how the composition was produced** — that is what lets the image model be swapped (tracked as **B-17**, `AGILE_INDEX.md:92`) without touching the editor at all.

- Prefer `renderMode: 'flat' | 'editable'` over anything naming a provider or endpoint
- Element and slot types stay provider-free
- `isAiImport` is already generically named — keep it

---

## Engineering / PR

- **Branch:** `feat/ai/m-18-editable-text-overlay`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/lib/canvasState.ts`
  - `client/src/lib/canvasExport.ts`
  - `client/src/lib/templateSlots.ts`
  - `client/src/lib/slotIds.ts` *(new — shared vocabulary + typed union)*
  - `client/src/components/editor/CenterCanvas.tsx`
  - `client/src/components/editor/RightSidebar.tsx`
  - `client/src/components/editor/TemplateSlotSection.tsx`
  - `client/src/components/editor/CustomizePanel.tsx`
  - `client/src/components/canvas/ImageElement.tsx`
  - `client/src/components/ai-chat/AIChatBox.tsx`
  - `client/src/lib/api.ts`
  - `api/src/modules/infographics/dto/generate-from-chat.dto.ts`

---

## AI Implementation Prompt

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
See CLAUDE.md for architecture. Router is Wouter, state is Zustand, UI is Tailwind + shadcn/ui.

Story: US-AI-032 — Editable listing canvas

Read first, in order:
  1. docs/agile/epics/phase-1-ai-core/EPIC-AI-06/ARCHITECTURE.mmd
  2. US-AI-031b STORY.md → "Shared contract" — the ComposedDesign types you consume
  3. This STORY.md → "Known structural facts" (verified; do not re-derive)
  4. TASKS.md

Deliver: consume a ComposedDesign, load it into the editor as a background layer plus
slot-tagged editable text elements, persist it, and make export match the preview.

Implementation rules:
- Touch ONLY the files in "Primary files touched"
- Text VALUES arrive already correct — do not re-derive or re-verify them
- Do NOT run verifyAndRepairV4JsonPrompt on this path (it re-adds baked text)
- Flat mode must remain unchanged and selectable
- The editor must not know which provider produced the composition
- Confirm which export function the Export button calls BEFORE changing either
- When done: list files changed, ACs checked, exact test command
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-032-01 | Auto (E2E, live) | P0 | Edit a generation → background plus individually selectable text elements at supplied positions | ✅ Pass | `e2e/us-ai-032-editable-canvas.spec.ts` — live run 2026-08-14 |
| TC-AI-032-02 | Auto (E2E, live) | P0 | Change a slot value in the sidebar (e.g. price) → canvas updates live | ✅ Pass | `e2e/us-ai-032-editable-canvas.spec.ts` — required discovering the "Edit Details" back-link step, see Notes |
| TC-AI-032-03 | Auto (E2E, live) | P0 | Save and reload → all elements and slot tags intact | ✅ Pass | `e2e/us-ai-032-editable-canvas.spec.ts` — element count + edited value both survive a hard reload |
| TC-AI-032-04 | Manual | P0 | Export an editable design → pixel output matches composed preview at full resolution | ⏸ | Still blocked — needs a pixel-diff harness, separate scope from the 2026-08-14 pass |
| TC-AI-032-05 | Manual | P0 | Flat mode → unchanged existing behaviour, no slots created | ⏸ | Not exercised by the new E2E spec (editable-only); flat path still only provably untouched in the diff |
| TC-AI-032-06 | Auto | P1 | Element with malformed geometry → safe default placement, no crash, value still present | ✅ Pass | `client/src/lib/__tests__/canvasState.safeGeometry.spec.ts` — 9 tests, 2026-08-15 |
| TC-AI-032-07 | Auto | P1 | Unknown slot id → loud dev-time failure, not a silent disappearance | ⚠ | Compile-time half only — `SlotId` union via `npm run check`; dev-throw unverified |
| TC-AI-032-08 | Auto | P1 | `verifyAndRepairV4JsonPrompt` is not invoked on the editable path | ⚠ | Source-scan tripwire only — defeated by rename/alias/indirect call |
| TC-AI-032-09 | Manual | P2 | Replace the background image with a different photo → composition holds, text elements unaffected | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

*Created 2026-07-03 · Rewritten 2026-08-11 under the architecture locked the same day.*
