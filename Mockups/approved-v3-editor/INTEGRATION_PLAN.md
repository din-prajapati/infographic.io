# Apply the approved design to the V3 slice

Date: 2026-10-31. Planning status: recommended sequence; not an implementation-complete claim.

## Decision

Use the implemented V3 slice as the runtime foundation and the [approved bundle](README.md) as the visual contract. Translate the approved presentation into React components around the existing session controller, canvas store, renderers and exporter. Do not transplant the mock HTML's fake operations into the application.

The same milestone branch already holds the working slice and this saved design. Integration is predominantly frontend composition and adapters; it is not a backend rewrite or a merge of two competing canvas engines.

## Current baseline

- Branch: `feat/edit/m-11-v3-editor-slice`; runtime baseline commit: `99e0288`.
- Story: US-EDIT-031, milestone M-EDIT-11. Opt-in `/editor?editor=v3` remains protected by the existing authentication boundary. Ordinary `/editor` still selects the old editor.
- Implemented: open, text draft/apply, undo/redo, acknowledged server save, reload, PNG export, and canvas-only Preview with Escape/Exit recovery.
- Most recent retained runtime evidence: TypeScript, 811 backend unit tests, 399 client unit tests (one existing skip), 27 scoped browser tests, production build. Separate authenticated browser/API/database persistence smoke was retained before the Preview amendment.
- Delivery remains pending: final independent Preview re-review hit the configured reviewer's usage limit; whole-milestone verification and PR/main merge remain outstanding. Approval of the visual design does not waive these gates.

## Preserve and adapt

| Area | Keep from the working slice / old editor | Apply from approved design |
|---|---|---|
| Persistence | `v3DesignSession.ts`, `useV3DesignSession.ts`, existing designs API, canonical IDs, metadata retention and stale-response guards | Title-adjacent cloud status driven by real saving/saved/error state |
| Shell | V3 opt-in routing, session readiness, export/error handling and keyboard ownership | Approved top bar, rail, floating Tools, footer, brand tokens; remove the slice's workflow strip and permanent inspector placement |
| Canvas | Zustand history and selection, Text/Shape/Image renderers, canvas serialization and exporter | Element-proximity toolbar, actual document-coordinate readout, Layers access and approved zoom controls |
| Text | Existing style definitions, update operations and undo boundaries | Eight style cards in Text; preserve draft safety when moving content editing |
| Templates | Existing templates API, ownership/visibility checks, application and replacement safeguards | Searchable thumbnails grouped into Recently used / More templates |
| Listing | Existing Property/Agent forms, stores and listing bindings | Separate approved Property and Agent rail panels |
| Brand | Existing palettes and palette editor | Approved Brand rail panel; UI theme never recolors artwork |
| AI | Existing AI Chat and generation operations, progress, quota/error handling | Bottom-right Assistant above zoom; no additional Canva capabilities |

Do not mount old EditorLayout wholesale inside V3: its panels, event handlers and global keyboard registrations would duplicate shell behavior. Extract/adapt the relevant operations and leaf components after tracing their actual runtime dependencies.

## Execution order

1. **Reconcile planning before implementation.** Update and harden US-EDIT-024 / its TASKS against this approval. Its old draft calls for a guide bar, Layers in the rail and Assistant in the top bar, all of which conflict with the approved skeleton. Its expected files target the legacy shell and also need correction. Keep the US-EDIT-031 slice's completed work/evidence intact; do not start it over or mark the broader V3 epic Done.
2. **Apply the visual shell to the working slice.** Recompose V3Editor/V3Canvas, scoped light/dark tokens, real logo, title/cloud spacing, approved rail, floating Tools and footer. Retain the open → edit → save → reload → export → Preview path. This is the next small reviewable increment. No production default-route switch.
3. **Wire existing canvas capabilities into their approved locations.** Add the vertical Add menu, text-style cards, proximity formatting, Layers, coordinate readout and zoom preset menu using real store operations. Run history, keyboard, selection and PNG regression checks. Additional scope needs explicit task files and ACs; do not silently expand US-EDIT-031.
4. **Wire the content panels and Assistant.** Reuse templates, Property, Agent, Brand and AI behavior in the approved placements. Reconcile existing US-EDIT-025, US-EDIT-022 and US-EDIT-023 with actual remaining scope; avoid implementing the same capability under multiple cards. Add recent-template history as a bounded frontend capability if the old implementation does not have it. Recent-use storage must be scoped to the signed-in user; the template APIs remain authoritative.
5. **Implement autosave through US-EDIT-027.** Reuse the guarded session save path, serialize requests, preserve newer dirty revisions, expose retry/error and actual last-successful-save time. Keep manual Save. Define first-save, navigation protection and local-draft behavior before coding. The cloud must never claim saved because a timer fired or a network request merely started.
6. **Verify and deliver.** Check both themes at the approved desktop widths, normal/hover/selected/focus/disabled icon states, unchanged artwork and PNG output, all slice flows and newly wired capability flows. Complete independent review, required Orion gates and milestone-level PR review before merging into main. Default-route rollout is a separate explicit decision.

## Contracts to resolve during story hardening

Preferred Git order: complete the M-EDIT-11 review and merge its foundation, then create the M-EDIT-09 implementation branch from that main revision. If work must begin before M-EDIT-11 lands, use a dependent branch from this slice and rebase it after the foundation merges. Preserve the task/story commit history; do not duplicate the slice through a fresh rewrite or copy its code back onto an unrelated main checkout.

- The slice currently uses an explicit Apply text button. The approved mock does not specify that action. Define its replacement edit/commit trigger and test a single deliberate undo boundary; do not add an unapproved control or silently lose drafts.
- Geometry must use actual element x/y/width/height in design pixels, independent of zoom, pan, viewport size and theme. Define multi-selection behavior from the existing editor's contract.
- Duplicate/Delete visibility must use the old editor's type-independent `selectedElementIds.length > 0` contract for Text, Image and all four shape types. Both actions iterate the selected IDs, including multi-selection, as the old FloatingToolbar does. The latest approved strip always exposes Line, Shapes, Text and Image; + is removed and Undo/Redo live only in the top bar. Selection actions appear/disappear independently of these creation tools. The proximity toolbar supplies type-specific formatting; it does not determine whether Duplicate/Delete are available.
- The Line entry is explicitly requested after the original approval. Existing canvas ShapeType and FloatingToolbar creation operations do not expose a line tool. Define the straight-line runtime contract and file scope before implementation; do not copy Canva's curve/connector features into the product.
- Zoom presets must change the actual canvas zoom, and Fit must calculate available viewport space. The percentage-only prototype behavior is not production behavior.
- Template thumbnail/search/recent lists need real loading, empty and failure states. Replacing a nonempty canvas must retain the existing replacement safeguard.
- The standalone review controls (visual treatment + Light/Dark/System bar) are not product UI. Use the existing application theme preference without moving approved controls or adding a permanent appearance bar.
- No whole-site marketing theme migration, new offline mode, collaboration, Canva-only tools, schema change or backend rewrite is implied by this design approval.

## Verification scope for this save

Only design snapshots and planning documents were added; no application runtime was changed. Snapshots were copied byte-for-byte and checksummed. Full type/unit checks are run before the documentation commit per repository Gate 1 policy. Prior interactive light/dark and control checks apply to the unchanged snapshot bytes. New production integration will require fresh visual/E2E evidence.
