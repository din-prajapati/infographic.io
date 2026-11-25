# Tasks — US-EDIT-021

> **Story:** [STORY.md](./STORY.md) — Reviewed PNG export from actual V3 artwork
> **Branch:** `codex/v3-arrange-opus`
> **PR:** #_____
> **PR scope:** Reviewed PNG export from actual V3 artwork; no AI Assistant or live providers.
> **Prerequisites:** US-EDIT-022

## Four-Pillars Pre-flight

- [x] **Brain** — Read STORY.md and approved Mockups/listing-workflow-v1/REFINEMENT.md / P1-ESSENTIALS.md; resolve each AC to observable contract assertions before changing code.
- [x] **Muscle** — Read every Primary file below, or its existing dependency if new; verify actual V3 runtime import paths and source ownership; do not alter unrelated work.
- [x] **Map** — Read `../../ARCHITECTURE.mmd`, trace Property/profile → pending record → Apply → artwork/applied snapshot → template/design persistence → review → existing PNG renderer.
- [x] **Env** — Read `../../ENV.yaml` and all scaffold.json rules_loaded; use existing local credentials without logging them; check localhost:5000/3001 and document actual availability. Schema deployment is separate from generating migration source.

## Primary files to touch (scope lock)

- `client/src/lib/v3ExportReview.ts` — Pure findings and artwork revision token for async export safety
- `client/src/components/editor/v3/V3ExportReview.tsx` — Human review dialog with current findings and actual PNG download
- `client/src/components/editor/v3/v3-export-review.css` — Theme-aware responsive review dialog
- `client/src/lib/__tests__/v3ExportReview.spec.ts` — Missing, invalid, stale, overflow and async revision contracts
- `client/src/components/editor/v3/__tests__/V3ExportReview.spec.tsx` — Review acknowledgement and rendering failure cases
- `e2e/v3-listing-workflow.spec.ts` — Actual V3 two-listing save/reopen and PNG export browser journey
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-021/STORY.md` — Record AC/test evidence and implementation status
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-021/TASKS.md` — Record task progress and verification
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-021/scaffold.json` — Maintain exact scope scaffold

## Tasks

### T1 — Review findings and async export safety contracts

- [x] Define exact findings/revision assertions first; implement required/missing/stale/overflow/mismatch classification and reject changed-state asynchronous results.
- `client/src/lib/v3ExportReview.ts`
- `client/src/lib/__tests__/v3ExportReview.spec.ts`

**Effort:** S


### T2 — Accessible human review and actual PNG renderer integration

- [x] Define blocked/acknowledged/failure/focus UI assertions first; connect existing actual V3 PNG renderer, hold acknowledgement to reviewed state and preserve retry on render failure.
- `client/src/components/editor/v3/V3ExportReview.tsx`
- `client/src/components/editor/v3/v3-export-review.css`
- `client/src/components/editor/v3/__tests__/V3ExportReview.spec.tsx`

**Effort:** S


### T3 — Actual browser acceptance journey

- [x] Verify one Template creates two independent backend-saved Designs with manual photos; reopen both, apply/undo/customize and download actual PNG. Assert dimensions and stale-render rejection; record actual environment limitations rather than weakening assertions.
- `e2e/v3-listing-workflow.spec.ts`

**Effort:** S

### T4 — Verify and record evidence

- [x] Run required focused/full gates and record exact AC/TC findings in STORY.md; keep unchecked items honest.
- [x] Update TASKS.md and scaffold.json only as needed; Story acceptance text remains certification-locked.
- [x] Root coordinates all commits. Define tests before implementation inside each task, then commit the passing test+source group; no separate red-test commit is required. Do not revert other agents' changes.

**Effort:** S

## Test Commands

```bash
npm run check
npm run test:unit
```

Gate 2: for UI stories verify actual V3 at 375px and 1440px in both themes, keyboard/focus, layout and no console errors. Gate 4: for US-PROP-001 verify authenticated property/profile routes including 401, cross-org 404 and stale 409. Gate 3: `npx playwright test e2e/v3-listing-workflow.spec.ts` for final US-EDIT-021 journey. Gates not applicable to pure shared helpers must be documented with this reason; never silently skip a required check. Live DB smoke is required before reporting persistent listing capability verified.

## Anti-patterns

- Copying the mockup storage/runtime as production persistence.
- Hydrating pending listing facts from canvas/custom text on reopen.
- Touching outside this Primary list without reconciling scope and certification first.
- Treating browser-local recovery as a successful backend save.

## Live verification scope
- scripts/v3-listing-persistence-smoke.mjs — real API/Prisma/browser save/reopen audit with owned fixture cleanup (no HTTP mocks or store mutation).
- e2e/v3-listing-live.config.ts — optional dedicated live verification configuration.


## Local integration verification — 2026-11-13
Implementation integrated on codex/v3-arrange-opus. Full Gate1, focused/new browser and real database evidence are recorded in docs/research/2026-11-13-V3-LISTING-IMPLEMENTATION.md. Story closure/merge is not claimed; broad candidate visual/accessibility regression remains pre-merge work. Root coordinates commits; no failing-test-only commits.
- `e2e/v3-listing.config.ts`, `docs/research/2026-11-13-V3-LISTING-IMPLEMENTATION.md`, `docs/research/evidence/v3-listing-2026-11-13/live-result.json` — bounded verification configuration and actual delivery evidence.

## Mockup-fidelity restoration — 2026-11-13 (scope reconciliation)

> Source: user direction in `docs/agile/sessions/2026-11-13-v3-claude-opus-handoff.md`; mismatch evidence in `docs/research/2026-11-13-V3-MOCKUP-FIDELITY-MATRIX.md`. Restores the approved `Mockups/listing-workflow-v1/editor.html` composition without adding feature scope. AC text is unchanged; Out of Scope (AI Assistant, connectors, photo ranking, route default) still applies.

### T3 — Restore approved UI/UX composition (matrix rows: 15)

- [x] Restore approved visual/interaction composition; preserve persistence, pending/applied state and responsive behaviour; reconcile UI-structure tests without weakening behaviour assertions.
- `client/src/components/editor/v3/V3ExportReview.tsx`
- `client/src/components/editor/v3/v3-export-review.css`
- `client/src/components/editor/v3/__tests__/V3ExportReview.spec.tsx`

**Effort:** S

### T4 — Browser contracts for the refined listing UX (2026-11-13, listing UX refinement brief)

> Source: user brief "V3 Listing UX and Template Field Controls" (2026-11-13). Checkpoint: `refs/checkpoints/v3-listing-ux-refine-2026-11-13` + `.agent-logs/checkpoints/before-listing-ux-refine.patch`. No schema/API change; recommended display lengths are guidance, authoritative limits stay in `shared/listingWorkflow.ts`. Out of Scope unchanged (no live MLS/RERA, AI generation, poster extraction, P2 appearance controls).

- [x] Implement, test-first where behavioural; verify in browser at 1242×668 and both themes. Evidence 2026-11-13: `npm run check` exit 0; backend 840/840; client 808 passed + 1 existing skip; `npm run build` exit 0; Playwright listing 8/8 and V3 regression 124/124; Gate 2 screenshots in `.e2e-artifacts/mockup-fidelity/t4/` (1242×668 light/dark, 375 light/dark, 1440); Gate 3 N/A (no global token file change); Gate 4 N/A (no backend change). Details: `docs/research/2026-11-13-V3-MOCKUP-FIDELITY-MATRIX.md` § T4.
- `e2e/v3-listing-workflow.spec.ts`

**Effort:** S


## Tracker reconciliation — 2026-11-14

2026-11-14 — reconciled from committed Opus baseline3e95a40; implementation present, release hardening/review and UI/font acceptance in progress; not merged Done. Current AC/task findings and fresh gate results are tracked in docs/research/2026-11-14-V3-RELEASE-HARDENING.md. Historical unchecked implementation/evidence rows are retained until this pass finishes verification; they are not interpreted as missing source code. Font/layout annotations are deliberately untouched.


## Fresh release evidence — 2026-11-14

Applicable implementation and automated verification tasks are complete; docs/research/2026-11-14-V3-RELEASE-HARDENING.md records exact commands/counts and independent review. No CSS/font changes were made in this repair. User visual/font acceptance, physical devices, final milestone delivery and merge remain pending.
