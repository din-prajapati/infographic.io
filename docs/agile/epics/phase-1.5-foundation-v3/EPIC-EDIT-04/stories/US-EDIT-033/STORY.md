# Story Card — US-EDIT-033

> **Status:** Implemented and verified locally — milestone merge pending
> **Feature:** N/A — approved V3 editing capabilities
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-11-v3-editor-slice](../../milestones/M-EDIT-11-v3-editor-slice.md)
> **Linear:** Unassigned
> **Size:** M
> **Created:** 2026-11-01 | **Closed:** —
> **Prerequisites:** US-EDIT-031 foundation; US-EDIT-034 supplies optional border/shadow model and rendering; line toolbar interoperates with US-EDIT-032

---

## Story

*As a* solo real estate agent editing a saved listing design
*I want* to format text, shapes and images through compact contextual controls
*So that* I can retain familiar editing capabilities in a consistent modern workspace.

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When one unlocked text, shape, image or line is selected, `client/src/components/editor/v3/V3ElementToolbar.tsx` exposes the Toolbar contract below, every control changes the selected artwork, and image Edit opens V3ImageEditor in the approved left panel; all completed edits survive Undo/Redo, save/reload and PNG export.
- [x] **AC2 [error-path]:** When image replacement is cancelled or fails to decode, no source or metadata is changed and a visible retryable error is shown for failure; when selection becomes non-image the image sidebar closes, when an input is invalid no NaN/out-of-range data is committed, and locked/multiple selection never exposes enabled single-element mutations.

### Toolbar contract

| Selection | Visible actions | More / secondary controls |
|---|---|---|
| Text | Font, size, colour, bold, italic, alignment, More | Underline, strikethrough, case, bullet/numbered lists, opacity |
| Shape | Edit, Fill, Border, supported Corners, Opacity, Effects | None/Shadow effect details |
| Image | Edit, Replace, Flip, Corners, Opacity, More | Fit, Border, Reset |
| Line | Type, Colour, Stroke, Start/end decorations, Opacity | Swap ends |

- Text retains existing fonts, numeric 1–500px size plus/minus controls, bold synchronized with weight, and all old controls above. No font loading redesign.
- Shapes picker retains Rectangle/Square, Circle, Triangle, Star; type changes preserve geometry/style/embedded text. Fill supports brand/custom colour and transparent. Border supports none/solid/dashed/dotted, colour and synchronized 0–20px slider/input. Rectangles support 0–100 corner radius.
- Shape Effects offers None/Shadow using US-EDIT-034 local rendering. Image Flip offers horizontal/vertical; fit offers cover/contain/fill; radius 0–100; opacity 0–100 percent.
- Image Edit replaces approved left panel temporarily; Back restores previous panel. Preview selected image and Brightness/Contrast/Saturation sliders plus numeric inputs display -100..100 with neutral 0, mapping to stored 0..200 with neutral 100. Selection follows another image and closes for non-image selection.
- Adjustment Reset changes only three filters. Image toolbar Reset restores filters/overlay/flips/opacity/radius and removes border, preserving image source/geometry/fit. Replace preserves ID/geometry/rotation/style but clears old source-dependent AI/provider/import metadata; stores replacement metadata and refreshes thumbnail. Cancel is a no-op.
- Common controls remain visible; less frequent controls use labelled accessible popovers/More. One slider gesture/numeric commit makes one history entry. Pointer previews remain transient until completed; Escape cancels. No-op values do not create revisions.
- Toolbar anchors near selection and clamps to visible viewport, flips below if necessary and uses overflow for narrow space. Rounded Lucide icons, Navy/Teal tokens, subtle hover, selected states and keyboard focus apply in light/dark/system; artwork stays unchanged by UI theme.
- Duplicate/Delete remain in the approved strip. Multiple selection shows count/universal actions. Desktop-only: verify 1191x668 and 1440px width; no new mobile skeleton.

### Approved toolbar refinement — 2026-11-02

- Image toolbar keeps Edit/Replace text and exposes separate icon-only horizontal/vertical flip actions with pressed states; no Flip submenu.
- Overflow triggers across all element toolbars show only three dots, with accessible names and tooltips retained. Existing More actions remain reachable.
- Existing opacity control is a checkerboard icon on Text, Image, Shape and Line toolbars. Its compact Transparency popover pairs the existing0–100 opacity slider with an editable value;100 retains fully opaque semantics.
- Use stateful colour swatches, a text colour A/underline icon and compact themed border/corner controls, matching the approved visual reference without importing Canva features.
- Hide native number input spinner arrows for every number field within V3, including font size, adjustments, border/radius/shadow, rotation and canvas size; preserve typed input, keyboard operation and explicit font± buttons.
- Keep existing feature set, Navy/Teal tokens, light/dark/system support, shell placement and safe commit/history behaviour.

## Out of Scope

- Does not implement Crop, attached connectors, line labels, Animate, Position or Style.
- Does not implement AI image modifications, BG remover, eraser, Magic tools, upscale, generation or paid-provider calls.
- Does not change approved shell layout, default editor route, authentication, plan limits or backend schema.
- Does not add performance optimizations, SVG/PDF export, collaboration or unrelated V3 roadmap features.

## Engineering / PR

- **Branch:** `feat/edit/m-11-v3-editor-slice`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `e2e/v3-element-toolbars.spec.ts`
  - `Mockups/approved-v3-editor/TOOLBAR_DRAWING_PLAN.md`
  - `Mockups/approved-v3-editor/TOOLBAR_VERIFICATION.md`
  - `client/src/components/editor/v3/V3ElementToolbar.tsx`
  - `client/src/components/editor/v3/V3ImageEditor.tsx`
  - `client/src/lib/v3ElementEditing.ts`
  - `client/src/components/editor/v3/V3Editor.tsx`
  - `client/src/styles/v3-element-toolbar.css`
  - `client/src/lib/__tests__/v3ElementEditing.spec.ts`
  - `client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx`
  - `client/src/components/editor/v3/__tests__/V3ImageEditor.spec.tsx`

## AI Implementation Prompt

```text
Context: InfographicAI SaaS — React18/Vite, NestJS11 API3001, Prisma6, Tailwind3/shadcn, Wouter, Zustand/React Query. Read AGENTS.md.
Story: US-EDIT-033 — Modern element toolbars and image Edit sidebar
Read this STORY.md including its normative contracts and TASKS.md. Implement AC1 and AC2 exactly; preserve approved Navy/Teal shell and old documents. Touch ONLY Primary files touched above. Do not implement Out of Scope. Obtain current Orion harden lock before coding. You are not alone: root owns shared canvasTypes.ts; coordinate interfaces and do not revert another agent's edits.
Run npm run check, npm run test:unit, npm run test:unit:client and applicable browser gates. Report files changed, each AC result and actual test evidence. Do not mark Done before PR merge.
```

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-EDIT-033-01 | Unit | P0 | happy-path: When one unlocked text, shape, image or line is selected,… | ✅ | |
| TC-EDIT-033-02 | Unit | P0 | error-path: When image replacement is cancelled or fails to decode, n… | ✅ | |
| TC-EDIT-033-03 | Auto (unit) | P1 | Replacement cancel/failure preserves original; successful replacement retains ID/style and clears stale source metadata. | ✅ | |
| TC-EDIT-033-04 | Manual | P1 | Keyboard/popover edges, locked/mixed selection and both themes preserve approved skeleton. | ✅ | |

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

## Presentation refinement evidence — 2026-11-02

T4 implements the approved compact toolbar refinement above. Final frontend/API type checks and 811 backend +475 client unit tests pass, with one existing skip. Complete browser suite: 51 passed; final affected Escape/sidebar/theme subset: four passed. Saved themed and text transparency screenshots visually inspected. Historical real API/database smoke remains recorded separately above. No backend changes, added Canva features, main merge or deployment.
