# V3 browser annotation implementation

Date: 2026-11-14. Branch: `codex/v3-listing-responsive-handoff`.

Scope: the six browser comments on the actual V3 Editor. Comment 5 requests a proposal only. AI Assistant, country connectors, photo ranking, default-editor cutover and unrelated font refinements are excluded.

## Delivered behavior

| Comment | Result |
|---|---|
| 1 | Undo last apply is directly below Apply to design in the pinned Listing footer. The header and More menu no longer duplicate it. Existing undo guards and inline failure reporting remain active. |
| 2 | Details replaces the Agent rail destination below Listing. Its Property and Agent tabs preserve separate unfinished drafts while switching; arrows/Home/End support keyboard navigation. Saving one form preserves the other pending section. Listing retains search, overview and Apply; Brand remains separate. |
| 3 | Contextual toolbars measure the canvas space and actual formatting groups. Secondary groups move to More formatting options, and return inline when space grows. Text, image, shape, line, icon and selection actions retain their guards. Nested formatting popovers remain available. Moving an unfinished font-size input during resize cancels its preview without creating an undo step. |
| 4 | Template Fields and Show links live in the Canvas information strip above the canvas. Narrow layouts use named icon buttons with pressed states and tooltips. Footer retains Layers, canvas settings and zoom. |
| 5 | Save workflow proposal only; current save controls and persistence semantics are unchanged. See [save proposal](2026-11-14-V3-SAVE-FLOW-PROPOSAL.md). |
| 6 | Preview is an accessible icon after Export, using the existing editor's Maximize2 icon. Preview shortcut, draft isolation, exit and focus restoration are retained. |

On phones, opening a rail sidebar now closes Template Fields to avoid overlapping sheets. Desktop and tablet layouts retain their wider inspector arrangement.

## Verification

- TypeScript frontend and API checks pass.
- Backend unit suite: 853 pass; frontend unit suite: 843 pass, one existing skipped test. No test was weakened or disabled for this work.
- Production build passes. Existing dependency/PostCSS/chunk-size warnings remain.
- Clean final V3 browser regression: **178/178 pass**, no retries, including all 11 new annotation cases, formatting, selection/history, Layers, saved-session navigation, export and responsive layouts. Log: `.agent-logs/annotations-final-browser.log`.
- Visual evidence reviewed at 1242×668 with both inspectors, phone 375px and tablet 768px in light/dark. The suite additionally covers 320, 390, 820, 1024 and 1440px. Screenshots are generated under `.e2e-artifacts/us-edit-031/`; physical-device acceptance remains pending.
- The configured visual checklist file is absent from this checkout; verification uses the canonical skill's light/dark, desktop/mobile, bounds, overlay and action-accessibility criteria.
- Gate 4 is not applicable: no backend module, API, schema or migration changed. Shared-database integration journeys are not rerun for this UI-only refinement; their earlier results remain in the release-hardening report, not claimed as new evidence.

The initial annotation tests incorrectly assumed image Opacity must overflow and that Property save returns to Listing. Those assertions were reconciled with the requested measured layout and persistent Details tabs. A subsequent phone test found a real inspector overlap; the navigation fix and explicit regression assertion cover that defect.

The first broad run passed 142 cases and found five failures: closed formatting popover wrappers consumed Escape and remained in the DOM, and an older context-menu test bypassed the new responsive More entry. Closed groups now use a separate inert measurement container; the interactive popover mounts only while open. The affected 89-case rerun passed 88 and exposed one additional repeated-duplication measurement loop. Removing a redundant overflow dependency from position measurement fixed that exact regression (one-case rerun passed); ResizeObserver still handles toolbar and viewport geometry changes. A clean final regression pass follows these repairs. Failed runs remain in the local evidence logs; none is reported as a passing full run.

## Review status

Implementation is locally verified and subject to user visual acceptance and milestone delivery/merge. Physical-device acceptance is still pending. These refinements do not mark the entire milestone Done.

Final Listing workflow suite: **9/9 pass**, no retries. Log: .agent-logs/annotations-final-listing.log. Combined clean browser verification: 187 passing cases.

