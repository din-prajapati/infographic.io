# PR Task List — US-EDIT-038

> **Story:** [STORY.md](./STORY.md)
> **Branch:** feat/edit/m-11-v3-editor-slice | **PR:** #_____ | **Linear:** Unassigned

## Four Pillars Pre-flight

- [x] **Brain** — four annotated user findings and binary typed ACs recorded; exact behavior defined in Story Annotation Contract. Official harden lock required before coding.
- [x] **Muscle** — file ownership and three ordered tasks below; acceptance-derived tests precede runtime.
- [x] **Map** — EPIC ARCHITECTURE reviewed: opt-in V3 shell → session/store → existing renderers/export; no new API.
- [x] **Env** — ENV.yaml reviewed; proxy5000/API3001 and isolated Playwright Vite runner; runtime health checked before live smoke. No secrets or paid calls.

## PR scope

Resolve the four new annotations through a functional shape Effects sidebar, readable editable alpha percent and observable text-anchor/image-Fit semantics while preserving the approved editor.

## Ordered tasks

- [x] **T1 (45m)** — Define acceptance-derived tests for Effects/sidebar lifecycle, opacity input, tall-box anchors and mismatched-aspect image fitting.
- [x] **T2 (120m)** — Implement the scoped UI and renderer corrections, retaining existing serialization/history and custom shadow controls.
- [x] **T3 (60m)** — Run mandatory gates, inspect both themed desktop layouts and retain evidence for all four annotations.

## Exact file scope

- `client/src/components/editor/v3/V3Editor.tsx`
- `client/src/components/editor/v3/V3Panels.tsx`
- `client/src/components/editor/v3/V3ElementToolbar.tsx`
- `client/src/components/editor/v3/V3EffectsPanel.tsx`
- `client/src/components/editor/v3/v3-effects-panel.css`
- `client/src/components/editor/v3/V3PaintPicker.tsx`
- `client/src/components/editor/v3/v3-color-panel.css`
- `client/src/styles/v3-element-toolbar.css`
- `client/src/components/canvas/TextElement.tsx`
- `client/src/components/canvas/ImageElement.tsx`
- `client/src/lib/textLayout.ts`
- `client/src/lib/canvasState.ts`
- `client/src/lib/canvasExport.ts`
- `client/src/lib/canvasTypes.ts`
- `client/src/lib/elementStyles.ts`
- `client/src/lib/v3ElementEditing.ts`
- `client/src/hooks/useV3ElementPreview.ts`
- `client/src/components/editor/v3/__tests__/V3EffectsPanel.spec.tsx`
- `client/src/components/editor/v3/__tests__/V3PaintPicker.spec.tsx`
- `client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx`
- `client/src/components/editor/v3/__tests__/V3Panels.spec.tsx`
- `client/src/components/canvas/__tests__/TextElement.spec.tsx`
- `client/src/components/canvas/__tests__/ImageElement.spec.tsx`
- `client/src/lib/__tests__/textLayout.spec.ts`
- `client/src/lib/__tests__/elementStyles.spec.ts`
- `client/src/lib/__tests__/canvasExport.spec.ts`
- `client/src/lib/__tests__/canvasState.safeGeometry.spec.ts`
- `client/src/lib/__tests__/v3ElementEditing.spec.ts`
- `client/src/hooks/__tests__/useV3ElementPreview.spec.ts`
- `e2e/v3-annotations.spec.ts`
- `e2e/v3-slice.config.ts`
- `Mockups/approved-v3-editor/ANNOTATION_VERIFICATION.md`
- `Mockups/approved-v3-editor/evidence/annotations-effects-light.png`
- `Mockups/approved-v3-editor/evidence/annotations-effects-dark.png`
- `Mockups/approved-v3-editor/evidence/annotations-opacity-dark.png`
- `Mockups/approved-v3-editor/evidence/annotation-text-anchor.png`
- `Mockups/approved-v3-editor/evidence/annotations-fit-dark.png`
- `client/src/lib/shapeEffects.ts`
- `client/src/lib/__tests__/shapeEffects.spec.ts`
- `client/src/hooks/useV3EffectsPanel.ts`
- `client/src/hooks/__tests__/useV3EffectsPanel.spec.ts`
- `client/src/components/canvas/ShapeElement.tsx`
- `client/src/components/canvas/__tests__/ShapeElement.spec.tsx`
- `client/src/components/editor/v3/V3Canvas.tsx`
- `client/src/lib/v3DesignSession.ts`
- `client/src/lib/__tests__/v3DesignSession.spec.ts`
- `client/src/hooks/useV3DesignSession.ts`
- `client/src/lib/paint.ts`
- `client/src/lib/__tests__/paint.spec.ts`

Card/TASKS/scaffold and official locks/replay are governance scope. Coordinate shared files with root; other agents are working and their edits must not be reverted. Exact line-level changes are recorded after implementation, not prefilled.

## File-to-task mapping

| Files | Task |
|-------|------|
| Scoped unit/browser test paths | T1, T3 |
| Scoped V3 sidebar/toolbar/picker components and styles | T2 |
| Scoped canvas renderer/layout/model/export helpers | T2 |
| Verification document and retained screenshot paths | T3 |

## Verification commands

```bash
npm run check
npm run test:unit
npx playwright test --config=e2e/v3-slice.config.ts
```

Gate1 mandatory. Gate2: light/dark screenshots at1242x668 and1440px desktop. Gate3: annotated flows, cancellation, history, save/reload/PNG and existing V3 regressions. Gate4 backend/DI/schema not triggered by this frontend-only story. Record isolated mocked persistence separately from authenticated real-server smoke.

## Anti-patterns

- Do not add nonfunctional effect cards or silently imply unsupported advanced effects.
- Do not verify anchor/Fit behavior using only equal content/frame sizes where no displacement is observable.
- Do not weaken failing tests, bypass harden or overwrite existing uncommitted peer changes.


## Existing color and regression integration seams

- `client/src/hooks/useV3ColorPanel.ts`
- `client/src/hooks/__tests__/useV3ColorPanel.spec.ts`
- `e2e/v3-element-toolbars.spec.ts`
- `e2e/v3-color-paints.spec.ts`

Root-owned: No Color clears all effect shadows; existing browser journeys enter the new Drop card instead of the removed Shadow popover. Existing assertions stay intact.

Local implementation 2026-11-05: T1 acceptance-derived RED tests, T2 sidebar/opacity/geometry implementation and T3 verification completed. Type checks, 1,445 unit tests and 98 browser cases pass. Five themed/reference captures retained; full evidence and limitations in Mockups/approved-v3-editor/ANNOTATION_VERIFICATION.md. No Git publication or formal Done.
