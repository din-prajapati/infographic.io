# Tasks — US-EDIT-020

> **Story:** [STORY.md](./STORY.md) — Template Fields and design customization inspector
> **Branch:** `codex/v3-arrange-opus`
> **PR:** #_____
> **PR scope:** Template Fields and design customization inspector; no AI Assistant or live providers.
> **Prerequisites:** US-PROP-004

## Four-Pillars Pre-flight

- [x] **Brain** — Read STORY.md and approved Mockups/listing-workflow-v1/REFINEMENT.md / P1-ESSENTIALS.md; resolve each AC to observable contract assertions before changing code.
- [x] **Muscle** — Read every Primary file below, or its existing dependency if new; verify actual V3 runtime import paths and source ownership; do not alter unrelated work.
- [x] **Map** — Read `../../ARCHITECTURE.mmd`, trace Property/profile → pending record → Apply → artwork/applied snapshot → template/design persistence → review → existing PNG renderer.
- [x] **Env** — Read `../../ENV.yaml` and all scaffold.json rules_loaded; use existing local credentials without logging them; check localhost:5000/3001 and document actual availability. Schema deployment is separate from generating migration source.

## Primary files to touch (scope lock)

- `client/src/components/editor/v3/V3TemplateFields.tsx` — Friendly field mapping, text/image bindings, specifications and customizations UI
- `client/src/components/editor/v3/v3-template-fields.css` — Responsive theme-aware inspector styling
- `client/src/components/editor/v3/__tests__/V3TemplateFields.spec.tsx` — Selection, map, detach/reconnect and customization UI contracts
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-020/STORY.md` — Record AC/test evidence and implementation status
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-020/TASKS.md` — Record task progress and verification
- `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-020/scaffold.json` — Maintain exact scope scaffold

## Tasks

### T1 — Template Fields and customization UI with interaction tests

- [x] Define selected-element/type/mapping/detach/custom assertions first; implement friendly labeled inspector and explicit linked-value reset. Confirm selection alone never opens the panel.
- `client/src/components/editor/v3/V3TemplateFields.tsx`
- `client/src/components/editor/v3/v3-template-fields.css`
- `client/src/components/editor/v3/__tests__/V3TemplateFields.spec.tsx`

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

## Mockup-fidelity restoration — 2026-11-13 (scope reconciliation)

> Source: user direction in `docs/agile/sessions/2026-11-13-v3-claude-opus-handoff.md`; mismatch evidence in `docs/research/2026-11-13-V3-MOCKUP-FIDELITY-MATRIX.md`. Restores the approved `Mockups/listing-workflow-v1/editor.html` composition without adding feature scope. AC text is unchanged; Out of Scope (AI Assistant, connectors, photo ranking, route default) still applies.

### T3 — Restore approved UI/UX composition (matrix rows: 14)

- [ ] Restore approved visual/interaction composition; preserve persistence, pending/applied state and responsive behaviour; reconcile UI-structure tests without weakening behaviour assertions.
- `client/src/components/editor/v3/V3TemplateFields.tsx`
- `client/src/components/editor/v3/v3-template-fields.css`
- `client/src/components/editor/v3/__tests__/V3TemplateFields.spec.tsx`

**Effort:** S

### T4 — Show links overlay and Link field in the element toolbar (2026-11-13, listing UX refinement brief)

> Source: user brief "V3 Listing UX and Template Field Controls" (2026-11-13). Checkpoint: `refs/checkpoints/v3-listing-ux-refine-2026-11-13` + `.agent-logs/checkpoints/before-listing-ux-refine.patch`. No schema/API change; recommended display lengths are guidance, authoritative limits stay in `shared/listingWorkflow.ts`. Out of Scope unchanged (no live MLS/RERA, AI generation, poster extraction, P2 appearance controls).

- [x] Implement, test-first where behavioural; verify in browser at 1242×668 and both themes. Evidence 2026-11-13: `npm run check` exit 0; backend 840/840; client 808 passed + 1 existing skip; `npm run build` exit 0; Playwright listing 8/8 and V3 regression 124/124; Gate 2 screenshots in `.e2e-artifacts/mockup-fidelity/t4/` (1242×668 light/dark, 375 light/dark, 1440); Gate 3 N/A (no global token file change); Gate 4 N/A (no backend change). Details: `docs/research/2026-11-13-V3-MOCKUP-FIDELITY-MATRIX.md` § T4.
- `client/src/components/editor/v3/V3LinkOverlay.tsx`
- `client/src/components/editor/v3/__tests__/V3LinkOverlay.spec.tsx`
- `client/src/components/editor/v3/V3ElementToolbar.tsx`
- `client/src/components/editor/v3/__tests__/V3ElementToolbar.spec.tsx`
- `client/src/components/editor/v3/V3Canvas.tsx`
- `client/src/components/editor/v3/V3Editor.tsx`
- `client/src/components/editor/v3/v3-editor.css`
- `client/src/components/editor/v3/v3-responsive.css`

**Effort:** S

### T5 — Paste-text extraction: unlabeled Indian price, readable labels, agent phone (2026-11-14, user report)

> Source: user 2026-11-14, with a screenshot of the review list. **Use example → Extract & review** on the sample text dropped "80 Lakh". Unlabeled prices were recognised only with a currency sign. Rows also showed field keys (`areaUnit`, `beds`), and the agent line put name and phone in one field.

- [x] Test-first (5 new failing unit tests, then fix); Gate 1; mocked listing E2E. Evidence 2026-11-14: `npm run check` exit 0; backend unit 853/853; client unit 825 + 1 skip; `e2e/v3-listing.config.ts` 9/9, including the new extract-and-review test.
- Rules:
  - A bare amount with an Indian scale word (lakh/lac/crore/cr) is read as INR, whatever the listing country.
  - Amounts that carry a currency sign keep the existing pattern; the new pattern excludes them, so there are no duplicate rows.
  - Agent name and phone are separate suggestions, both unselected.
  - Review rows use reader-facing labels, and the price row shows the formatted value (₹80 Lakh).

**Files**
- `shared/listingWorkflow.ts` — `reviewListingText` (FACT_LABELS, PHONE, lakh/crore pattern)
- `api/tests/listing/listing-workflow.spec.ts` — five sample-text tests
- `client/src/components/editor/v3/V3ListingPanel.tsx` — `formatReviewedPrice` for the price row
- `e2e/v3-listing-workflow.spec.ts` — Use example → Extract & review test
