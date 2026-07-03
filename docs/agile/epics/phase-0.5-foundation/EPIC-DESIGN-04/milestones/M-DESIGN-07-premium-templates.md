# M-DESIGN-07-premium-templates — Premium Template Library + Canvas Fit + Export Fix

> **Epic:** [EPIC-DESIGN-04](../EPIC.md)
> **Status:** ✅ Done
> **Target date:** 2026-07-10 | **Closed:** 2026-07-02

---

## Goal

Ship 5 premium format-correct canvas templates (social story, square, A4 print flyer, email header, MLS sheet), fix the canvas viewport fit so every artboard loads correctly at any zoom level, fix element drag/resize coordinate scaling, and ensure exports produce the correct pixel dimensions.

---

## Stories in this Milestone

| Story | Title | Status | Branch |
|-------|-------|--------|--------|
| [US-DESIGN-012](../stories/US-DESIGN-012/STORY.md) | Premium Sample Templates + Slot Customization + Canvas Fix | ✅ Done | `feat/design-us-design-012-premium-templates` |

---

## Deliverables

| # | Deliverable | File | Status |
|---|-------------|------|--------|
| 1 | 5 premium canvas templates with SVG thumbnails + slot tags | `client/src/lib/premiumTemplates.ts` (NEW) | ✅ |
| 2 | Gallery catalog combining starter + premium IDs | `client/src/lib/galleryTemplateCatalog.ts` | ✅ |
| 3 | Gallery page — uniform card height, Premium pill, API template filter | `client/src/components/pages/TemplatesPage.tsx` | ✅ |
| 4 | Export/thumbnail size-from-store + adaptive scale | `client/src/lib/canvasState.ts` | ✅ |
| 5 | Export text word-wrap (`wrapTextToWidth`) | `client/src/lib/canvasExport.ts` | ✅ |
| 6 | Canvas fit — `useLayoutEffect` + `ResizeObserver` + absolute positioning | `client/src/components/editor/CenterCanvas.tsx` | ✅ |
| 7 | Element drag/resize `scale={zoom}` + zoom-invariant handles | `TextElement.tsx`, `ShapeElement.tsx`, `ImageElement.tsx` | ✅ |

---

## Template Spec

| # | ID | Badge | Dimensions | Channel |
|---|----|-------|-----------|---------|
| 1 | `premium-ig-story-listing` | `9:16` | 1080×1920 | Social Story |
| 2 | `premium-square-listing` | `1:1` | 1080×1080 | Social Square |
| 3 | `premium-open-house-flyer` | `A4 · 300dpi` | 2480×3508 | Print |
| 4 | `premium-market-report` | `3:1` | 1200×400 | Email/Web Header |
| 5 | `premium-mls-listing-sheet` | `MLS` | 1280×960 | MLS |

---

## Acceptance (Milestone Done When…)

- [x] All 5 premium templates render in gallery with correct thumbnails and Premium pill
- [x] Each template opens at native canvas dimensions (A4 at 2480×3508, Story at 1080×1920, etc.)
- [x] Canvas viewport fit is deterministic — no overflow/clipping on any template at load or resize
- [x] Runtime fit verification: Story @47%, Square @84%, A4 @26%, Header @100%, MLS @94%
- [x] Element click → drag moves element to correct position (no diagonal/bottom snap)
- [x] Resize handles appear at correct position and are visually consistent at all zoom levels
- [x] Export PNG for A4 produces 2480×3508 output; text wraps correctly
- [x] No model names appear in any UI label, badge, or thumbnail
- [x] Backend AI-layout templates do NOT appear in the gallery
- [x] `npm run check` + `npm run test:unit` (41/41) pass

---

## Key Technical Decisions

- **Canvas fit strategy:** `useLayoutEffect` (runs before paint) directly calls `fitCanvasZoomToViewport()` — eliminates the rAF/timeout race that caused large artboards to flash at zoom=1 before fitting.
- **Canvas positioning:** Canvas container uses `position: absolute` with explicit `left`/`top` calculated from viewport and zoom — more robust than flex centering under CSS transforms.
- **Element scale:** `react-rnd` requires the `scale` prop when its parent has a CSS `transform: scale(zoom)` — without it, pointer events use screen coordinates instead of canvas coordinates.
- **Resize handle size:** `Math.max(6, Math.round(8/zoom))` keeps handles at ~8px apparent size regardless of zoom level.

---

*Milestone created: 2026-06-30 | Closed: 2026-07-02*
