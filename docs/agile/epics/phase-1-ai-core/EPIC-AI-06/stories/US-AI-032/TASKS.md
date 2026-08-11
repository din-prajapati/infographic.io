# PR Task List — US-AI-032

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai/m-18-editable-text-overlay`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** feat
> **Estimated total:** ~5h 15m

---

## ⚠️ Size warning — read before starting

**This exceeds the ≤4h single-session limit in `AGILE.md`.** The overage is entirely the export-parity work (T6, ~1h 30m), which AC5 requires and which is genuinely broken today independent of this story.

Two honest options — pick one before starting, do not silently pad estimates down:

- **(a) Split.** Move T6 into its own story, e.g. `US-AI-032b — export/preview parity`. It is independently valuable: the divergence affects every exported design today, not only AI-composed ones.
- **(b) Accept a long session** and land it as one PR, with the size overrun noted in the PR body.

Recommendation: **(a)**. Export parity is a pre-existing defect wearing this story's badge, and fixing it separately gets it shipped sooner and reviewed on its own terms.

---

## Four Pillars Pre-flight

- [ ] **Brain** — [STORY.md](./STORY.md) read, including "Known structural facts"
- [ ] **Muscle** — file list + ordered tasks + test commands below
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) reviewed
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded

> ⚠️ **US-AI-031b must be merged first** — T2 imports its `ComposedDesign` contract.

---

## PR Scope Summary

```
feat(editor): load AI compositions as editable slot-tagged canvas designs — US-AI-032
```

---

## Task Breakdown

### T0 — Establish which export path is live *(investigation, do first)*
**Files:** read-only — `client/src/lib/canvasExport.ts`, `client/src/lib/canvasState.ts`, editor toolbar components
**AC(s) covered:** AC5 (prerequisite)
**Estimate:** 15m

Two competing export functions exist: `canvasExport.ts:20` (native canvas) and `canvasState.ts:423` `exportCanvasAsImage()` (html2canvas, whose own header comments at `:50-68` say html2canvas breaks on this codebase's oklch theme).

**Determine which one the Export button actually calls, and record the answer at the top of T6.** Changing the wrong renderer is silently wasted work.

*No commit — findings go into T6's task notes.*

---

### T1 — Shared slot vocabulary + typed union
**Files:** `client/src/lib/slotIds.ts` *(new)*, `TemplateSlotSection.tsx`, `CustomizePanel.tsx`
**AC(s) covered:** AC7
**Estimate:** 40m

Slot names are hardcoded in two unsynced places — `TemplateSlotSection.tsx:40-70` (14 entries) and `CustomizePanel.tsx:39-66` (23 entries) — with a stale comment pointing at `premiumTemplates.ts`, deleted in US-AI-037.

**Changes:**
- New `slotIds.ts` exporting one const array + a derived `SlotId` union type
- Both components import from it; delete the duplicated literals
- Add a dev-time guard so an unknown slot id **throws in development** instead of rendering `null` (`TemplateSlotSection.tsx:210-211`) — that silent null is how a typo'd slot deletes a value from the UI today
- Remove the stale `premiumTemplates.ts` comment

**Commit:**
```bash
git add client/src/lib/slotIds.ts client/src/components/editor/TemplateSlotSection.tsx client/src/components/editor/CustomizePanel.tsx
git commit -m "refactor(editor): T1 single source of truth for slot ids — US-AI-032"
```

---

### T2 — Mode flag through the request path
**Files:** `api/src/modules/infographics/dto/generate-from-chat.dto.ts`, `client/src/lib/api.ts`, `client/src/components/ai-chat/AIChatBox.tsx`
**AC(s) covered:** AC4
**Estimate:** 30m

**Changes:**
- DTO: `renderMode?: 'flat' | 'editable'`, `@IsEnum`, `@IsOptional`, default `'flat'`
- Mirror on `GenerateFromChatInput` (`client/src/lib/api.ts:93-114`)
- Send from the request body build (`AIChatBox.tsx:780-798`); add the mode toggle UI
- **Provider-agnostic naming** — the flag describes the output shape, never the endpoint

**Commit:**
```bash
git add api/src/modules/infographics/dto/generate-from-chat.dto.ts client/src/lib/api.ts client/src/components/ai-chat/AIChatBox.tsx
git commit -m "feat(editor): T2 add renderMode flag to the generation request — US-AI-032"
```

---

### T3 — Teach the AI-import path to carry elements
**File:** `client/src/lib/canvasState.ts`
**AC(s) covered:** AC1, AC6
**Estimate:** 60m

`loadAiVariationToCanvas(imageUrl, name, orientation)` (`:296-418`) accepts only a URL, and its blank-canvas branch does `elements: [imageElement]` at `:401` — replacing the whole element array with one raster. That assumption is the blocker.

**Changes:**
- Add a sibling `loadComposedDesignToCanvas(design: ComposedDesign)` rather than overloading the existing function — the old signature has two call sites and a lot of `isAiImport` behaviour riding on it
- Background → image element with `isAiImport: true` (keeps the existing artboard-sync behaviour)
- Each `ComposedTextElement` → a text element carrying its `slot` tag, geometry, and style
- Malformed/missing geometry → safe default placement, value still rendered, never a throw (AC6)
- Leave `loadAiVariationToCanvas` untouched for flat mode (AC4)

**Commit:**
```bash
git add client/src/lib/canvasState.ts
git commit -m "feat(editor): T3 load a composed design as background plus text elements — US-AI-032"
```

---

### T4 — Handoff and artboard reconciliation
**Files:** `client/src/components/editor/CenterCanvas.tsx`, `client/src/components/editor/RightSidebar.tsx`, `client/src/components/canvas/ImageElement.tsx`, `client/src/components/ai-chat/AIChatBox.tsx`
**AC(s) covered:** AC1, AC2
**Estimate:** 55m

**Changes:**
- `AIChatBox.tsx:1073-1107` — carry the structured payload through `onTemplateLoad`, not just `previewImage`
- `CenterCanvas.tsx:82-104` — route editable-mode payloads to T3's new loader
- `CenterCanvas.tsx:49-73` — the `isAiImport` artboard-sync `useEffect` assumes exactly one AI element defines the canvas. Ensure it does not fight the overlay text elements.
- `ImageElement.tsx` — the `isAiImport` branch renders `absolute inset-0 pointer-events-none` and ignores x/y/w/h. Confirm this still behaves as a background beneath selectable text.
- `RightSidebar.tsx:431` — second `loadAiVariationToCanvas` call site; leave on the flat path

**Commit:**
```bash
git add client/src/components/editor/CenterCanvas.tsx client/src/components/editor/RightSidebar.tsx client/src/components/canvas/ImageElement.tsx client/src/components/ai-chat/AIChatBox.tsx
git commit -m "feat(editor): T4 route composed designs into the editor — US-AI-032"
```

---

### T5 — Persistence
**File:** `client/src/lib/canvasState.ts`
**AC(s) covered:** AC3
**Estimate:** 25m

`designs.service.ts:69-89` already stores a canvas under `propertyData.canvasDesign.canvasData`, and `CreateDesignDto` is only ever populated by the browser. Reuse that path — the client composes and POSTs to `/designs`. No new server-side writer.

Verify `slot` tags survive the `saveCanvasData` → `restoreCanvasData` round trip (`canvasState.ts:14-26`, `:150-179`).

**Commit:**
```bash
git add client/src/lib/canvasState.ts
git commit -m "feat(editor): T5 persist composed designs with slot tags intact — US-AI-032"
```

---

### T6 — Export/preview parity
**Files:** `client/src/lib/canvasExport.ts`, `client/src/components/canvas/ImageElement.tsx`
**AC(s) covered:** AC5
**Estimate:** 90m ⚠️ *candidate for its own story — see the size warning above*

> **Record T0's finding here before starting:** which export function is live.

Four known divergences between preview and export:

| Divergence | Preview | Export | Fix |
|---|---|---|---|
| Text padding | `px-2 py-1` (`TextElement.tsx:184-200`) | none (`canvasExport.ts:168-275`) | apply the same padding in canvas text layout |
| Image fit | `object-fit: contain` | `ctx.drawImage(img,x,y,w,h)` stretches (`:466`) | honour `objectFit` |
| `element.crop` | honoured | ignored | apply crop in export |
| Web fonts | browser-managed | `ctx.font`, no readiness wait | `document.fonts.ready` before render |

On a "background image + overlaid text" design these are exactly the two element types that matter.

**Commit:**
```bash
git add client/src/lib/canvasExport.ts client/src/components/canvas/ImageElement.tsx
git commit -m "fix(editor): T6 align export rendering with the editor preview — US-AI-032"
```

---

### T7 — Tests
**Files:** `client/src/lib/__tests__/canvasExport.spec.ts` *(new)*, `api/tests/canvas/canvasState.helpers.spec.ts`
**AC(s) covered:** AC3, AC5, AC6, AC7, AC8
**Estimate:** 40m

**No test exists for `canvasExport.ts` today** — this creates the first.

Cover: composed design → expected element array with slot tags (AC1); malformed geometry → safe default, value present (AC6); unknown slot id → throws in dev (AC7); save/restore round trip preserves slots (AC3); export text metrics match preview padding (AC5); `verifyAndRepairV4JsonPrompt` not invoked on the editable path (AC8).

**Commit:**
```bash
git add client/src/lib/__tests__/ api/tests/canvas/
git commit -m "test(editor): T7 cover composed-design load, export parity and slot guards — US-AI-032"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `client/src/lib/slotIds.ts` | T1 | AC7 | New — shared vocabulary |
| `TemplateSlotSection.tsx`, `CustomizePanel.tsx` | T1 | AC7 | De-duplicate the two catalogs |
| `generate-from-chat.dto.ts`, `api.ts`, `AIChatBox.tsx` | T2, T4 | AC1, AC2, AC4 | Mode flag + handoff |
| `client/src/lib/canvasState.ts` | T3, T5 | AC1, AC3, AC6 | New loader; leave the flat one alone |
| `CenterCanvas.tsx`, `RightSidebar.tsx`, `ImageElement.tsx` | T4 | AC1, AC2 | `isAiImport` invariants |
| `client/src/lib/canvasExport.ts` | T6 | AC5 | Confirm it is the live path first |
| tests | T7 | AC3, AC5–AC8 | First `canvasExport` coverage |

---

## Verification (Gate 1 — mandatory)

```bash
npm run check
cd api && npx vitest run --config vitest.config.ts
npm run test:e2e -- e2e/  # editor flows
```

Gate 2 (visual/UX) applies — this story changes rendered output. Capture before/after exports for the PR body.

---

## Out of Scope reminder

No layer extraction, no canonical text binding, no remix call, no object/shape decomposition. Text values arrive already correct from US-AI-031b. The background stays one fused image — replaceable by the user, but not separable into house-vs-decoration.
