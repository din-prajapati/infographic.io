# Tasks — US-PROP-004

> **Story:** [STORY.md](./STORY.md) — Pending/applied V3 listing and binding contract
> **Branch:** `codex/v3-arrange-opus`
> **PR:** #_____
> **PR scope:** Pending/applied V3 listing and binding contract; no AI Assistant or live providers.
> **Prerequisites:** US-PROP-002

## Four-Pillars Pre-flight

- [x] **Brain** — Read STORY.md and approved Mockups/listing-workflow-v1/REFINEMENT.md / P1-ESSENTIALS.md; resolve each AC to observable contract assertions before changing code.
- [x] **Muscle** — Read every Primary file below, or its existing dependency if new; verify actual V3 runtime import paths and source ownership; do not alter unrelated work.
- [x] **Map** — Read `../../ARCHITECTURE.mmd`, trace Property/profile → pending record → Apply → artwork/applied snapshot → template/design persistence → review → existing PNG renderer.
- [x] **Env** — Read `../../ENV.yaml` and all scaffold.json rules_loaded; use existing local credentials without logging them; check localhost:5000/3001 and document actual availability. Schema deployment is separate from generating migration source.

## Primary files to touch (scope lock)

- `client/src/lib/v3ListingWorkflow.ts` — Pure pending/applied snapshots, bindings, customizations, atomic Apply and Undo
- `client/src/hooks/useV3ListingWorkflow.ts` — Listing workspace Zustand state and editor orchestration
- `client/src/lib/canvasTypes.ts` — Add reusable field/image/compound binding and workflow snapshot types
- `client/src/lib/canvasState.ts` — Capture/restore workflow snapshots without canvas-to-pending hydration
- `client/src/lib/listingBindings.ts` — Add V3 guards and binding migration without changing legacy behavior
- `client/src/lib/v3DesignSession.ts` — Carry validated additive workflow state in document sessions
- `client/src/hooks/useV3DesignSession.ts` — Restore V3 state and subscribe to pending changes for autosave
- `client/src/components/canvas/TextElement.tsx` — Guard direct V3 linked-text edits through customization contract
- `client/src/lib/__tests__/v3ListingWorkflow.spec.ts` — Atomic apply, undo, binding, crop and snapshot isolation contracts
- `client/src/lib/__tests__/v3DesignSession.spec.ts` — Reopen and autosave snapshot regression cases
- `client/src/hooks/__tests__/useV3ListingWorkflow.spec.ts` — Workspace isolation and pending state orchestration tests
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-004/STORY.md` — Record AC/test evidence and implementation status
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-004/TASKS.md` — Record task progress and verification
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-004/scaffold.json` — Maintain exact scope scaffold


- `client/src/lib/slotIds.ts` — Register canonical listing field slots required by Apply

## Tasks

### T1 — Pure listing snapshot and reusable binding contract

- [x] Define contract assertions, then implement `client/src/lib/v3ListingWorkflow.ts`, `client/src/lib/canvasTypes.ts`, `client/src/lib/slotIds.ts` and `client/src/lib/__tests__/v3ListingWorkflow.spec.ts` together as one green task.
- [x] Run Gate 1 before commit.

**Commit:** `feat(prop): T1 add atomic listing snapshot and binding contract — US-PROP-004`
**ACs:** AC1, AC2, AC4 · **Effort:** S

### T2 — Isolated workspace orchestration

- [x] Define contract assertions, then implement `client/src/hooks/useV3ListingWorkflow.ts` and `client/src/hooks/__tests__/useV3ListingWorkflow.spec.ts` together as one green task.
- [x] Run Gate 1 before commit.

**Commit:** `feat(prop): T2 add isolated pending listing workspace — US-PROP-004`
**ACs:** AC1–AC4 · **Effort:** S

### T3 — Actual canvas persistence and linked-edit integration

- [x] Define session regression assertions, then implement `client/src/lib/canvasState.ts`, `client/src/lib/listingBindings.ts`, `client/src/lib/v3DesignSession.ts`, `client/src/hooks/useV3DesignSession.ts`, `client/src/components/canvas/TextElement.tsx` and `client/src/lib/__tests__/v3DesignSession.spec.ts` together as one green task.
- [x] Run Gate 1 before commit; confirm versioned snapshots do not hydrate canonical facts from artwork.

**Commit:** `feat(prop): T3 persist V3 listing and stage linked text edits — US-PROP-004`
**ACs:** AC1–AC4 · **Effort:** S

### T4 — Verify and record evidence

- [x] Record exact Gate 1, focused compatibility results, AC/TC evidence and remaining manual checks in STORY.md.
- [x] Update TASKS.md and append parent EPIC.md Implementation Update after mandatory gates pass; do not claim merge.

**Commit:** `docs(prop): close US-PROP-004 — record listing integration evidence`
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



## Local integration verification — 2026-11-13
Implementation integrated on codex/v3-arrange-opus. Full Gate1, focused/new browser and real database evidence are recorded in docs/research/2026-11-13-V3-LISTING-IMPLEMENTATION.md. Story closure/merge is not claimed; broad candidate visual/accessibility regression remains pre-merge work. Root coordinates commits; no failing-test-only commits.

## T5 — Authorized release hardening (2026-11-14)

- [x] Release hardening: canvas Undo/Redo across Apply must preserve coherent applied Listing snapshot and existing intentional customizations, without creating accidental overrides. A validated explicit custom photo after missing-photo Apply clears only that resolved skipped-image finding. Preserve unrelated later edits and Undo last apply guard. Files: client/src/hooks/useV3ListingWorkflow.ts, client/src/lib/v3ListingWorkflow.ts, corresponding existing unit tests, client/src/hooks/useCanvasStore.ts only if actual runtime requires metadata-aware history and coordinated ownership. No CSS/fonts.

User authorized standup points2/3. Root owns evidence, tracker reconciliation and commits; independent source/test ownership is coordinated. Existing ACs and exclusions remain unchanged. All applicable gates and independent review required; no merge/deploy. Physical-device acceptance and ongoing font annotations remain pending.


## Tracker reconciliation — 2026-11-14

2026-11-14 — reconciled from committed Opus baseline3e95a40; implementation present, release hardening/review and UI/font acceptance in progress; not merged Done. Current AC/task findings and fresh gate results are tracked in docs/research/2026-11-14-V3-RELEASE-HARDENING.md. Historical unchecked implementation/evidence rows are retained until this pass finishes verification; they are not interpreted as missing source code. Font/layout annotations are deliberately untouched.


## Fresh release evidence — 2026-11-14

Applicable implementation and automated verification tasks are complete; docs/research/2026-11-14-V3-RELEASE-HARDENING.md records exact commands/counts and independent review. No CSS/font changes were made in this repair. User visual/font acceptance, physical devices, final milestone delivery and merge remain pending.
