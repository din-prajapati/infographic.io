# Tasks — US-EDIT-025

> **Story:** [STORY.md](./STORY.md) — Approved Listing overview, Property, Agent and Brand panels
> **Branch:** `codex/v3-arrange-opus`
> **PR:** #_____
> **PR scope:** Approved Listing overview, Property, Agent and Brand panels; no AI Assistant or live providers.
> **Prerequisites:** US-PROP-001, US-PROP-002, US-PROP-004

## Four-Pillars Pre-flight

- [x] **Brain** — Read STORY.md and approved Mockups/listing-workflow-v1/REFINEMENT.md / P1-ESSENTIALS.md; resolve each AC to observable contract assertions before changing code.
- [x] **Muscle** — Read every Primary file below, or its existing dependency if new; verify actual V3 runtime import paths and source ownership; do not alter unrelated work.
- [x] **Map** — Read `../../ARCHITECTURE.mmd`, trace Property/profile → pending record → Apply → artwork/applied snapshot → template/design persistence → review → existing PNG renderer.
- [x] **Env** — Read `../../ENV.yaml` and all scaffold.json rules_loaded; use existing local credentials without logging them; check localhost:5000/3001 and document actual availability. Schema deployment is separate from generating migration source.

## Primary files to touch (scope lock)

- `client/src/components/editor/v3/V3ListingPanel.tsx` — Welcome, saved search, reviewed paste, property edits, agent/brand and manual gallery UI
- `client/src/components/editor/v3/v3-listing-panel.css` — Responsive token-based light/dark listing styling
- `client/src/components/editor/v3/__tests__/V3ListingPanel.spec.tsx` — Search, forms, loading/errors, review and navigation contracts
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-025/STORY.md` — Record AC/test evidence and implementation status
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-025/TASKS.md` — Record task progress and verification
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-025/scaffold.json` — Maintain exact scope scaffold

## Tasks

### T1 — Listing overview, source review and manual-media UI with interaction tests

- [x] Define controlled UI fixtures first for saved search, review/ambiguity/stale decisions, loading/retry and navigation; implement approved accessible cards/forms/gallery and preserve pending/applied separation.
- `client/src/components/editor/v3/V3ListingPanel.tsx`
- `client/src/components/editor/v3/v3-listing-panel.css`
- `client/src/components/editor/v3/__tests__/V3ListingPanel.spec.tsx`

**Effort:** S

### T2 — Verify and record evidence

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

## Implementation evidence — 2026-11-13

- Runtime trace: opt-in V3Editor → V3Panels; root owns shell imports/footer. New component-scoped CSS uses V3 tokens with no mockup runtime/storage imports.
- Focused command: from client, node ../node_modules/vitest/vitest.mjs run src/components/editor/v3/__tests__/V3ListingPanel.spec.tsx src/components/editor/v3/__tests__/V3TemplateFields.spec.tsx --reporter=dot. Latest completed run: 20/20 passed (13 Listing, 7 Template Fields), including duplicate-submit protection.
- node node_modules/typescript/bin/tsc --noEmit passed at the source revision before the final duplicate-submit test. Root runs full Gate 1 and records final source evidence before committing.
- Initial localhost:5000 probe was unavailable; visual/theme/browser/live persistence checks remain unproven. No AC4/DoD completion claim, no commits by this agent.

## Local integration verification — 2026-11-13
Implementation integrated on codex/v3-arrange-opus. Full Gate1, focused/new browser and real database evidence are recorded in docs/research/2026-11-13-V3-LISTING-IMPLEMENTATION.md. Story closure/merge is not claimed; broad candidate visual/accessibility regression remains pre-merge work. Root coordinates commits; no failing-test-only commits.
