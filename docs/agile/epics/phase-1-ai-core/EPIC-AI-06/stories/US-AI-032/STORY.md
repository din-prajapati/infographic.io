# Story Card — US-AI-032

> **Status:** 🔶 In Progress (T3–T5,T7 done 2026-08-11; T6 done; awaiting /test-story)
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

- [ ] **AC1 [happy-path]:** An edited generation opens in the editor as a background layer plus independently selectable text elements at their supplied positions.
- [ ] **AC2 [happy-path]:** Each element carries its `slot` tag, so the existing sidebar Customize sections edit the values live (`RightSidebar.tsx:297-300` already derives active slots reactively from elements).
- [ ] **AC3 [happy-path]:** The design persists and reloads with all elements intact.
- [x] **AC4 [regression]:** Flat mode remains available and unchanged; the user chooses per generation.
- [ ] **AC5 [regression]:** **Export matches the composed preview at full resolution.** This is *not* true today — see Export parity below. Real work, not a checkbox.
- [ ] **AC6 [error-path]:** An element with missing or malformed geometry renders with a safe default placement and style. Never crashes the editor, never silently drops the value.
- [x] **AC7 [edge-case]:** A `slot` id absent from the sidebar catalogs **fails loudly at dev time** rather than vanishing. Today `TemplateSection` returns `null` when nothing matches (`TemplateSlotSection.tsx:210-211`), so a typo'd slot silently deletes a value from the UI — exactly the failure AC6 forbids.

---

## ⚠️ Verification status — read before ticking anything else

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

## Export parity — AC5 is real work

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
| TC-AI-032-01 | Manual | P0 | Edit a generation → background plus individually selectable text elements at supplied positions | 🔲 | |
| TC-AI-032-02 | Manual | P0 | Change a slot value in the sidebar (e.g. price) → canvas updates live | 🔲 | |
| TC-AI-032-03 | Manual | P0 | Save and reload → all elements and slot tags intact | ⏸ | Blocked — no client test infra (US-DEPLOY-007) |
| TC-AI-032-04 | Manual | P0 | Export an editable design → pixel output matches composed preview at full resolution | ⏸ | Blocked — no client test infra (US-DEPLOY-007) |
| TC-AI-032-05 | Manual | P0 | Flat mode → unchanged existing behaviour, no slots created | ⏸ | Blocked — flat path untouched in diff, but runtime unverified |
| TC-AI-032-06 | Manual | P1 | Element with malformed geometry → safe default placement, no crash, value still present | ⏸ | Blocked — no client test infra (US-DEPLOY-007) |
| TC-AI-032-07 | Auto | P1 | Unknown slot id → loud dev-time failure, not a silent disappearance | ⚠ | Compile-time half only — `SlotId` union via `npm run check`; dev-throw unverified |
| TC-AI-032-08 | Auto | P1 | `verifyAndRepairV4JsonPrompt` is not invoked on the editable path | ⚠ | Source-scan tripwire only — defeated by rename/alias/indirect call |
| TC-AI-032-09 | Manual | P2 | Replace the background image with a different photo → composition holds, text elements unaffected | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

*Created 2026-07-03 · Rewritten 2026-08-11 under the architecture locked the same day.*
