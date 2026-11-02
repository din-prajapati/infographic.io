# PR Task List — US-EDIT-033

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

- [x] **T4 (30m)** — Apply approved Nov2 toolbar presentation corrections: dots-only overflow, separate flip icons, direct checkerboard transparency and compact popovers; hide native V3 numeric spinner UI. Verify current actions/history and both themes without adding features.

## Exact file scope

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

Nov2 T4: final type checks and 1,286 unit tests passed (one existing skip); 51 browser cases passed, then four affected cases passed after the final Escape correction. Light/dark and text transparency screenshots inspected and saved. See TOOLBAR_VERIFICATION.md for exact sequence and logs. Merge remains pending.

Acceptance-derived tests, runtime and verification completed. Shared model/dispatch/toolbars are delivered atomically because isolated intermediate union changes fail compilation or omit line rendering. Commit carries T1–T3 and all three story IDs. See TOOLBAR_VERIFICATION.md for logs, review fixes and exclusions. Story stays merge-pending.
