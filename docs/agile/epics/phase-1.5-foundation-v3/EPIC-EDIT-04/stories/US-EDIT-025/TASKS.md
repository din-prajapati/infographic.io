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

## Implementation evidence — 2026-11-13

- Runtime trace: opt-in V3Editor → V3Panels; root owns shell imports/footer. New component-scoped CSS uses V3 tokens with no mockup runtime/storage imports.
- Focused command: from client, node ../node_modules/vitest/vitest.mjs run src/components/editor/v3/__tests__/V3ListingPanel.spec.tsx src/components/editor/v3/__tests__/V3TemplateFields.spec.tsx --reporter=dot. Latest completed run: 20/20 passed (13 Listing, 7 Template Fields), including duplicate-submit protection.
- node node_modules/typescript/bin/tsc --noEmit passed at the source revision before the final duplicate-submit test. Root runs full Gate 1 and records final source evidence before committing.
- Initial localhost:5000 probe was unavailable; visual/theme/browser/live persistence checks remain unproven. No AC4/DoD completion claim, no commits by this agent.

## Local integration verification — 2026-11-13
Implementation integrated on codex/v3-arrange-opus. Full Gate1, focused/new browser and real database evidence are recorded in docs/research/2026-11-13-V3-LISTING-IMPLEMENTATION.md. Story closure/merge is not claimed; broad candidate visual/accessibility regression remains pre-merge work. Root coordinates commits; no failing-test-only commits.

## Mockup-fidelity restoration — 2026-11-13 (scope reconciliation)

> Source: user direction in `docs/agile/sessions/2026-11-13-v3-claude-opus-handoff.md`; mismatch evidence in `docs/research/2026-11-13-V3-MOCKUP-FIDELITY-MATRIX.md`. Restores the approved `Mockups/listing-workflow-v1/editor.html` composition without adding feature scope. AC text is unchanged; Out of Scope (AI Assistant, connectors, photo ranking, route default) still applies.

### T3 — Restore approved UI/UX composition (matrix rows: 5–13, 16)

- [x] Restore approved visual/interaction composition; preserve persistence, pending/applied state and responsive behaviour; reconcile UI-structure tests without weakening behaviour assertions.
- `client/src/components/editor/v3/V3ListingPanel.tsx`
- `client/src/components/editor/v3/v3-listing-panel.css`
- `client/src/components/editor/v3/__tests__/V3ListingPanel.spec.tsx`

**Effort:** S

### T4 — Intake example, accessible source tabs, overview footer, grouped Property/Agent forms with counters (2026-11-13, listing UX refinement brief)

> Source: user brief "V3 Listing UX and Template Field Controls" (2026-11-13). Checkpoint: `refs/checkpoints/v3-listing-ux-refine-2026-11-13` + `.agent-logs/checkpoints/before-listing-ux-refine.patch`. No schema/API change; recommended display lengths are guidance, authoritative limits stay in `shared/listingWorkflow.ts`. Out of Scope unchanged (no live MLS/RERA, AI generation, poster extraction, P2 appearance controls).

- [x] Implement, test-first where behavioural; verify in browser at 1242×668 and both themes. Evidence 2026-11-13: `npm run check` exit 0; backend 840/840; client 808 passed + 1 existing skip; `npm run build` exit 0; Playwright listing 8/8 and V3 regression 124/124; Gate 2 screenshots in `.e2e-artifacts/mockup-fidelity/t4/` (1242×668 light/dark, 375 light/dark, 1440); Gate 3 N/A (no global token file change); Gate 4 N/A (no backend change). Details: `docs/research/2026-11-13-V3-MOCKUP-FIDELITY-MATRIX.md` § T4.
- `client/src/components/editor/v3/V3ListingPanel.tsx`
- `client/src/components/editor/v3/v3-listing-panel.css`
- `client/src/components/editor/v3/__tests__/V3ListingPanel.spec.tsx`

**Effort:** S

### T5 — Listing photo, agent portrait and brand logo uploads stored in R2 (2026-11-13, real-backend E2E brief)

> Source: user decision 2026-11-13 after the real-backend probe: design/template saves above ~100 kB failed with 500 "request entity too large" (properties/profiles already accept 12 MB). User chose: fix and test, and store image data in the Cloudflare R2 bucket. Gate 4 (boot smoke + health) required for the backend part. Legacy editor upload paths are out of scope.

- [x] Implement test-first; Gate 1 + Gate 4; real-backend E2E against the dev database. Evidence 2026-11-13: `npm run check` exit 0; backend 848/848; client 815 + 1 skip; mocked V3 regression 124/124; listing 8/8; `npm run build` OK; `smoke:boot` BOOT OK (media route mapped) + health 200; real-backend journey passes (latest run E2E-HZN-mwf9pf8r). Details: `docs/research/2026-11-13-V3-REAL-BACKEND-E2E.md`.
- `client/src/components/editor/v3/V3ListingPanel.tsx`
- `client/src/components/editor/v3/__tests__/V3ListingPanel.spec.tsx`

**Effort:** S

### T6 — Agent form matches the approved mockup layout (2026-11-14, user request)

> Source: user 2026-11-14, with a screenshot of `Mockups/listing-workflow-v1/editor.js` "Edit agent". This supersedes the T4 grouping (a "Contact details" heading, two-column grid, collapsible registration):
> - Portrait row.
> - One column: Full name, Agency, Phone, Email, Registration / licence (visible).
> - Hint.
> - Stacked **Save changes** / **Cancel**.
>
> Kept from earlier work:
> - R2 photo upload (link in the portrait row).
> - Live counters.
> - "Adding a number does not verify it." as the licence field's help.
>
> The mockup's "Select saved demo agent" dropdown is **omitted**: `ListingProfile.userId` is unique (one agent profile per user), so it would list one item. "Use saved profile" now appears only when the listing's agent differs from the saved profile. Multiple agents per organization (Team/Brokerage) would be a separate story.

- [x] Gate 1 + mocked E2E + real-backend journey. Evidence (2026-11-14): `npm run check` exit 0; `V3ListingPanel.spec.tsx` 23/23 (new layout contract; the registration test updated from "collapsible" to "visible"); shell + colour E2E 28/28; listing and real-backend runs recorded in the session report.

**Files**
- `client/src/components/editor/v3/V3ListingPanel.tsx` — Agent screen markup only
- `client/src/components/editor/v3/v3-listing-panel.css` — `.v3-lp-agent-profile`, `.v3-lp-agent-restore`
- `client/src/components/editor/v3/__tests__/V3ListingPanel.spec.tsx`, `e2e/v3-approved-shell.spec.ts`, `e2e/v3-listing-real-backend.spec.ts` — labels "Full name" / "Save changes"


## Tracker reconciliation — 2026-11-14

2026-11-14 — reconciled from committed Opus baseline3e95a40; implementation present, release hardening/review and UI/font acceptance in progress; not merged Done. Current AC/task findings and fresh gate results are tracked in docs/research/2026-11-14-V3-RELEASE-HARDENING.md. Historical unchecked implementation/evidence rows are retained until this pass finishes verification; they are not interpreted as missing source code. Font/layout annotations are deliberately untouched.


## Fresh release evidence — 2026-11-14

Applicable implementation and automated verification tasks are complete; docs/research/2026-11-14-V3-RELEASE-HARDENING.md records exact commands/counts and independent review. No CSS/font changes were made in this repair. User visual/font acceptance, physical devices, final milestone delivery and merge remain pending.

## 2026-11-14 — Browser annotation refinement

- [x] T7 — Comments1/2: Undo last apply below Apply to design with same disabled/guard/error behavior. One Details rail destination, Property/Agent tabs, preserved drafts or explicit save/discard before switching, keyboard tab semantics. Listing overview/search remains independent; Brand separate. Files: V3ListingPanel.tsx,V3Panels.tsx,v3-listing-panel.css,their existing unit tests. Root owns V3Editor shell wiring. Property/Agent source and Apply semantics unchanged.

User explicitly authorized annotations1–4 and6;5 is proposal only. Shared files have explicit root/agent ownership. Do not redesign fonts or implement Assistant/providers/default-editor cutover. Gates required; formal merge remains pending.

Verified 2026-11-14: frontend/API type checks pass; backend 853 and frontend 843 unit tests pass (one existing skip); production build passes; clean V3 browser 178/178 and Listing workflow 9/9 pass. Light/dark desktop, phone and tablet screenshots reviewed. Gate 4 N/A (UI only); physical-device acceptance and merge pending. Evidence: docs/research/2026-11-14-V3-BROWSER-ANNOTATIONS.md.
