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

## Approved live geometry correction — 2026-11-04

- [x] **AC3 [happy-path]:** When selected text, image or shape moves or resizes in V3, the Selection geometry output in `V3Canvas.tsx` updates width/height/x/y during the gesture in design pixels at any zoom. Transient preview never writes document state/history/autosave; completion uses the existing single commit. End/cancel/selection change/unmount clears preview. Legacy editor behavior remains unchanged. This amendment additionally scopes V3Canvas.tsx, V3Lines.spec.tsx and e2e/v3-element-toolbars.spec.ts for the preview adapter and regression evidence.

## Approved small styling and image-fit extension — 2026-11-04

- [x] **AC4 [happy-path]:** When an image uses explicit cover/contain/fill, `ImageElement.tsx` and canvasExport.ts honor the same fit for ordinary and AI-imported images without clearing source/AI metadata; absent AI-import fit retains its previous contain appearance. Existing crop records retain their established crop behavior without exposing Crop. Reset still preserves source, fit, geometry and rotation while resetting documented appearance. A new optional lineCap butt/round supports rounded end points in SVG and PNG; absent lineCap preserves prior dotted-round/otherwise-butt semantics and old documents need no migration. Invalid lineCap is rejected by existing line validation; save/reload retains valid optional caps. New native-shape, text-letter-spacing, connectors and other engine features are excluded.

Additional exact scope: existing lineGeometry.ts/lineGeometry.spec.ts validation; existing canvasTypes.ts, LineElement.tsx, ImageElement.tsx, canvasExport.ts/canvasExport.spec.ts, and `client/src/components/canvas/__tests__/ImageElement.spec.tsx` for fit regression. Root owns toolbar integration and browser evidence under US-EDIT-033.

## Approved text spacing/anchor rendering — 2026-11-04

- [x] **AC5 [happy-path]:** When text has optional letterSpacing tracking−200..800 (1000=1em) and textAnchor start/middle/end, TextElement and canvasExport honor tracking and align the content at top/center/bottom inside its fixed element bounds, including wrapping and existing padding. Absence retains0 tracking/start and existing appearance. Title-case transformation capitalizes every word while preserving original stored content. Canvas and PNG share formatting/layout semantics; live previews never alter canonical document until completion. Existing inline editing, drag/resize, styles/list formatting/history, saved records and legacy callers remain usable; no automatic text-box resize or advanced More Settings.

Additional exact scope: client/src/lib/canvasTypes.ts; client/src/lib/textLayout.ts; client/src/lib/__tests__/textLayout.spec.ts; client/src/components/canvas/TextElement.tsx; client/src/components/canvas/__tests__/TextElement.spec.tsx; client/src/lib/canvasExport.ts; client/src/lib/__tests__/canvasExport.spec.ts. Root owns toolbar and validation.

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
| TC-EDIT-034-01 | Unit | P0 | happy-path: When an unlocked text, shape or image is selected, provid… | ✅ |  |
| TC-EDIT-034-02 | Unit | P0 | error-path: When rotation is cancelled with Escape, the prior angle a… | ✅ |  |
| TC-EDIT-034-03 | Unit | P0 | happy-path: When selected text, image or shape moves or resizes in V3… | ✅ |  |
| TC-EDIT-034-04 | Unit | P0 | happy-path: When an image uses explicit cover/contain/fill, `ImageEle… | ✅ | Full local unit/browser evidence below |
| TC-EDIT-034-05 | Unit | P0 | happy-path: When text has optional letterSpacing tracking−200..800 (1… | ✅ | Full local unit/browser evidence below |

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


## Nov4 browser feedback verification

AC3 locally verified. Final frontend/API type checks and 811 backend +486 client unit tests pass (one existing skip); complete V3 browser runner:56/56 pass, including live drag/resize, saved-line selection and compact menus. See TOOLBAR_VERIFICATION.md in the approved bundle for logs and limitations. Formal Done, PR merge and deployment remain pending.


## Detailed toolbar follow-up verification — 2026-11-04

Implemented the approved detailed extension locally. Final frontend/API type checks pass; unit suites811 backend +534 client =1,345 pass, one existing client skip; final complete V3 browser runner67/67 passes after final cancellation fixes. Actual checks include live style previews without history writes, safe Escape/fractional opacity, Fit/Reset including AI imports, visual line picker/caps, text spacing/font/More, retained geometry/history/save/reload/export and both themes. See approved bundle TOOLBAR_VERIFICATION.md for logs and limitations. No formal Done, commit, merge, push or deployment is claimed.

## Exact text-reference verification - 2026-11-04

Latest screenshot controls implemented locally. Final frontend/API type checks pass; 811 backend +555 client =1,366 passing unit tests, one existing client skip. Complete V3 browser runner69/69 passes. Both themes visually inspected at1242x668; retained evidence/text-ref-light.png and text-ref-dark.png in the approved bundle. Tracking/anchors/title-case cover DOM, wrapping, inline editing, PNG, save/reload and history boundaries. More Settings remains excluded. See TOOLBAR_VERIFICATION.md for logs and limits. No formal Done, commit, merge, push or deployment.
