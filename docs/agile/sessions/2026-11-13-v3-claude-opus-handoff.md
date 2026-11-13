# V3 Listing and responsive editor — Claude Code / Opus handoff

Date: 2026-11-13 (Asia/Calcutta).
Branch: `codex/v3-listing-responsive-handoff`.
Workspace: `D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/.codex-worktrees/v3-slice`.

## User direction — authoritative

The user invested heavily in refining the mockups so implementation would follow their UI/UX. They report that the implemented UI/UX does not follow that reference as expected. Functional implementation and responsive tests do **not** constitute acceptance of visual/interaction fidelity. Treat that mismatch as unresolved; do not defend the current UI based on passing tests or redesign the approved workflow independently.

Continue in Claude Code with the Opus model, in this workspace and branch. The primary checkout is on an unrelated marketing hotfix; do not switch or modify that checkout. This branch preserves the existing implementation; nothing has been pushed, merged or deployed as part of the handoff.

## Approved reference and precedence

Serve `Mockups/listing-workflow-v1/` on a local static server and inspect **`editor.html`**, not only the separate workflow concept at `index.html`. Follow the scripts/styles actually loaded by the HTML, including refinement and P1 layers. Start with:

- `Mockups/listing-workflow-v1/REFINEMENT.md` — compact Listing flow, welcome screen, property card, pinned controls, Agent/Brand navigation, Template Fields, Template/Design separation.
- `Mockups/listing-workflow-v1/P1-ESSENTIALS.md` — subsequent behavior and runtime layers.
- `Mockups/listing-workflow-v1/GAP-ANALYSIS-4180-vs-5194.md` — prior intended feature/UI comparison.
- `Mockups/listing-workflow-v1/EDITOR-MOCKUP.md` — historical interaction context. Its preview image is explicitly an older revision, not current visual acceptance evidence.

Mockup source, local illustrative assets and tests are preserved on this branch. Generated verification output and browser-state checkpoints are left outside this commit. Do not load private browser-state backups into production.

Explicit user exclusions override older mockup demonstrations: no automatic photo ranking/roles/packs, no AI Assistant integration, no live MLS/RERA/other country connector. Photos remain manually uploaded/selected/replaced in the design. Provider sample data in the mockup is a simulation, not a requirement to claim working live integrations.

## First work to do

1. Read repository AGENTS/ORION guidance and existing story contracts. Inspect the actual mockup and `/editor?editor=v3` side by side using the same Listing/data, desktop viewport and theme. Repeat key flows on phone/tablet; the newer responsive shell is an implementation proposal, not an approved replacement for the refined mockup.
2. Create a concrete mockup-to-runtime matrix with reference screen/component, current runtime file, screenshot/interaction evidence, exact mismatch and proposed correction. Cover welcome/intake, source controls, Listing overview/property card/media, Property editing, Agent/Brand, Template Fields, pinned Apply/Undo, Template/Design save flows and export review. Do not invent or assert a specific mismatch without inspecting it.
3. Reconcile the applicable story/task allowlists and harden before source edits. Restore approved desktop composition, spacing, typography, navigation, card hierarchy, scrolling/pinned actions and interaction behavior. Adapt that composition to smaller screens while retaining canvas access. Preserve the existing V3 renderer/session/history, persistence, pending-versus-applied state, independent Designs and template isolation.
4. Verify with screenshots and actual interactions against the mockup, including light/dark, rather than tests checking only presence/reachability. Keep document geometry and export dimensions unchanged. No additional feature scope, default-editor routing change, deployment or main merge is authorized by this handoff.

## Implementation preserved

Base before Listing: `d10ccbb`; recovery pointer `codex/v3-before-listing-2026-11-13`.

- `460cfe1`: canonical global Listing/pricing/import contracts.
- `7b44538`: authorized Property/profile persistence.
- `d8f193e`: pending/applied/custom design state.
- `892c184`: Listing and Template Fields panels.
- `8cc39bd`: reusable Template and reviewed export helpers.
- `a73e1e8`: shell Apply/save/export integration.
- `9fb64bc`: persistence, PNG verification evidence and documentation.
- `7d70b5b`: responsive V3 shell, viewport fitting and browser contracts (US-EDIT-044).

Main runtime: `client/src/components/editor/v3/V3Editor.tsx`, `V3Panels.tsx`, `V3ListingPanel.tsx`, `V3TemplateFields.tsx`, `V3Canvas.tsx`, their styles and `v3-responsive.css`; workflow/session logic under `client/src/hooks/` and `client/src/lib/`. NestJS `api/src/modules/properties/` and Prisma are canonical; Wouter remains the router. Legacy/default editor was not migrated.

Implementation evidence: `docs/research/2026-11-13-V3-LISTING-IMPLEMENTATION.md`. Responsive scope and evidence: `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-044/{STORY,TASKS}.md`.

## Verification state and limits

- Final responsive change: frontend/API type checks and production build passed; backend840 + frontend795 unit tests passed, with1 existing frontend skip. Bounded workers are required to avoid resource exhaustion.
- Responsive19 + existing Layers10 + Listing regression5 browser checks passed (34 total). These use controlled HTTP/auth fixtures; they do not establish mockup fidelity or native-device acceptance.
- Five broader desktop shell editing/theme cases passed. Three **unchanged historical** `e2e/v3-approved-shell.spec.ts` cases failed: two target removed `Property` navigation/old listing schema; one expects obsolete same-design template replacement with a noncanonical template fixture. Reconcile these contracts to the current approved workflow without removing assertions or weakening real behavior. Overall historical browser suite is not fully green.
- Earlier real API/Prisma/browser save/reopen and PNG checks are documented in the Listing report; do not describe them as fresh verification after subsequent edits.
- Physical iOS/Android testing and a fresh full backend-backed localhost:5000 responsive journey remain pending. Do not mark the story formally Done or production ready before required verification/merge.
- Local logs/screenshots under `.agent-logs/` and `.e2e-artifacts/` are ignored and may not travel with a fresh checkout. Committed evidence is linked from the Listing report. Rerun checks for fresh evidence.

Useful existing commands:

```text
npm run check
npm run test:unit:backend -- --maxWorkers=2 --minWorkers=1
npm run test:unit:client -- --maxWorkers=2 --minWorkers=1
npm run build
npx playwright test --config=e2e/v3-slice.config.ts e2e/v3-responsive.spec.ts e2e/v3-layers-panel.spec.ts --workers=1
npx playwright test --config=e2e/v3-listing.config.ts --workers=1
```

Keep unrelated untracked research/checkpoint files and other worktrees untouched. No new runtime changes were made for this handoff.
