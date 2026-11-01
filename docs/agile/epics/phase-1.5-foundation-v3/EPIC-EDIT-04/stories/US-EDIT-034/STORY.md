# Story Card — US-EDIT-034

> **Status:** Implemented and verified locally — milestone merge pending
> **Feature:** N/A — approved V3 editing capabilities
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-11-v3-editor-slice](../../milestones/M-EDIT-11-v3-editor-slice.md)
> **Linear:** Unassigned
> **Size:** M
> **Created:** 2026-11-01 | **Closed:** —
> **Prerequisites:** US-EDIT-031 foundation; US-EDIT-032 geometry shared through root-owned canvasTypes.ts; US-EDIT-033 consumes style/rotation controls

---

## Story

*As a* solo real estate agent editing a saved listing design
*I want* to rotate elements and apply borders or shape shadows
*So that* I can produce polished listing artwork with matching canvas and downloaded output.

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When an unlocked text, shape or image is selected, `client/src/components/canvas/RotationHandle.tsx` provides the Rotation contract below, and when border/shadow values are applied the native element renderer and `client/src/lib/canvasExport.ts` produce matching styling after save/reload; prior documents with absent optional properties retain their previous appearance.
- [x] **AC2 [error-path]:** When rotation is cancelled with Escape, the prior angle and history are unchanged; locked elements cannot rotate, non-finite styling is rejected or normalized before drawing, hidden/Preview elements expose no editing handles, and a failed PNG export uses the existing visible export error without marking the document saved.

### Rotation and styling contract

- A circular rotation handle sits outside the selected text/image/shape bounds, stays consistent in screen size across zoom, rotates around element centre, and displays live degrees. Shift snaps to 15-degree increments. An accessible numeric angle popover allows keyboard editing. Lines use endpoint orientation instead.
- Rotation previews are transient and completed gestures make exactly one undo/autosave revision. Escape restores the starting angle. Preview hides handles; locked selection disables editing. Element-specific drag/resize and inline text editing remain usable.
- Shared model adds shape strokeStyle solid/dashed/dotted and optional shadow {color,opacity,blur,offsetX,offsetY}; images add optional borderColor/borderWidth/borderStyle. Absent properties mean current solid border/no shadow/no new image border.
- Shape and image borders support none/solid/dashed/dotted and 0–20px thickness. Rounded image clipping and border match the existing fit/flip/filter rendering.
- Shape shadow uses colour, 0–100% opacity, blur 0–100px and offsets -100..100 design pixels. None removes shadow. Fill/border/shadow opacity remain distinct from whole-element opacity.
- Shared elementStyles helpers supply CSS and Canvas rendering semantics for border dashes/shadows. PNG export renders line geometry, image borders and shape shadows consistently with canvas, including rotation and opacity. No SVG/PDF addition.
- Desktop-only verification at 1191x668 and 1440px width in light/dark/system; this story does not introduce a mobile shell. UI themes do not recolour artwork.

## Out of Scope

- Does not implement Crop, attached connectors, line labels, Animate, Position or Style.
- Does not implement AI image modifications, BG remover, eraser, Magic tools, upscale, generation or paid-provider calls.
- Does not change approved shell layout, default editor route, authentication, plan limits or backend schema.
- Does not add performance optimizations, SVG/PDF export, collaboration or unrelated V3 roadmap features.

## Engineering / PR

- **Branch:** `feat/edit/m-11-v3-editor-slice`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/canvas/TextElement.tsx`
  - `e2e/v3-element-tools.spec.ts`
  - `e2e/v3-approved-shell.spec.ts`
  - `scripts/run-v3-element-browser.mjs`
  - `client/src/lib/canvasTypes.ts`
  - `client/src/components/canvas/ShapeElement.tsx`
  - `client/src/components/canvas/ImageElement.tsx`
  - `client/src/components/canvas/RotationHandle.tsx`
  - `client/src/lib/canvasExport.ts`
  - `client/src/lib/elementStyles.ts`
  - `client/src/components/editor/v3/v3-editor.css`
  - `client/src/lib/__tests__/elementStyles.spec.ts`
  - `client/src/lib/__tests__/canvasExport.spec.ts`
  - `client/src/components/canvas/__tests__/RotationHandle.spec.tsx`
  - `e2e/v3-element-toolbars.spec.ts`
  - `e2e/v3-slice.config.ts`
  - `scripts/v3-toolbar-smoke.mjs`
  - `Mockups/approved-v3-editor/IMPLEMENTATION_STATUS.md`

## AI Implementation Prompt

```text
Context: InfographicAI SaaS — React18/Vite, NestJS11 API3001, Prisma6, Tailwind3/shadcn, Wouter, Zustand/React Query. Read AGENTS.md.
Story: US-EDIT-034 — Rotation handles, borders and local shape shadows
Read this STORY.md including its normative contracts and TASKS.md. Implement AC1 and AC2 exactly; preserve approved Navy/Teal shell and old documents. Touch ONLY Primary files touched above. Do not implement Out of Scope. Obtain current Orion harden lock before coding. You are not alone: root owns shared canvasTypes.ts; coordinate interfaces and do not revert another agent's edits.
Run npm run check, npm run test:unit, npm run test:unit:client and applicable browser gates. Report files changed, each AC result and actual test evidence. Do not mark Done before PR merge.
```

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-EDIT-034-01 | Unit | P0 | happy-path: When an unlocked text, shape or image is selected, provid… | ✅ | |
| TC-EDIT-034-02 | Unit | P0 | error-path: When rotation is cancelled with Escape, the prior angle a… | ✅ | |
| TC-EDIT-034-03 | Auto (unit) | P1 | Escape restores original angle with no history; locked and Preview selections cannot mutate. | ✅ | |
| TC-EDIT-034-04 | Manual | P1 | Zoom/pan edge placement, keyboard numeric rotation and malformed style inputs remain finite. | ✅ | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] npm run check passes without new TypeScript errors
- [x] npm run test:unit and npm run test:unit:client pass without regressions
- [x] Approved desktop flow manually verified on localhost:5000 or documented equivalent dev port
- [ ] PR merged (PR #_____)
- [x] No console errors in changed flow
- [x] [TASKS.md](./TASKS.md) fully checked
- [ ] STORY.md status updated to ✅ Done



## Implementation evidence — 2026-11-01

[Toolbar verification](../../../../../../../Mockups/approved-v3-editor/TOOLBAR_VERIFICATION.md): 811 backend +465 client tests pass, one existing skip; 48 browser regressions pass, plus final sidebar/theme and legacy-line compatibility subsets. Real authenticated API/database save/reload/export smoke passes with cleanup. All independent code-review findings corrected. Formal Done and PR merge remain pending.
