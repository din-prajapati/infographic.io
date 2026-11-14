# V3 Save flow implementation

Story: US-EDIT-022 AC5–8, tasks T7/T8. Branch: `codex/v3-listing-responsive-handoff`.

The user approved the revised [Save-flow plan](2026-11-14-V3-SAVE-FLOW-PROPOSAL.md), including optional editable Tags for Designs. This implementation covers Design sessions; explicit Template authoring remains deferred.

## Behavior

| Entry/action | Result |
|---|---|
| Save existing Design / Ctrl or Cmd+S | Acknowledged update of the current Design; existing category/tags persist; no naming modal |
| First Save of a new draft | V3 Save design dialog: prefilled name, optional Tags; creates and adopts its canonical Design ID |
| Save options → Save a copy | Prefilled name and editable inherited Tags; copies current artwork and pending/applied Listing state to a separate Design |
| Copy with unsaved source | Explains that the original keeps its last saved version; unchecked optional source-save consent; autosave pauses while the choice is open |
| Copy with source-save consent checked | Acknowledges the original save before creating a separate copy; original-save failure stops creation |
| Save options → Create reusable template | Name and optional Category/tags; clears linked Listing facts/photos while keeping static independent content and field links; stays in the current Design |

Dialogs inherit V3 light/dark tokens and use the refined input/button styling. Phone dialogs are bounded bottom sheets; desktop/tablet use centered dialogs with scrollable bodies. Names retain the legacy 50-character UI limit; Tags retain five tags of 20 characters each. No Design/Template destination toggle is needed inside a dialog.

Failure keeps dialog values and canvas edits available for retry. Submission is guarded while pending. Cancel/Escape returns focus to Save or Save options. Template success offers View in Templates; it does not claim that the source Design has been saved.

The session controller now tracks allowed metadata in dirty/recovery snapshots and supports acknowledged copy creation. A response can adopt a new ID only for the source revision and session that requested it. Later edits or navigation retain the current document. Existing opt-in routing, Listing Apply/Undo, template instantiation, toolbar controls, legacy SaveDialog, backend and schema remain in their established scope.

## Verification

Final source verification is green. Browser tests mock authenticated HTTP boundaries and exercise the real editor, serializer, dialogs and session; they are not live database integration evidence.

- Gate 1: `npm run check` passes frontend/API TypeScript. Backend units **853/853**, frontend units **865 pass + one existing skip** across 72 suites: **1,718 passing unit tests**. Production build passes. Logs: `.agent-logs/save-flow-final-check.log`, `save-flow-backend.log`, `save-flow-final-client.log`, `save-flow-final-build.log`.
- Gate 2: reviewed V3-themed dialog screenshots at phone375, tablet768, desktop1440 and short812×375 in light/dark. Actions remain reachable with scrolling metadata, including expanded tags/category. Screenshots: `.e2e-artifacts/us-edit-031/v3-save-flow-*/`.
- Gate 3: broad V3 run **194/195 pass**. One retained deferred-template cancellation test still expected first Save to write immediately; it now submits the new naming dialog while preserving its exact pending-address/record-count assertions. Reconciled approved-shell + all Save-flow tests, including two additional short-screen cases: **31/31 pass**. Listing workflow: **9/9 pass**. Together these runs verify all **206 distinct browser cases**; this is not represented as a single 206-case run. Logs: `.agent-logs/save-flow-final-browser.log`, `save-flow-browser-reconciled.log`, `save-flow-final-listing.log`.
- Gate 4: not applicable; no backend/controller/schema changes. Live database journeys were not rerun; their adapted selectors are retained without claiming new live evidence.
- `git diff --check` passes. Existing dependency/PostCSS/chunk-size build warnings remain.

| Contract | Evidence |
|---|---|
| AC5: action-based dialogs and Design Tags | New `v3-save-flow.spec.ts` first-save/naming/Tags tests; dialog unit contracts |
| AC6: isolated copy, sanitized Template, acknowledgment, pending/error | New browser copy/template/error/invalid-ID/duplicate-submit cases; session controller unit contracts |
| AC7: metadata recovery, source consent, paused autosave, late replies | New browser recovery/copy-consent/browser-Back cases; controller tests cover newer source revisions, account disposal, concurrent operations and recovery validation |
| AC8: V3 theme, bounds and keyboard | New browser light/dark 375/768/1440px dialog cases and screenshots; existing responsive editor suite |
| Existing AC1–4 | Existing V3 regression and Listing workflow suites, with selectors updated for the approved Save/menu/dialog flow; persistence assertions retained |

Initial new-flow browser pass verified the save/copy/template behavior. Paused-clock tests needed to advance time for Radix's deferred focus restoration; the corrected 16-case run passed. A further navigation test covers a delayed copy acknowledgment while the user opens another Design and starts a new dialog.

## Remaining scope

- Explicit owned-Template editing, Template updates/copies and Template-mode Create design are future work from the proposal.
- Physical-device and user visual acceptance remain separate from browser-emulated checks.
- Milestone PR/merge and formal story closure are not claimed by local implementation.

## Browser comment 2 — Save split-button outline and hover (T9)

Save and its dropdown now share one persistent border matching adjacent header controls, with a divider between actions. Hovering either half, keyboard focus within the control, and an open menu highlight the entire group. Individual focus outlines remain visible. Disabled saving remains neutral and state changes do not resize the control. Save behavior and dialogs are unchanged.

Fresh verification: frontend/API type checks pass; backend 853/853 and frontend 865 passing with one existing skip (1,718 passing units). Four focused browser cases pass at 375px and 1242px in both themes, covering the border, both hover targets, focus, open menu, disabled state and stable dimensions. Phone light and desktop dark screenshots were visually reviewed. Logs: `.agent-logs/save-hover-check.log`, `save-hover-backend.log`, `save-hover-client.log`, `save-hover-browser-rerun.log`. The initial browser run exposed only an expected-color serialization mismatch; the exact color contract now uses browser normalization. Gate 4 is not applicable to this CSS-only change. Comment 1 extraction review is a separate item.
