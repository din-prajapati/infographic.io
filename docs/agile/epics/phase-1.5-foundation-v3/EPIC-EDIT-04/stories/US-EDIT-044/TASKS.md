# PR Task List — US-EDIT-044

> **Story:** [STORY.md](./STORY.md)
> **Milestone branch:** `codex/v3-arrange-opus`
> **PR:** #_____ (milestone PR)
> **Linear:** Unassigned

## Four Pillars Pre-flight

- [x] **Brain** — typed binary ACs and all responsive clauses authored
- [x] **Muscle** — bounded file-specific tasks and exact checks below
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) read; existing V3 shell/session/store retained
- [x] **Env** — [ENV.yaml](../../ENV.yaml) read; existing local runtime and auth flows retained

Runtime trace must be recorded by root before code edits; harden lock remains required.

## PR Scope Summary

**One-liner:** Adapt the existing V3 editor shell to phone/tablet without changing artwork geometry.

`feat(edit): responsive V3 shell — US-EDIT-044`

## Task Breakdown

- [x] **T1 (1h; AC1/AC2):** `client/src/components/editor/v3/V3Editor.tsx` — compact actions, navigation and panel lifecycle.
- [x] **T2 (0.5h; AC1/AC2):** `client/src/components/editor/v3/v3-responsive.css` — scoped responsive shell/panel/tool/viewport rules.
- [x] **T3 (0.25h; AC1/AC2):** `client/src/components/editor/v3/v3-editor.css` — resolve conflicting shell constraints and import responsive rules.
- [x] **T4 (0.5h; AC1/AC2):** `client/src/components/editor/v3/V3Canvas.tsx` — actual available viewport fit; no geometry mutation.
- [x] **T5 (conditional; AC1/AC2):** `client/src/components/editor/v3/V3ElementToolbar.tsx` — viewport clamping only if CSS insufficient.
- [x] **T6 (conditional; AC1/AC2):** `client/src/lib/canvasState.ts` — fit helper optional available bounds; legacy defaults preserved.
- [x] **T7 (conditional; AC1/AC2):** `client/src/lib/v3Responsive.ts` — pure helper if needed.
- [x] **T8 (conditional; AC1/AC2):** `client/src/hooks/useV3Responsive.ts` — viewport observation if needed.
- [x] **T9 (conditional; AC1/AC2):** `client/src/lib/__tests__/v3Responsive.spec.ts` — helper boundary contracts if added.
- [x] **T10 (conditional; AC1/AC2):** `client/src/hooks/__tests__/useV3Responsive.spec.ts` — hook lifecycle contracts if added.
- [x] **T11 (0.75h; AC1/AC2):** `e2e/v3-responsive.spec.ts` — meaningful browser width/theme/focus/save/export/geometry contracts.
- [x] **T12 (AC1/AC2):** `e2e/v3-slice.config.ts` — include responsive spec if registration needed.
- [x] **T13:** Verification/report — record actual gates and manual results in this card; retain formal merge status pending.

Changes subsections are filled during implementation; optional files may be explicitly skipped with reason. Root owns grouped green commits for coupled implementation/tests; no failing test-only commit.

## Verification

- Gate 1: `npm run check`
- Gate 1: `npm run test:unit` (configure both Vitest runs for maximum 2 workers; preserve full suite coverage)
- Gate 2: `npx playwright test --config=e2e/v3-slice.config.ts e2e/v3-responsive.spec.ts --workers=1`
- Gate 2 regression: affected existing V3 desktop browser journeys, light/dark; record exact command/results.
- API/DB/payment gates: no new service/schema/payment paths; document applicability in actual verification record.
- Manual: localhost:5000 editor=v3, phone/tablet/desktop and short landscape; focus, visible canvas and document geometry.

## Runtime trace (2026-11-13, before responsive implementation)

`/editor?editor=v3` selects `V3Editor`, which imports `v3-editor.css` and composes `V3Canvas`, the shared tool panels and listing workflow. The running 320px browser contract measured the existing header at129px (required <=64px), confirming the wrapped header shown in the user's image. The base root enforces1024px, then the old760px override overlays a full-height left panel. `V3Canvas` observes `[data-canvas-viewport]` and calls `fitCanvasZoomToViewport`; this changes zoom/pan only. The implementation targets this chain and preserves the legacy fit path and document geometry. Red browser evidence: `.agent-logs/responsive-first.log`.

## Implementation and verification evidence

- T1–T6 implemented. T5 clamps formatting toolbar to available viewport; T6 uses measured padding only when viewport belongs to `.v3-editor`; legacy calculations are unchanged.
- T7–T10 skipped as unnecessary: responsive CSS, existing ResizeObserver and shell state suffice; no helper/hook was added.
- T11–T12 add actual UI tests and register them in the V3 browser config.
- Gate 1: `npm run check` PASS; backend unit suite840 PASS; frontend795 PASS with1 existing skip. Logs `.agent-logs/responsive-check.log`, `responsive-backend.log`, `responsive-client.log`.
- Production build PASS: `.agent-logs/responsive-build.log`; existing bundle-size/PostCSS/Browserslist warnings remain.
- Initial red check measured129px phone header. Final phone header56px; nav and sheet controls have44px minimum targets. Saved element geometry and800×600 document dimensions are asserted across320/375/390/768/820/1024/1440, light/dark.
- Browser HTTP/auth use controlled fixtures. Native iOS/Android hardware and the full backend-backed localhost:5000 journey were not rerun for this frontend-only slice. No new pinch gesture is introduced.
- Gate4 API/database/payment smoke is not applicable: no backend/schema/auth/payment code changes. The full backend unit baseline was still run.
- Wider `v3-approved-shell.spec.ts` run: five desktop editing/theme journeys pass. Three older listing/template cases fail against prior Listing changes (two still target removed `Property` navigation; one uses obsolete noncanonical template identity and same-design replacement assumptions). They were not removed or weakened. See `.agent-logs/responsive-final-browser.log`; overall historical E2E suite remains unqualified until these fixtures are reconciled.
- Formal status remains review/merge pending; do not treat this card as merged Done.
- Final scoped Gate2/3:19 responsive +10 existing Layers browser tests PASS (29 total), log .agent-logs/responsive-verified-browser.log. Phone375 light/dark and tablet768 screenshots reviewed; header56px and canvas retained above tools. Existing desktop coordinates, shape edits, text/autosave and theme checks also pass in broader shell run. Coupled T1–T13 layout/fit/tests form one atomic review change; formal merge/complete remains pending.

- Existing Listing regression PASS:5/5 save/apply/undo, reusable-template isolation, reviewed PNG and mobiletheme cases; .agent-logs/responsive-listing-regression.log. Final scoped browser total34/34. Historical three shell fixtures remain unchanged and separately recorded.

## Mockup-fidelity restoration — 2026-11-13 (scope reconciliation)

> Source: user direction in `docs/agile/sessions/2026-11-13-v3-claude-opus-handoff.md`; mismatch evidence in `docs/research/2026-11-13-V3-MOCKUP-FIDELITY-MATRIX.md`. Restores the approved `Mockups/listing-workflow-v1/editor.html` composition without adding feature scope. AC text is unchanged; Out of Scope (AI Assistant, connectors, photo ranking, route default) still applies.

### T3 — Restore approved UI/UX composition (matrix rows: 4, 16)

- [x] Restore approved visual/interaction composition; preserve persistence, pending/applied state and responsive behaviour; reconcile UI-structure tests without weakening behaviour assertions.
- `client/src/components/editor/v3/V3Canvas.tsx`
- `client/src/components/editor/v3/v3-responsive.css`
- `e2e/v3-responsive.spec.ts`

**Effort:** S


2026-11-14: release-hardening automated verification and independent review are recorded in docs/research/2026-11-14-V3-RELEASE-HARDENING.md. Historical fixture failures are reconciled without removed cases; font/device/UI acceptance and merge remain open.

## 2026-11-14 — Browser annotation refinement

- [x] T14 — Annotations responsive verification: new e2e/v3-browser-annotations.spec.ts and register in e2e/v3-slice.config.ts; update affected existing e2e fixture selectors to Details + Agent tab and relocated strip controls / toolbar More where necessary, never weaken assertions. Verify 1242x668 and narrow available canvas with both inspectors open, mobile375 and tablet768; both themes. No horizontal toolbar scroll, no page overflow; menu actions remain reachable. Existing save, export, selection/history remain unchanged.

User explicitly authorized annotations1–4 and6;5 is proposal only. Shared files have explicit root/agent ownership. Do not redesign fonts or implement Assistant/providers/default-editor cutover. Gates required; formal merge remains pending.

Verified 2026-11-14: frontend/API type checks pass; backend 853 and frontend 843 unit tests pass (one existing skip); production build passes; clean V3 browser 178/178 and Listing workflow 9/9 pass. Light/dark desktop, phone and tablet screenshots reviewed. Gate 4 N/A (UI only); physical-device acceptance and merge pending. Evidence: docs/research/2026-11-14-V3-BROWSER-ANNOTATIONS.md.
