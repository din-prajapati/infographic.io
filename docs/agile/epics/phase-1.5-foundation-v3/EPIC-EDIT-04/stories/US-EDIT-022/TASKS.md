# Tasks — US-EDIT-022

> **Story:** [STORY.md](./STORY.md) — Reusable templates and independent saved Designs
> **Branch:** `codex/v3-arrange-opus`
> **PR:** #_____
> **PR scope:** Reusable templates and independent saved Designs; no AI Assistant or live providers.
> **Prerequisites:** US-PROP-004, US-EDIT-025, US-EDIT-020

## Four-Pillars Pre-flight

- [ ] **Brain** — Read STORY.md and approved Mockups/listing-workflow-v1/REFINEMENT.md / P1-ESSENTIALS.md; resolve each AC to observable contract assertions before changing code.
- [ ] **Muscle** — Read every Primary file below, or its existing dependency if new; verify actual V3 runtime import paths and source ownership; do not alter unrelated work.
- [ ] **Map** — Read `../../ARCHITECTURE.mmd`, trace Property/profile → pending record → Apply → artwork/applied snapshot → template/design persistence → review → existing PNG renderer.
- [ ] **Env** — Read `../../ENV.yaml` and all scaffold.json rules_loaded; use existing local credentials without logging them; check localhost:5000/3001 and document actual availability. Schema deployment is separate from generating migration source.

## Primary files to touch (scope lock)

- `client/src/lib/v3TemplateWorkflow.ts` — Create reusable template payload and independent design from pending listing
- `client/src/components/editor/v3/V3Editor.tsx` — Integrate Listing/Template Fields/save actions into actual opt-in V3
- `client/src/components/editor/v3/V3Panels.tsx` — Route Listing/Agent/Brand/Template Fields and saved template/design actions
- `client/src/components/editor/v3/v3-editor.css` — Shell integration responsive states using existing tokens
- `client/src/lib/__tests__/v3TemplateWorkflow.spec.ts` — Template fact stripping, placeholders and independent snapshots
- `client/src/components/editor/v3/__tests__/V3Panels.spec.tsx` — Panel routing and save action integration regression tests
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-022/STORY.md` — Record AC/test evidence and implementation status
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-022/TASKS.md` — Record task progress and verification
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-022/scaffold.json` — Maintain exact scope scaffold

## Tasks

### T1 — Reusable template/independent design payloads with tests

- [ ] Define fact/photo stripping and two-listing independence assertions first; implement clone/fill/placeholder helpers with no prior-listing leakage.
- `client/src/lib/v3TemplateWorkflow.ts`
- `client/src/lib/__tests__/v3TemplateWorkflow.spec.ts`

**Effort:** S


### T2 — Actual V3 shell wiring and save/navigation regression tests

- [ ] Root owns integration. Define routing/save-status tests first; connect controlled Listing/Agent/Brand/Fields components and existing authenticated persistence without changing opt-in route or Assistant.
- `client/src/components/editor/v3/V3Editor.tsx`
- `client/src/components/editor/v3/V3Panels.tsx`
- `client/src/components/editor/v3/v3-editor.css`
- `client/src/components/editor/v3/__tests__/V3Panels.spec.tsx`

**Effort:** S

### T3 — Verify and record evidence

- [ ] Run required focused/full gates and record exact AC/TC findings in STORY.md; keep unchecked items honest.
- [ ] Update TASKS.md and scaffold.json only as needed; Story acceptance text remains certification-locked.
- [ ] Root coordinates all commits. Define tests before implementation inside each task, then commit the passing test+source group; no separate red-test commit is required. Do not revert other agents' changes.

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
- `client/src/components/canvas/ImageElement.tsx` — Render explicit empty linked-photo placeholders (required by AC3).

## Local integration verification — 2026-11-13
Implementation integrated on codex/v3-arrange-opus. Full Gate1, focused/new browser and real database evidence are recorded in docs/research/2026-11-13-V3-LISTING-IMPLEMENTATION.md. Story closure/merge is not claimed; broad candidate visual/accessibility regression remains pre-merge work. Root coordinates commits; no failing-test-only commits.
