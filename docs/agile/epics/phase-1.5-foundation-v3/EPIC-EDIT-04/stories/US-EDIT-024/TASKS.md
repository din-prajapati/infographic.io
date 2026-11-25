# PR Task List — US-EDIT-024

> **Story:** [STORY.md](./STORY.md)

> **Milestone branch:** `feat/edit/m-11-v3-editor-slice` — dependent foundation branch; no merge claim.

> **PR:** #_____ | **Linear:** Unassigned

## Four Pillars Pre-flight

- [x] **Brain** — approved README/INTEGRATION_PLAN and prior031 story read; draft024 reconciled. Implementation must obtain current authoritative hardening lock before code.

- [x] **Muscle** — exact paths and acceptance-derived tests below; runtime source dependencies inspected. Existing031 regression evidence remains baseline, not evidence for this change.

- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) reviewed: ProtectedRoute → opt-in V3 → guarded session → existing store/renderers/exporter. Shell changes preserve that chain. Diagram's inspector placement is historical composition, not approved UI.

- [x] **Env** — [ENV.yaml](../../ENV.yaml) loaded: existing React/Vite/Wouter/Zustand runtime, proxy5000/API3001, existing authenticated smoke. This record does not assert services are currently running; verify before live smoke.

## Scope and Increments

This L card adapts existing capabilities, not their redesign. Execute T1–T3 (contract and shell), T4–T5 (canvas/panels), then T6–T9 (regression/evidence) as separately reviewable increments. Autosave agent owns hook/controller paths under US-EDIT-027; coordinate its public session return values without editing those files here. No changes to legacy editor files, canvas renderer/store, API or schema are authorized.

| Task | Exact file | Type | AC(s) | Estimate | Responsibility |
|------|------------|------|-------|----------|----------------|
| T1 | `client/src/components/editor/v3/__tests__/V3Shell.spec.tsx` | test | AC3–10,13 | 25m | Acceptance-derived selection, actual store operations, known geometry, eight sizes and error contracts. Comment exact expected value/location/condition before each test; mock dependencies, not tested adapters. |
| T2 | `client/src/components/editor/v3/V3Editor.tsx` | feat | AC1–2,11–13 | 30m | Approved shell composition, title/cloud spacing, rail, proximity/footer/Assistant integration, existing route/session/Preview/export/keyboard safety. |
| T3 | `client/src/components/editor/v3/v3-editor.css` | feat | AC11 | 20m | Scoped Navy/Teal light/dark roles, rounded icon strokes, states and reduced motion; artwork unaffected. |
| T4 | `client/src/components/editor/v3/V3Tools.tsx` | feat | AC3–5 | 25m | Direct strip tools, four supported shapes, line menu explicitly unavailable, universal selection actions. |
| T5 | `client/src/components/editor/v3/V3Panels.tsx` | feat | AC2,6,8–10 | 45m | Reuse leaf Property/Agent forms, palette/brand slot operations, existing Assistant; real templates/search/account-scoped recents/confirmation/states; existing upload/image path. Never mount whole legacy shell or prototype fake operations. |
| T6 | `client/src/components/editor/v3/V3Canvas.tsx` | feat | AC6–7,12 | 30m | Near-element formatting anchor, actual document readout and zoom, footer integration, Preview-preserving viewport. |
| T7 | `client/src/components/editor/v3/V3TextInspector.tsx` | feat | AC6,12 | 20m | Text panel draft with blur commit as single history boundary and Escape cancel. Exempt Preview-trigger blur and keep editor mounted hidden across Preview so uncommitted draft survives; normal selection change commits. |
| T8 | `e2e/v3-approved-shell.spec.ts` | test | AC1–13 | 35m | Black-box approved control journeys, exact store-visible outcome, real viewport scale, template state/confirmation, geometry, both theme states and safety failures. |
| T9 | `e2e/us-edit-031-v3-slice.spec.ts` | test | AC12–13 | 15m | Adapt approved locations and blur trigger; retain canonical ID, metadata, acknowledged save/races, keyboard, Preview draft and PNG regression assertions. No weakened or skipped tests. |
| T10 | `e2e/v3-slice.config.ts` | test | AC1–13 | 5m | Include both retained031 and new approved-shell specs in existing isolated runner. |
| T11 | `Mockups/approved-v3-editor/IMPLEMENTATION_STATUS.md` | docs | Delivery | 10m | Record implemented capabilities versus baseline031, evidence and precise remaining feature list; do not call mock/disabled line items implemented. |
| T12 | `client/src/components/editor/v3/__tests__/V3Panels.spec.tsx` | test | AC8–10 | 20m | Panel adapter loading, failed templates, replacement confirmation and successful recent-use contracts. |
| T13 | `Mockups/approved-v3-editor/evidence/{approved-light.png,approved-dark.png,live-smoke.json}` | evidence | AC11–13 | 5m | Durable responsive captures and sanitized authenticated smoke proof; no credentials. |

The table is the exact production/test/report scope lock. Story/TASKS/scaffold may be updated for honest evidence and hardening metadata. Any extra runtime path requires scope reconciliation before editing. Existing leafs are read/import dependencies only; don't modify them under this card.

## Contract Decisions

- Draft commit: normal Text content textarea blur commits changed text exactly once; Escape restores persisted element content without an undo entry. Preview entry/exit must preserve a pending draft by exempting Preview-trigger blur and retaining the editor component mounted hidden. Normal selection change commits before showing the next selected content.

- Geometry: one selection uses actual document dimensions and x/y; multiple selection displays count. This deliberately avoids presenting an arbitrary member's coordinates.

- Line: three named choices are visible and unavailable with honest explanation until separate renderer/file contracts. No simulated success or incorrect rectangle substitute.

- Existing panels: adapter reachability here does not implement future Look picker, linked-element manager, Assistant redesign, export review or extraction review cards.

- Theme: use existing application preference; no permanent appearance-review toolbar.

## Verification Commands

```bash

npm run check

npm run test:unit

npm run test:unit:client

npx playwright test --config=e2e/v3-slice.config.ts

```

Gate1 includes both backend and client unit suites. Gate2 inspect1191/1440px in light/dark with exact approved states and unchanged artwork. Gate3 scoped browser runner includes031 plus approved-shell tests. Gate4 backend edits are excluded; preserve authenticated real-server save/reload/export smoke separately from route-mocked tests. Run live smoke at localhost5000 when configured runtime is available; record blockage rather than fabricate success.

## Checklist

- [x] Authoritative hardening lock current for reconciled story.

- [x] T1 contract-first tests fail for expected missing behavior before implementation.

- [x] T2–T7 scoped implementation complete.

- [x] T8–T10 retained/new browser contracts pass.

- [x] T11 implementation/remainder report saved.

- [x] Gate1 and applicable Gate2/3 evidence recorded.

- [x] Authenticated live smoke recorded or explicitly outstanding.

- [ ] Independent review, milestone PR and merge evidence recorded.

No task is checked from design approval alone. Story stays In Progress until formal completion.

## Final local evidence — 2026-11-01

Frontend/API type checks, backend811/client426 unit tests (one existing skip), production build, 35-case full browser regression and the additional listing/Layers/Assistant journey pass. Two final light/dark1191×668 selected-tool captures pass. Fresh authenticated API/database save/reload/PNG smoke passes with scoped disposable cleanup. The first pre-implementation approved-rail browser contract failed on missing Templates as expected; focused unit setup initially failed on classic React setup before useful assertions. Independent review/PR/merge are still pending.
