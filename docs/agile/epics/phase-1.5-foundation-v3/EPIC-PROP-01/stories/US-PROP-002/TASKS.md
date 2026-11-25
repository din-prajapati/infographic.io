# Tasks — US-PROP-002

> **Story:** [STORY.md](./STORY.md) — Structured global listing and reviewed text import
> **Branch:** `codex/v3-arrange-opus`
> **PR:** #_____
> **PR scope:** Structured global listing and reviewed text import; no AI Assistant or live providers.
> **Prerequisites:** None

## Four-Pillars Pre-flight

- [x] **Brain** — Read STORY.md and approved Mockups/listing-workflow-v1/REFINEMENT.md / P1-ESSENTIALS.md; resolve each AC to observable contract assertions before changing code.
- [x] **Muscle** — Read every Primary file below, or its existing dependency if new; verify actual V3 runtime import paths and source ownership; do not alter unrelated work.
- [x] **Map** — Read `../../ARCHITECTURE.mmd`, trace Property/profile → pending record → Apply → artwork/applied snapshot → template/design persistence → review → existing PNG renderer.
- [x] **Env** — Read `../../ENV.yaml` and all scaffold.json rules_loaded; use existing local credentials without logging them; check localhost:5000/3001 and document actual availability. Schema deployment is separate from generating migration source.

## Primary files to touch (scope lock)

- `shared/listingWorkflow.ts` — Define pure listing, structured pricing, provenance and reviewed-import contracts
- `api/tests/listing/listing-workflow.spec.ts` — Contract-first shared pricing, validation and reviewed import tests
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-002/STORY.md` — Record AC/test evidence and implementation status
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-002/TASKS.md` — Record task progress and verification
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-002/scaffold.json` — Maintain exact scope scaffold

## Tasks

### T1 — Shared structured listing and reviewed import contract

- [x] Define assertions in `api/tests/listing/listing-workflow.spec.ts`, then implement `shared/listingWorkflow.ts` as the same independently green task.
- [x] Cover structured pricing, exact decimal amounts, strict bounded validation, source evidence, ambiguous choices, agent suggestions, mixed-property rejection and stale review protection.
- [x] Run Gate 1 before commit.

**Commit:** `feat(prop): T1 add structured listing and reviewed text contract — US-PROP-002`
**ACs:** AC1–AC4 · **Effort:** S

### T2 — Verify and record evidence

- [x] Record exact Gate 1 and focused shared contract results in STORY.md.
- [x] Update TASKS.md and append parent EPIC.md Implementation Update after mandatory gates pass; do not claim merge.

**Commit:** `docs(prop): close US-PROP-002 — record structured listing evidence`
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


## Tracker reconciliation — 2026-11-14

2026-11-14 — reconciled from committed Opus baseline3e95a40; implementation present, release hardening/review and UI/font acceptance in progress; not merged Done. Current AC/task findings and fresh gate results are tracked in docs/research/2026-11-14-V3-RELEASE-HARDENING.md. Historical unchecked implementation/evidence rows are retained until this pass finishes verification; they are not interpreted as missing source code. Font/layout annotations are deliberately untouched.


## Fresh release evidence — 2026-11-14

Applicable implementation and automated verification tasks are complete; docs/research/2026-11-14-V3-RELEASE-HARDENING.md records exact commands/counts and independent review. No CSS/font changes were made in this repair. User visual/font acceptance, physical devices, final milestone delivery and merge remain pending.
