# PR Task List — US-EDIT-037

> **Story:** [STORY.md](./STORY.md)
> **Branch:** feat/edit/m-11-v3-editor-slice | **PR:** #_____ | **Linear:** Unassigned

## Four Pillars Pre-flight

- [x] **Brain** — user-approved COLOR_PAINT_PLAN and binary ACs recorded; official harden lock required before coding.
- [x] **Muscle** — exact scoped ownership and ordered tasks below; acceptance-derived tests precede runtime.
- [x] **Map** — EPIC ARCHITECTURE reviewed: opt-in V3 → session/store → shared renderers/export; existing endpoints remain.
- [x] **Env** — ENV.yaml reviewed; React/Vite/proxy5000/API3001 and isolated Playwright runner. Runtime availability is verified before live smoke; no secrets or paid-provider calls.

## Ordered tasks

- [x] **T1 (45m)** — Define acceptance-derived stroke patterns, restoration, line cap/type and cancellation regression tests.
- [x] **T2 (120m)** — Replace only stroke/type menu sections and scoped styles with reference arrangements; retain separate036 color entries and all prior functionality.
- [x] **T3 (60m)** — Verify compact measurements/icons, live preview and regression browser suite in both themes; record mandatory gate evidence.

## Exact file scope

- `client/src/components/editor/v3/V3ElementToolbar.tsx`
- `client/src/styles/v3-element-toolbar.css`
- `client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx`
- `e2e/v3-element-toolbars.spec.ts`
- `Mockups/approved-v3-editor/COLOR_PAINT_VERIFICATION.md`

Root owns toolbar stroke/type sections, corresponding CSS and tests. Coordinate toolbar color entries with036 and consume035 engine enum/helper contract without editing engine files.

Card/TASKS/scaffold and official locks/replay are governance scope. No other paths without root reconciliation and lock refresh. Preserve peer edits. Implementation lines/changes are recorded only after actual work, not prefilled.

## Verification commands

```bash
npm run check
npm run test:unit
npm run test:unit:client
npx playwright test --config=e2e/v3-slice.config.ts
```

Gate1 mandatory. Gate2: both themes at1242x668 and1440 desktop. Gate3: color/stroke lifecycle, history, save/reload/PNG plus complete existing V3 regressions. Gate4 backend/DI/schema not triggered; preserve existing API and distinguish mocked browser tests from authenticated real-server smoke. No Done or delivery claim without actual evidence.


Local verification 2026-11-05: all ordered tasks completed; type checks, 1,425 unit tests and 89 browser cases passed. Evidence: Mockups/approved-v3-editor/COLOR_PAINT_VERIFICATION.md. Merge and formal Done remain pending.
