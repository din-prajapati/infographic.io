# EPIC-DESIGN-04 — Premium Sample Templates & Brand Customization

> **Phase:** Phase 0.5 — Foundation (parallel)
> **Status:** ✅ Done
> **Linear Project:** LIN-EPIC-XXX
> **Target date:** 2026-07-15 | **Closed:** 2026-07-02
> **Owner:** Dinesh

---

## Goal

**Outcome:** Agents open the Templates gallery, pick one of 5 premium format-correct designs (Story, Square, A4 Print Flyer, Email Header, MLS Sheet), and instantly customize branding + content from the editor sidebar — exporting pixel-perfect, print/ship-ready infographics.

**Why now:** The landing page advertises 6 formats ("Instagram Story, Facebook Post, LinkedIn Banner, Open House Flyer Print Ready, Market Report, MLS Ready"), Brand Kit, and Instant Export. The product ships only 5 generic 1200×800 starter boards that are not format-correct, not print-DPI, and not slotted to the sidebar customization forms. This epic closes the gap between marketing claims and shipped capability.

**Success metric:** All 5 premium templates render in the gallery with accurate thumbnails, open into the editor at correct pixel dimensions, customize live via sidebar slot sections, and export at native resolution (A4 flyer exports at true 300 DPI). Element drag/resize works correctly at any zoom level.

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|--------|
| [M-DESIGN-06-slot-infra](milestones/M-DESIGN-06-slot-infra.md) | `slot` field + `templateSlots.ts` + `TemplateSlotSection` integrated into sidebar tabs | 2026-07-03 | ✅ Done |
| [M-DESIGN-07-premium-templates](milestones/M-DESIGN-07-premium-templates.md) | 5 pixel-perfect templates + gallery + canvas fit + element scale + export fix | 2026-07-10 | ✅ Done |

---

## Stories in this Epic

| Story ID | Title | Milestone | Status | PR |
|----------|-------|-----------|--------|----|
| [US-DESIGN-012](stories/US-DESIGN-012/STORY.md) | Premium Sample Templates + Slot Customization + Canvas Fit & Scale Fix | M-DESIGN-06 / M-DESIGN-07 | ✅ Done | — |

---

## Features in this Epic

| Feature ID | Scope | Stories |
|------------|-------|---------|
| F-DESIGN-04 | Slot-based template customization system | US-DESIGN-012 |
| F-DESIGN-05 | Premium format-correct template library (5 designs) | US-DESIGN-012 |

---

## Out of Scope (Epic Level)

- New backend `Template` rows or API endpoints (premium templates stay client-side starter templates)
- PDF export (landing page lists as "coming soon" — remains deferred)
- Brand Kit cross-session persistence beyond existing `BrandPaletteDialog` + agent/property stores
- Multi-language / RTL layouts
- Team/workspace brand kit sync (deferred B-07)

---

## Definition of Done (Epic)

- [x] All milestones closed
- [x] All stories have PR merged and STORY.md status = ✅ Done
- [x] Verified on localhost:5000 — gallery → editor → customize → element drag/resize → export
- [x] `npm run check` + `npm run test:unit` passing
- [x] AGILE_INDEX.md epic row updated + PROJECT_CONTEXT counters updated

---

## Architecture Notes

See [ARCHITECTURE.mmd](./ARCHITECTURE.mmd).

Key files relevant to this epic:
```
client/src/lib/canvasTypes.ts             (optional `slot` on BaseElement)
client/src/lib/templateSlots.ts           (NEW — slot read/write helpers)
client/src/lib/premiumTemplates.ts        (NEW — 5 premium templates)
client/src/lib/starterCanvasTemplates.ts  (NEW — type + helpers only; old starters removed)
client/src/lib/galleryTemplateCatalog.ts  (register premium IDs)
client/src/lib/canvasState.ts             (export/thumbnail size-from-store + zoom floor fix)
client/src/lib/canvasExport.ts            (adaptive scale + wrapTextToWidth)
client/src/components/editor/CustomizePanel.tsx     (NEW — standalone panel, kept for reference)
client/src/components/editor/TemplateSlotSection.tsx (NEW — shared slot section component)
client/src/components/editor/RightSidebar.tsx       (3 tabs; slot sections per-tab)
client/src/components/editor/CenterCanvas.tsx       (useLayoutEffect fit + ResizeObserver + absolute pos)
client/src/components/editor/EditorLayout.tsx       (template load via getGalleryCanvasTemplateById)
client/src/components/pages/TemplatesPage.tsx       (premium cards, uniform height, API filter)
client/src/components/canvas/TextElement.tsx        (scale={zoom}, zoom-invariant resize handles)
client/src/components/canvas/ShapeElement.tsx       (scale={zoom}, zoom-invariant resize handles)
client/src/components/canvas/ImageElement.tsx       (scale={zoom}, zoom-invariant resize handles)
```

---

*Epic created: 2026-06-30 | Closed: 2026-07-02*
