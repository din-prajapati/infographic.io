# Story Card — US-DESIGN-012

> **Status:** ✅ Done
> **Feature:** F-DESIGN-04 — Slot-based template customization · F-DESIGN-05 — Premium template library
> **Epic:** [EPIC-DESIGN-04](../../EPIC.md)
> **Milestone:** [M-DESIGN-06 — Slot Infrastructure](../../milestones/M-DESIGN-06-slot-infra.md) · [M-DESIGN-07 — Premium Templates](../../milestones/M-DESIGN-07-premium-templates.md)
> **Linear:** LIN-XXX
> **Created:** 2026-06-30 | **Closed:** 2026-07-02
> **Branch:** `feat/design-us-design-012-premium-templates`

---

## Story

*As a* real estate agent with no design experience
*I want* 5 premium, format-correct infographic templates (social story, square post, A4 print flyer, email header, MLS sheet) that I can customize with my branding, logo, hero image, and agent details from the editor sidebar
*So that* I can ship pixel-perfect, print-ready marketing materials in minutes without touching layout

---

## Acceptance Criteria

### Slot infrastructure (Milestone M-DESIGN-06)
- [x] **AC1:** `BaseElement` in `client/src/lib/canvasTypes.ts` gains an optional `slot?: string` field; change is additive (no existing element type breaks).
- [x] **AC2:** New `client/src/lib/templateSlots.ts` exports `findElementsBySlot(slot)`, `getSlotValue(slot)`, and `updateSlot(slot, patch)` that read/write `useCanvasStore` elements by `slot` tag with a single history push.
- [x] **AC3:** Slot customization UI is integrated into the existing `RightSidebar.tsx` tabs (Design, Property, Agent) via reusable `TemplateSlotSection` component — no separate "Customize" tab added.
- [x] **AC4:** Slot sections show Brand (logo upload, accent color, brand name), Property (hero image, headline, price, facts/features), Agent (name, phone, email, photo, RERA) fields — editing a field updates the matching canvas element live.
- [x] **AC5:** When the loaded design has no slotted elements, slot sections degrade gracefully with a "manual edit" hint and do not throw.

### Premium template library (Milestone M-DESIGN-07)
- [x] **AC6:** New `client/src/lib/premiumTemplates.ts` exports 5 `StarterCanvasTemplate` entries with exact pixel dimensions: `premium-ig-story-listing` (1080×1920), `premium-square-listing` (1080×1080), `premium-open-house-flyer` (2480×3508, A4 300 DPI), `premium-market-report` (1200×400), `premium-mls-listing-sheet` (1280×960).
- [x] **AC7:** Each premium template ships an inline `data:image/svg+xml` thumbnail that is a pixel-accurate mini-render of its layout (not a generic shape).
- [x] **AC8:** Each premium template's elements carry `slot` tags for the branding/content fields listed in the spec so the sidebar customization sections can drive them.
- [x] **AC9:** All 5 premium templates are registered in `galleryTemplateCatalog.ts` so `isGalleryTemplateId` / `getGalleryCanvasTemplateById` resolve them and `EditorLayout` loads them without an API round-trip.
- [x] **AC10:** No model names (GPT-4o, Ideogram, etc.) appear in any template name, badge, label, or thumbnail text (rule — Model Opacity). Format badges only: `9:16`, `1:1`, `A4 · 300dpi`, `3:1`, `MLS`.

### Gallery rendering
- [x] **AC11:** `TemplatesPage.tsx` renders premium templates with uniform card heights (aspect-[4/3] frame with object-contain), "Premium" pill, and format badge. Backend AI-layout templates filtered out — only visual canvas templates appear.
- [x] **AC12:** Clicking "Use Template" on a premium card opens the editor with the correct template loaded at its native canvas dimensions.

### Export correctness
- [x] **AC13:** `exportCanvasAsImage` and `generateThumbnail` in `canvasState.ts` derive `width`/`height` from `useCanvasStore` `canvasWidth`/`canvasHeight` (no longer hardcode 1200×800). `exportCanvasToImage` in `canvasExport.ts` uses an adaptive scale (1 for print-DPI artboards ≥2000px, 2 otherwise). Text word-wraps correctly in exports.

### Canvas fit & element manipulation
- [x] **AC14:** All premium templates open fitted to the viewport immediately on load — no overflow/clipping. Fit updates on window resize, sidebar resize, and template switch. (`useLayoutEffect` + `ResizeObserver` in `CenterCanvas.tsx`.)
- [x] **AC15:** Canvas element drag and resize use `scale={zoom}` on `react-rnd` so coordinate calculations are correct at any zoom level. Resize handles are visible, zoom-invariant (8px fixed apparent size), and only appear on the selected element.

### Gates
- [x] **AC16:** `npm run check` passes — zero TypeScript errors.
- [x] **AC17:** `npm run test:unit` passes — no regressions (41/41).

---

## Premium Template Spec (reference)

| # | ID | Name | Badge | Canvas | Channel |
|---|----|------|-------|--------|---------|
| 1 | `premium-ig-story-listing` | Premium Listing — Story | `9:16` | 1080×1920 | Social |
| 2 | `premium-square-listing` | Luxury Home Showcase | `1:1` | 1080×1080 | Social |
| 3 | `premium-open-house-flyer` | Open House Flyer — Print Ready | `A4 · 300dpi` | 2480×3508 | Print |
| 4 | `premium-market-report` | Market Report — Email Header | `3:1` | 1200×400 | Web |
| 5 | `premium-mls-listing-sheet` | MLS Listing Sheet | `MLS` | 1280×960 | MLS |

Slot vocabulary (canonical): `brand.logo`, `brand.accentColor`, `brand.name`, `property.heroImage`, `property.galleryImage`, `property.headline`, `property.price`, `property.facts`, `property.features`, `property.location`, `property.description`, `property.specs`, `openHouse.date`, `openHouse.time`, `report.headline`, `report.kpis`, `report.period`, `agent.name`, `agent.phone`, `agent.email`, `agent.photo`, `agent.rera`, `agent.cta`.

---

## Out of Scope

- New backend `Template` rows or API endpoints (premium templates stay client-side)
- PDF export (deferred — landing page already says "coming soon")
- Brand Kit persistence beyond existing stores
- Multi-language / RTL layouts
- Adding a 6th template (LinkedIn 16:9 banner) — deferred

---

## Engineering / PR

- **Branch:** `feat/design-us-design-012-premium-templates`
- **PR:** #11
- **Primary files touched:**

| File | Change |
|------|--------|
| `client/src/lib/canvasTypes.ts` | Add optional `slot?: string` to `BaseElement` |
| `client/src/lib/templateSlots.ts` | NEW — slot read/write helpers |
| `client/src/lib/premiumTemplates.ts` | NEW — 5 premium canvas templates |
| `client/src/lib/starterCanvasTemplates.ts` | NEW — kept type/helpers only; old 5 starters removed |
| `client/src/lib/galleryTemplateCatalog.ts` | Register premium template IDs |
| `client/src/lib/canvasState.ts` | Export/thumbnail size-from-store + zoom floor fix |
| `client/src/lib/canvasExport.ts` | Adaptive scale + `wrapTextToWidth` text wrapping |
| `client/src/components/editor/CustomizePanel.tsx` | NEW — standalone customize panel (kept for reference) |
| `client/src/components/editor/TemplateSlotSection.tsx` | NEW — reusable slot section embedded in sidebar tabs |
| `client/src/components/editor/RightSidebar.tsx` | 3-tab layout; slot sections integrated per-tab |
| `client/src/components/editor/CenterCanvas.tsx` | `useLayoutEffect` fit + `ResizeObserver` + absolute positioning |
| `client/src/components/editor/EditorLayout.tsx` | Template load via `getGalleryCanvasTemplateById` |
| `client/src/components/pages/TemplatesPage.tsx` | Premium cards, uniform height, API template filter |
| `client/src/components/canvas/TextElement.tsx` | `scale={zoom}` on `Rnd`, zoom-invariant resize handles |
| `client/src/components/canvas/ShapeElement.tsx` | `scale={zoom}` on `Rnd`, zoom-invariant resize handles |
| `client/src/components/canvas/ImageElement.tsx` | `scale={zoom}` on `Rnd`, zoom-invariant resize handles |

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-012-01 | Manual | P0 | Open Templates gallery → 5 premium cards render with uniform height + Premium pill | ✅ | |
| TC-DS-012-02 | Manual | P0 | Click "Use Template" on Story (1080×1920) → editor opens at correct dimensions, fitted to viewport | ✅ | |
| TC-DS-012-03 | Manual | P0 | Open A4 flyer (2480×3508) → template fits viewport immediately, no clip | ✅ | Fit: 26% |
| TC-DS-012-04 | Manual | P0 | Open any premium template → Design tab → slot sections visible; edit headline → canvas updates live | ✅ | |
| TC-DS-012-05 | Manual | P0 | Upload logo → `brand.logo` element updates on canvas | ✅ | |
| TC-DS-012-06 | Manual | P1 | Load a non-slotted design → slot sections show graceful hint, no errors | ✅ | |
| TC-DS-012-07 | Manual | P0 | No model names appear anywhere in template labels/badges/thumbnails | ✅ | |
| TC-DS-012-08 | Manual | P0 | Click element → drag → element moves to correct position (no diagonal snap) | ✅ | scale={zoom} fix |
| TC-DS-012-09 | Manual | P0 | Resize element → handles appear at correct position, smooth | ✅ | zoom-invariant handles |
| TC-DS-012-10 | Manual | P0 | Backend API template IDs (DB templates) do NOT appear in gallery | ✅ | Filtered out |
| TC-DS-012-11 | Auto | P0 | `npm run check` — zero TypeScript errors | ✅ | |
| TC-DS-012-12 | Auto | P0 | `npm run test:unit` — all unit tests pass (41/41) | ✅ | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] `npm run check` passes
- [x] `npm run test:unit` passes (41/41)
- [x] Manual flow verified on `localhost:5000` (gallery → editor → customize → export)
- [ ] PR opened and merged (PR #11)
- [x] No console errors for the changed flow
- [x] TASKS.md task list fully checked
- [x] AGILE_INDEX.md + PROJECT_CONTEXT counters updated

---

*Story created: 2026-06-30 | Closed: 2026-07-02*
