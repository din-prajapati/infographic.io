# Tasks — US-EDIT-022

> **Story:** [STORY.md](./STORY.md) — Reusable templates and independent saved Designs
> **Branch:** `codex/v3-arrange-opus`
> **PR:** #_____
> **PR scope:** Reusable templates and independent saved Designs; no AI Assistant or live providers.
> **Prerequisites:** US-PROP-004, US-EDIT-025, US-EDIT-020

## Four-Pillars Pre-flight

- [x] **Brain** — Read STORY.md and approved Mockups/listing-workflow-v1/REFINEMENT.md / P1-ESSENTIALS.md; resolve each AC to observable contract assertions before changing code.
- [x] **Muscle** — Read every Primary file below, or its existing dependency if new; verify actual V3 runtime import paths and source ownership; do not alter unrelated work.
- [x] **Map** — Read `../../ARCHITECTURE.mmd`, trace Property/profile → pending record → Apply → artwork/applied snapshot → template/design persistence → review → existing PNG renderer.
- [x] **Env** — Read `../../ENV.yaml` and all scaffold.json rules_loaded; use existing local credentials without logging them; check localhost:5000/3001 and document actual availability. Schema deployment is separate from generating migration source.

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

- [x] Define fact/photo stripping and two-listing independence assertions first; implement clone/fill/placeholder helpers with no prior-listing leakage.
- `client/src/lib/v3TemplateWorkflow.ts`
- `client/src/lib/__tests__/v3TemplateWorkflow.spec.ts`

**Effort:** S


### T2 — Actual V3 shell wiring and save/navigation regression tests

- [x] Root owns integration. Define routing/save-status tests first; connect controlled Listing/Agent/Brand/Fields components and existing authenticated persistence without changing opt-in route or Assistant.
- `client/src/components/editor/v3/V3Editor.tsx`
- `client/src/components/editor/v3/V3Panels.tsx`
- `client/src/components/editor/v3/v3-editor.css`
- `client/src/components/editor/v3/__tests__/V3Panels.spec.tsx`

**Effort:** S

### T3 — Verify and record evidence

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
- `client/src/components/canvas/ImageElement.tsx` — Render explicit empty linked-photo placeholders (required by AC3).

## Local integration verification — 2026-11-13
Implementation integrated on codex/v3-arrange-opus. Full Gate1, focused/new browser and real database evidence are recorded in docs/research/2026-11-13-V3-LISTING-IMPLEMENTATION.md. Story closure/merge is not claimed; broad candidate visual/accessibility regression remains pre-merge work. Root coordinates commits; no failing-test-only commits.

## Mockup-fidelity restoration — 2026-11-13 (scope reconciliation)

> Source: user direction in `docs/agile/sessions/2026-11-13-v3-claude-opus-handoff.md`; mismatch evidence in `docs/research/2026-11-13-V3-MOCKUP-FIDELITY-MATRIX.md`. Restores the approved `Mockups/listing-workflow-v1/editor.html` composition without adding feature scope. AC text is unchanged; Out of Scope (AI Assistant, connectors, photo ranking, route default) still applies.

### T3 — Restore approved UI/UX composition (matrix rows: 1–4, 17)

- [x] Restore approved visual/interaction composition; preserve persistence, pending/applied state and responsive behaviour; reconcile UI-structure tests without weakening behaviour assertions.
- `client/src/components/editor/v3/V3Editor.tsx`
- `client/src/components/editor/v3/v3-editor.css`
- `client/src/components/editor/v3/__tests__/V3Shell.spec.tsx`
- `e2e/v3-approved-shell.spec.ts`
- `e2e/v3-listing-workflow.spec.ts`

**Effort:** S

### T5 — Design/template body limit and authenticated R2 media upload endpoint (2026-11-13, real-backend E2E brief)

> Source: user decision 2026-11-13 after the real-backend probe: design/template saves above ~100 kB failed with 500 "request entity too large" (properties/profiles already accept 12 MB). User chose: fix and test, and store image data in the Cloudflare R2 bucket. Gate 4 (boot smoke + health) required for the backend part. Legacy editor upload paths are out of scope.

- [x] Implement test-first; Gate 1 + Gate 4; real-backend E2E against the dev database. Evidence 2026-11-13: `npm run check` exit 0; backend 848/848; client 815 + 1 skip; mocked V3 regression 124/124; listing 8/8; `npm run build` OK; `smoke:boot` BOOT OK (media route mapped) + health 200; real-backend journey passes (latest run E2E-HZN-mwf9pf8r). Details: `docs/research/2026-11-13-V3-REAL-BACKEND-E2E.md`.
- `api/src/modules/properties/properties.module.ts`
- `api/src/modules/storage/controllers/media.controller.ts`
- `api/src/modules/storage/storage.module.ts`
- `api/tests/storage/media.controller.spec.ts`
- `api/tests/properties/properties.http.spec.ts`
- `client/src/lib/v3MediaUpload.ts`
- `client/src/lib/__tests__/v3MediaUpload.spec.ts`
- `client/src/components/editor/v3/V3ElementToolbar.tsx`
- `client/src/components/editor/v3/V3Panels.tsx`
- `client/src/components/editor/v3/V3TemplateFields.tsx`
- `e2e/v3-listing-real-backend.spec.ts`
- `e2e/v3-real-backend.config.ts`
- `e2e/v3-element-toolbars.spec.ts` — reconcile image-replacement contracts: Replace now uploads to R2 and rejects SVG (public-bucket XSS vector), so fixtures are raster and `/media` is stubbed (reviewer P0-1)
- `e2e/fixtures/replacement-red.png`, `e2e/fixtures/two-colours.png` — raster replacement fixtures
- `e2e/fixtures/horizon/build-seed.cjs`, `hero-building.jpg`, `logo-horizon.png`, `horizon-seed.sample.json` — Horizon template seed (reference-derived hero crop, original logo drawing) used by the real-backend spec
- `client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx`, `V3Panels.spec.tsx`, `V3TemplateFields.spec.tsx` — call-site tests: stored src is the returned R2 URL (reviewer P1-2)

**Effort:** S

### T6 — V3 editor deep links: templateId, blank-canvas size (2026-11-14, user request)

> Source: user 2026-11-14. `/editor?editor=v3&templateId=…` opened a blank canvas (V3 read only designId). The user asked for the fix and for other legacy URL scenarios to be covered, because V3 will replace the legacy editor. Contract: `client/src/lib/v3EditorUrl.ts`. A template link follows the V3 Templates-panel rule (it saves a separate design and replaces the URL with designId). Moving the Templates / My Designs / Format Picker callers to V3 is the cutover, out of scope here.

- [x] Test-first; Gate 1; real-backend E2E. Evidence 2026-11-14: `npm run check` exit 0; client unit 825 + 1 skip; `v3EditorUrl.spec.ts` 10/10; real-backend `v3-editor-url-real-backend.spec.ts` 5/5 plus the listing journey; mocked shell 8/8, listing 8/8; build OK. reviewer-agent (claude-opus-5-5): Request Changes. Its P1 (a stale deep link navigated after the user left) is fixed, and a mutation check showed the new E2E fails without the fix. P2 items 3, 7 and 8 are done; items 4–6 are noted below.
- Known (P2, not changed): no component-level test of the start-up effect (covered by real-backend E2E); a width/height start marks the blank session dirty (leaving shows the unsaved prompt); raw `designsApi.save` error text is shown, as for the Templates panel.

**Files**
- `client/src/lib/v3EditorUrl.ts` (new), `client/src/lib/__tests__/v3EditorUrl.spec.ts` (new)
- `client/src/App.tsx` — passes parsed params to V3Editor
- `client/src/components/editor/v3/V3Editor.tsx` — URL start-up effect and `useTemplate({replace, stillWanted})` only (the other hunks in this file belong to T3/T4)
- `client/src/components/editor/v3/V3Panels.tsx` — uses the shared `hasTemplateLayout`
- `e2e/v3-editor-url-real-backend.spec.ts` (new), `e2e/v3-real-backend.config.ts` (testMatch)

## T7 — Authorized release hardening (2026-11-14)

- [x] Release hardening: template creation must honor unsaved-navigation confirmation before any server write; cancellation keeps the active design and does not create an orphan design. Template confirmation must describe creating a separate Design, retaining existing work. Files: V3Editor.tsx, V3Panels.tsx, their existing tests, e2e/v3-listing-workflow.spec.ts, e2e/v3-approved-shell.spec.ts. No CSS/font/layout changes.

User authorized standup points2/3. Root owns evidence, tracker reconciliation and commits; independent source/test ownership is coordinated. Existing ACs and exclusions remain unchanged. All applicable gates and independent review required; no merge/deploy. Physical-device acceptance and ongoing font annotations remain pending.


## Tracker reconciliation — 2026-11-14

2026-11-14 — reconciled from committed Opus baseline3e95a40; implementation present, release hardening/review and UI/font acceptance in progress; not merged Done. Current AC/task findings and fresh gate results are tracked in docs/research/2026-11-14-V3-RELEASE-HARDENING.md. Historical unchecked implementation/evidence rows are retained until this pass finishes verification; they are not interpreted as missing source code. Font/layout annotations are deliberately untouched.

- Root verification scope: e2e/v3-listing-real-backend.spec.ts updates only the confirmation action name to Create Design; it retains the real isolated-Design/database/R2/export assertions and records fresh dev verification.


## Fresh release evidence — 2026-11-14

Applicable implementation and automated verification tasks are complete; docs/research/2026-11-14-V3-RELEASE-HARDENING.md records exact commands/counts and independent review. No CSS/font changes were made in this repair. User visual/font acceptance, physical devices, final milestone delivery and merge remain pending.
