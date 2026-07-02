# PR Task List — US-DESIGN-012

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/design-us-design-012-premium-templates`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** feat
> **Status:** ✅ Done — 2026-07-02

---

## Three Pillars Pre-flight

- [x] **Brain** — STORY.md is filled: ACs written, out-of-scope listed
- [x] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [x] **Env** — paths known (client-side only, no ENV.yaml needed)

---

## PR Scope Summary

**One-liner:** Add 5 premium format-correct infographic templates with thumbnail views and a sidebar slot-based customization system; fix canvas viewport fit, element drag/resize scale, and export for print-ready A4 output.
```
feat(design): premium sample templates, slot customization, canvas fit + element scale fix — US-DESIGN-012
```

---

## Task Breakdown

### T1 — Add `slot` to element type
**File:** `client/src/lib/canvasTypes.ts`
**AC(s) covered:** AC1
**Changes:**
- Add optional `slot?: string;` to `BaseElement`

**Verification:** `npm run check` ✅

---

### T2 — Slot helpers
**File:** `client/src/lib/templateSlots.ts` (NEW)
**AC(s) covered:** AC2
**Changes:**
- `findElementsBySlot(slot: string): CanvasElement[]`
- `getSlotValue(slot): string | undefined` (text `content` or image `src` or shape `fill`)
- `updateSlot(slot, patch): void` — single `pushToHistory` + `updateElement` per matched element
- `updateTextSlot`, `updateImageSlot`, `updateColorSlot` typed helpers
- `getActiveSlots(elements): string[]` — derive present slots from loaded canvas
- `canvasHasSlots(elements): boolean`

---

### T3 — CustomizePanel + TemplateSlotSection integration
**Files:** `client/src/components/editor/CustomizePanel.tsx` (NEW), `client/src/components/editor/TemplateSlotSection.tsx` (NEW), `client/src/components/editor/RightSidebar.tsx`
**AC(s) covered:** AC3, AC4, AC5
**Changes:**
- `CustomizePanel.tsx`: Brand / Property / Agent sections bound to slots (retained for reference)
- `TemplateSlotSection.tsx`: Reusable slot section component with `SlotControl` fields — embedded directly into Design, Property, and Agent tabs in RightSidebar
- `RightSidebar.tsx`: Redesigned to 3 tabs (Design, Property, Agent); slot sections injected contextually per-tab; no separate "Customize" tab needed

---

### T4 — Author 5 premium templates
**File:** `client/src/lib/premiumTemplates.ts` (NEW)
**AC(s) covered:** AC6, AC7, AC8, AC10
**Changes:**
- 5 `StarterCanvasTemplate` entries at exact pixel dimensions with SVG thumbnails + `slot` tags
- Templates: `premium-ig-story-listing` (1080×1920), `premium-square-listing` (1080×1080), `premium-open-house-flyer` (2480×3508), `premium-market-report` (1200×400), `premium-mls-listing-sheet` (1280×960)
- Helpers: `box`, `text`, `img`, `svgThumbnail`, `placeholderImage`

---

### T5 — Starter schema + catalog registration
**Files:** `client/src/lib/starterCanvasTemplates.ts` (NEW), `client/src/lib/galleryTemplateCatalog.ts`
**AC(s) covered:** AC9
**Changes:**
- `starterCanvasTemplates.ts`: Old 5 generic 1200×800 boards removed; keeps `StarterCanvasTemplate` type, `STARTER_CANVAS_TEMPLATES = []`, `getStarterCanvasTemplateById` — all imports still compile
- `galleryTemplateCatalog.ts`: `GALLERY_BY_ID` combines starter + premium; `getGalleryCanvasTemplateById` resolves from either source

---

### T6 — Gallery rendering
**File:** `client/src/components/pages/TemplatesPage.tsx`
**AC(s) covered:** AC11, AC12
**Changes:**
- Premium cards with uniform `aspect-[4/3]` frame, `object-contain`, "Premium" pill + format badge
- `items-stretch`, `flex-col`, "Use Template" button pinned to bottom
- Backend AI-layout templates (`aiModel: 'canvas-template'`) filtered out — only visual canvas templates shown
- Removed unused `aspectRatio` field from `TemplateItem`

---

### T7 — Export/thumbnail size-from-store
**File:** `client/src/lib/canvasState.ts`
**AC(s) covered:** AC13
**Changes:**
- `generateThumbnail` and `exportCanvasAsImage`: read `canvasWidth`/`canvasHeight` from `useCanvasStore`; adaptive scale (1 for ≥2000px artboards, 2 otherwise)
- `fitCanvasZoomToViewport`: `Math.round` → `Math.floor` to prevent zoom overestimation; reduced padding to 80px

---

### T8 — Artboard fit + text export wrapping (user feedback)
**Files:** `client/src/components/editor/CenterCanvas.tsx`, `client/src/lib/canvasExport.ts`, `client/src/lib/premiumTemplates.ts`
**Driver:** User feedback — "Still its not fit in canvas, text gets cut-off"
**Changes:**
- `CenterCanvas.tsx`: `ResizeObserver` on viewport; `useLayoutEffect` keyed on `[canvasWidth, canvasHeight]` calls `fitCanvasZoomToViewport()` before paint — no zoom=1 flash; canvas container uses `position: absolute` with explicit `left`/`top` calculations; `transform` removed from non-panning transition
- `canvasExport.ts`: `wrapTextToWidth` helper + word-wrap in `renderTextElement` (honors `\n` AND wraps to element width)
- `premiumTemplates.ts`: MLS description height (96→112), Market Report headline height (64→96)

**Verification:** All 5 templates load fitted — Story @47%, Square @84%, A4 @26%, Header @100%, MLS @94% ✅

---

### T9 — Deterministic canvas viewport fit (user follow-up)
**File:** `client/src/components/editor/CenterCanvas.tsx`
**Driver:** User follow-up — A4 flyer and Market Report header still clipping on right edge
**Root cause:** `restoreCanvasData` sets `zoom: 1` from template data; rAF + timeout-based `scheduleFitCanvasZoomToViewport` didn't apply fitted zoom before browser paint → `overflow-hidden` clipped large artboards at zoom=1
**Changes:**
- `useLayoutEffect` keyed on `[canvasWidth, canvasHeight]` directly calls `fitCanvasZoomToViewport()` — runs after DOM commit but before paint
- Removed `transform` from CSS transition on canvas container; instant application eliminates zoom=1 → fitted animation flash
- `ResizeObserver` kept for viewport-resize refits

---

### T10 — Canvas element drag/resize scale fix (user feedback)
**Files:** `client/src/components/canvas/TextElement.tsx`, `ShapeElement.tsx`, `ImageElement.tsx`
**Driver:** User feedback — "clicked element moves to bottom/diagonal; resize handles not smooth"
**Root cause:** `react-rnd` `Rnd` components were missing `scale={zoom}` prop — coordinates were calculated in screen pixels, not canvas-scaled pixels
**Changes:**
- Added `scale={zoom}` to all `Rnd` components
- Added `if (d.x !== element.x || d.y !== element.y)` guard on `onDragStop` to prevent position updates on simple clicks
- `enableResizing={isSelected && !element.locked}` — handles only on selected, unlocked elements
- Custom `resizeHandleStyles` with `width/height = Math.max(6, Math.round(8/zoom))` for zoom-invariant 8px apparent handle size, white background, blue `#3b82f6` border

---

### T11 — TemplateSlotSection shared component
**File:** `client/src/components/editor/TemplateSlotSection.tsx` (NEW)
**Driver:** UX redesign — avoid separate "Customize" tab; integrate contextually into existing tabs
**Changes:**
- Exports `TemplateSection` (section wrapper with title/subtitle/field grid), `SlotControl` (label + input per slot)
- Exports field definitions: `BRAND_SLOT_FIELDS`, `PROPERTY_SLOT_FIELDS`, `AGENT_SLOT_FIELDS`, `OPEN_HOUSE_SLOT_FIELDS`
- `TemplateSection` renders nothing when no active slots match — graceful empty state (AC5)

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Status |
|------|---------|-------|--------|
| `client/src/lib/canvasTypes.ts` | T1 | AC1 | ✅ |
| `client/src/lib/templateSlots.ts` | T2 | AC2 | ✅ |
| `client/src/components/editor/CustomizePanel.tsx` | T3 | AC3,4,5 | ✅ |
| `client/src/components/editor/TemplateSlotSection.tsx` | T11 | AC3,4,5 | ✅ |
| `client/src/components/editor/RightSidebar.tsx` | T3, T11 | AC3 | ✅ |
| `client/src/lib/premiumTemplates.ts` | T4, T8 | AC6,7,8,10 | ✅ |
| `client/src/lib/starterCanvasTemplates.ts` | T5 | AC9 | ✅ |
| `client/src/lib/galleryTemplateCatalog.ts` | T5 | AC9 | ✅ |
| `client/src/components/pages/TemplatesPage.tsx` | T6 | AC11,12 | ✅ |
| `client/src/lib/canvasState.ts` | T7 | AC13 | ✅ |
| `client/src/lib/canvasExport.ts` | T8 | AC13 | ✅ |
| `client/src/components/editor/CenterCanvas.tsx` | T8, T9 | AC14 | ✅ |
| `client/src/components/editor/EditorLayout.tsx` | T5 | AC9,12 | ✅ |
| `client/src/components/canvas/TextElement.tsx` | T10 | AC15 | ✅ |
| `client/src/components/canvas/ShapeElement.tsx` | T10 | AC15 | ✅ |
| `client/src/components/canvas/ImageElement.tsx` | T10 | AC15 | ✅ |

---

## Exact Test Commands

```bash
# 1. TypeScript check — must pass before PR
npm run check

# 2. Unit tests — must pass before PR
npm run test:unit

# 3. Manual flow
# Open localhost:5000 → /templates → premium cards → Use Template → editor at correct size
# → Design tab → slot section visible → edit headline → canvas updates live → export PNG
```

---

## Task Checklist

- [x] T1 — `slot` field (`canvasTypes.ts`)
- [x] T2 — slot helpers (`templateSlots.ts`)
- [x] T3 — CustomizePanel + tab (`CustomizePanel.tsx`, `RightSidebar.tsx`)
- [x] T4 — 5 premium templates (`premiumTemplates.ts`)
- [x] T5 — schema + catalog (`starterCanvasTemplates.ts`, `galleryTemplateCatalog.ts`)
- [x] T6 — gallery rendering (`TemplatesPage.tsx`)
- [x] T7 — export size-from-store (`canvasState.ts`)
- [x] T8 — artboard fit + text export wrapping (`CenterCanvas.tsx`, `canvasExport.ts`)
- [x] T9 — deterministic viewport fit (`CenterCanvas.tsx`)
- [x] T10 — element drag/resize scale fix (`TextElement.tsx`, `ShapeElement.tsx`, `ImageElement.tsx`)
- [x] T11 — TemplateSlotSection shared component (`TemplateSlotSection.tsx`)
- [x] `npm run check` passes ✅
- [x] `npm run test:unit` passes (41/41) ✅
- [x] Manual test: gallery → editor → customize → export ✅
- [ ] PR opened with story card as description
- [x] STORY.md ACs updated ✅

---

## Test Is Truth

> Do not weaken or skip a failing test. Fix the code. No PR until `npm run check` + `npm run test:unit` pass.

---

## Anti-Patterns Avoided

- Did NOT add backend template rows or API endpoints — premium templates are client-side only
- Did NOT hardcode canvas 1200×800 in new code — always reads from store
- Did NOT add PDF export (out of scope)
- Did NOT surface model names in any UI text

---

*Tasks created: 2026-06-30 | Completed: 2026-07-02*
