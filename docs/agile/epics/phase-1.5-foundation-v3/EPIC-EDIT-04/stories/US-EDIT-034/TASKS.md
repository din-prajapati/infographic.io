# PR Task List — US-EDIT-034

> **Story:** [STORY.md](./STORY.md)
> **Branch:** feat/edit/m-11-v3-editor-slice | **PR:** #_____ | **Linear:** Unassigned

## Four Pillars Pre-flight

- [x] **Brain** — approved TOOLBAR_DRAWING_PLAN + normative STORY contracts reviewed; current official harden lock required before coding.
- [x] **Muscle** — exact file scope below and contract-first scenarios defined. Shared canvasTypes.ts owned by root; coordinate peers.
- [x] **Map** — EPIC ARCHITECTURE reviewed: protected opt-in V3 → session/Zustand → element rendering/export; preserve legacy route and existing API.
- [x] **Env** — ENV.yaml reviewed: React/Vite/proxy5000/API3001; isolated browser runner available. Verify service availability before live smoke; no secrets/paid AI calls.

## Three reviewable tasks

- [x] **T1 (45m)** — Establish acceptance-derived failing tests and model/helper contracts for AC1–AC2; reconcile only scoped types and interfaces.
- [x] **T2 (100m)** — Implement assigned runtime behaviors in normative STORY contract; preserve peer edits and approved shell.
- [x] **T3 (45m)** — Complete unit/browser/visual and save-reload-export regression evidence, fix scoped failures and report honest AC status. Root runs Gate1 before task commits.

## Exact file scope

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

Only these production/test/report paths may change; card/TASKS/scaffold/replay/locks are governance scope. Additional path changes require root reconciliation and current harden lock. This card is one M-sized frontend increment with dependent integration, not full milestone closure.

## Verification commands

```bash
npm run check
npm run test:unit
npm run test:unit:client
npx playwright test --config=e2e/v3-slice.config.ts
```

Gate1 mandatory. Gate2 themed desktop visuals/focus/edge placement. Gate3 browser lifecycle/export. Gate4 no backend/DI/schema changes; retain authenticated save/reload/export smoke when configured, separately from mocks. No Done/PR/merge claims until actual evidence.


## Delivery evidence

Acceptance-derived tests, runtime and verification completed. Shared model/dispatch/toolbars are delivered atomically because isolated intermediate union changes fail compilation or omit line rendering. Commit carries T1–T3 and all three story IDs. See TOOLBAR_VERIFICATION.md for logs, review fixes and exclusions. Story stays merge-pending.
