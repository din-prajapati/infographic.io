# PR Task List — US-EDIT-035

> **Story:** [STORY.md](./STORY.md)
> **Branch:** feat/edit/m-11-v3-editor-slice | **PR:** #_____ | **Linear:** Unassigned

## Four Pillars Pre-flight

- [x] **Brain** — user-approved COLOR_PAINT_PLAN and binary ACs recorded; official harden lock required before coding.
- [x] **Muscle** — exact scoped ownership and ordered tasks below; acceptance-derived tests precede runtime.
- [x] **Map** — EPIC ARCHITECTURE reviewed: opt-in V3 → session/store → shared renderers/export; existing endpoints remain.
- [x] **Env** — ENV.yaml reviewed; React/Vite/proxy5000/API3001 and isolated Playwright runner. Runtime availability is verified before live smoke; no secrets or paid-provider calls.

## Ordered tasks

- [x] **T1 (45m)** — Define acceptance-derived paint validation/resolution/serialization/render tests before runtime changes.
- [x] **T2 (120m)** — Implement the shared paint model and synchronized legacy fallback helpers, renderers/export, background dirty/history/persistence and short-dash engine support.
- [x] **T3 (60m)** — Verify full mandatory checks and browser integration with036/037; document old/new document and PNG evidence.

## Exact file scope

- `client/src/lib/canvasTypes.ts`
- `client/src/lib/paint.ts`
- `client/src/lib/__tests__/paint.spec.ts`
- `client/src/lib/canvasUtils.ts`
- `client/src/lib/canvasState.ts`
- `client/src/lib/__tests__/canvasState.paints.spec.ts`
- `client/src/hooks/useCanvasStore.ts`
- `client/src/hooks/__tests__/useCanvasStore.paints.spec.ts`
- `client/src/hooks/__tests__/useV3DesignSession.paints.spec.ts`
- `client/src/components/canvas/PaintSvg.tsx`
- `client/src/hooks/useV3DesignSession.ts`
- `client/src/lib/v3DesignSession.ts`
- `client/src/lib/__tests__/v3DesignSession.spec.ts`
- `client/src/components/editor/v3/V3Canvas.tsx`
- `client/src/components/canvas/TextElement.tsx`
- `client/src/components/canvas/ShapeElement.tsx`
- `client/src/components/canvas/ImageElement.tsx`
- `client/src/components/canvas/LineElement.tsx`
- `client/src/components/canvas/__tests__/TextElement.spec.tsx`
- `client/src/components/canvas/__tests__/ImageElement.spec.tsx`
- `client/src/lib/canvasExport.ts`
- `client/src/lib/__tests__/canvasExport.spec.ts`
- `client/src/lib/elementStyles.ts`
- `client/src/lib/__tests__/elementStyles.spec.ts`
- `client/src/lib/lineGeometry.ts`
- `client/src/lib/__tests__/lineGeometry.spec.ts`
- `client/src/lib/v3ElementEditing.ts`
- `client/src/lib/__tests__/v3ElementEditing.spec.ts`

Engine agent owns engine files. Root exclusively integrates V3Canvas background rendering and v3ElementEditing helper/reset seams after coordinating engine helpers. Root coordinates all shared types; no overwrite of peer work.

Card/TASKS/scaffold and official locks/replay are governance scope. No other paths without root reconciliation and lock refresh. Preserve peer edits. Implementation lines/changes are recorded only after actual work, not prefilled.

## Verification commands

```bash
npm run check
npm run test:unit
npm run test:unit:client
npx playwright test --config=e2e/v3-slice.config.ts
```

Gate1 mandatory. Gate2: both themes at1242x668 and1440 desktop. Gate3: color/stroke lifecycle, history, save/reload/PNG plus complete existing V3 regressions. Gate4 backend/DI/schema not triggered; preserve existing API and distinguish mocked browser tests from authenticated real-server smoke. No Done or delivery claim without actual evidence.

## Saved-document compatibility seam

- `client/src/components/editor/CenterCanvas.tsx` - root-owned display-only integration of backgroundPaint in the legacy artboard. No legacy color controls or editor route changes. Required so saved V3 backgrounds retain their paint when opened through the existing route.

Local verification 2026-11-05: all ordered tasks completed; type checks, 1,425 unit tests and 89 browser cases passed. Evidence: Mockups/approved-v3-editor/COLOR_PAINT_VERIFICATION.md. Merge and formal Done remain pending.
