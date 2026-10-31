# PR Task List — US-EDIT-031

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `feat/edit/m-11-v3-editor-slice`
> **PR:** #_____ | **Linear:** Unassigned

## Four Pillars Pre-flight

- [x] **Brain** — STORY.md reviewed and authoritative hardening lock current.
- [x] **Muscle** — scoped tasks and independent acceptance tests reviewed.
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) reviewed against runtime.
- [x] **Env** — [ENV.yaml](../../ENV.yaml) loaded; local runtime/auth availability verified.

## PR Scope Summary

New opt-in V3 shell proves existing-design text edit, acknowledged server save/reload and PNG export without changing the default editor.

## Task Breakdown

| Task | File | Type | AC(s) | Estimate | Responsibility |
|------|------|------|-------|----------|----------------|
| T0 | `PROJECT_CONTEXT.yaml` | docs | Planning | 5m | Reserve story/milestone counters; no runtime configuration change. |
| T1 | `client/src/lib/__tests__/v3DesignSession.spec.ts` | test | AC1–AC9 | 20m | Independent snapshot/acknowledgement and stale-response contracts. |
| T2 | `e2e/us-edit-031-v3-slice.spec.ts` | test | AC1–AC11 | 30m | Independent browser success/failure/regression fixtures; explicit mocked API evidence. |
| T3 | `e2e/v3-slice.config.ts` | test | AC1–AC11 | 10m | Isolated scoped browser runner. |
| T4 | `client/src/lib/v3DesignSession.ts` | feat | AC1–AC9 | 20m | Mandatory pure revision/session controller with load/save race guards; no new persistence format. |
| T5 | `client/src/hooks/useV3DesignSession.ts` | feat | AC1–AC9 | 30m | Server-backed session lifecycle, snapshot acknowledgement and request guards. |
| T6 | `client/src/components/editor/v3/V3Canvas.tsx` | feat | AC1–AC9, AC4 | 25m | New viewport using existing canvas elements and store. |
| T7 | `client/src/components/editor/v3/V3TextInspector.tsx` | feat | AC3, AC10 | 15m | Selected text content control. |
| T8 | `client/src/components/editor/v3/V3Editor.tsx` | feat | AC1–AC11 | 35m | New V3 shell composition, honest actions, status and error recovery. |
| T9 | `client/src/App.tsx` | feat | AC1, AC11 | 10m | Opt-in selection under existing auth route. |

Task rows are the file-to-task mapping and scope lock. No other production/test paths are authorized. Per-task commit format: `{type}(edit): T{n} {summary} — US-EDIT-031`. Line-level changes and evidence are filled during implementation, not fabricated in this stub.

## Exact Test Commands

```bash
npm run check
npm run test:unit
npm run test:unit:client -- --run src/lib/__tests__/v3DesignSession.spec.ts
npx playwright test --config=e2e/v3-slice.config.ts
```

The full unit command is authoritative Gate 1. Use the scoped client command only if the script forwards arguments as expected; otherwise run `cd client` then `npx vitest run src/lib/__tests__/v3DesignSession.spec.ts --reporter=verbose`.
Gate 2: inspect 1280px/1440px light and dark, keyboard controls and PNG appearance.
Gate 3: scoped Playwright command above (`npm run test:e2e` is the project-wide runner).
Gate 4: no backend edits; backend health/read/write availability still required for live-server smoke. Record that authenticated smoke independently from route-mocked tests.

## Task Checklist

- [x] T1 — independent unit contracts.
- [x] T2 — independent browser acceptance tests.
- [x] T3 — isolated browser config.
- [x] T4 — mandatory pure revision/session controller.
- [x] T5 — design session hook.
- [x] T6 — canvas viewport.
- [x] T7 — text inspector.
- [x] T8 — V3 shell.
- [x] T9 — opt-in route.
- [x] Gate 1 passes and applicable Gate 2/3 evidence recorded.
- [x] Real-server authenticated smoke completed.
- [ ] Independent review, milestone PR and closeout evidence recorded.

## Test Is Truth

Do not weaken or skip failing tests to make them pass. Record blockers and baseline failures honestly.

## Anti-Patterns to Avoid in This Story

- Does not implement Property/Contact panels, Brand, linking UI, templates/gallery entry changes, AI Assistant, generation, extraction, autosave or export-review validation.
- Does not change the default editor, existing editor tools, backend endpoints, plan limits, canvas engine, serialized design format or existing export implementation.
- Does not add phone layouts, new themes, SVG/PDF export, collaboration, offline fallback, shared-operation refactoring or performance optimizations.
- Does not claim a full V3 replacement or remove legacy editor code. The reference mockup supplies composition, not fake links, fake facts or simulated saves.
- Do not wrap EditorLayout/CenterCanvas or call legacy `saveDesign`; use shared low-level primitives and `designsApi`.
- Do not introduce a new state-management library or treat mocked tests as production API evidence.

## Opus review constraints

Implement AC1–AC11, including persisted-document revisions, metadata preservation, canonical-ID validation, blank listing reset, stale guards before restore, one Apply text undo boundary and existing export scale/false return. Test fixtures must assert preserved type/category/tags and generated thumbnail. No files added to scope.


## Final review constraints (same nine-file scope)

- Validate canvasData before listing reset/restore; false restore is a load error.
- Reset property/agent stores immediately before each validated existing-design restore and blank initialization, never while pending or on validation/network failure.
- Accept existing thumbnail placeholder fallback. Blank metadata: type design, category real-estate, tags empty array.
- Validate canonical returned POST ID and matching PUT ID at the existing adapter boundary; documented missing raw PUT ID is not observable without out-of-scope API changes.
- Use history.replaceState for first server ID without remount/GET. Add both data-canvas-container and data-canvas-viewport hooks.
- Text adds one undoable element; reused element mutations count as document revisions. Inspector Apply text is one step and field shortcuts bypass global canvas handlers.

## Approved final implementation boundary

- Size L, same integrated slice and nine-file scope; independent Opus approved keeping the end-to-end proof together.
- Existing dimensions must be numbers, finite and >0; types exactly text/shape/image; missing background uses existing white default.
- V3Editor owns its sole keyboard handler, guarded for input/textarea/contenteditable; no legacy hook mounted or modified.
- Apply text uses one existing updateElement call; it already pushes history, so never push again. TC-12 asserts history.past +1.
- Initial session design ID is stable, independent of live Wouter search after replaceState adoption.
- Baseline after successful synchronous restore; accepted blank-POST retry duplicate risk stays documented without API workarounds.
- Browser fixtures use data images; PNG pixels differ from background inside scaled text bounds; contrast uses existing design-contrast.spec.ts browser luminance probe.


## Verification evidence — 2026-10-31

T0 planning counters completed. T1–T9 implemented and tested; full results, independent Opus review, typed browser trace, screenshots and accepted limits are in [VERIFICATION.md](VERIFICATION.md). Full default unit invocation initially exhausted memory; complete backend/client suites subsequently passed with one worker. No tests were omitted. Remaining unchecked delivery item is intentional: Gemini CLI unavailable, milestone PR/main merge and product-owner approval pending.
