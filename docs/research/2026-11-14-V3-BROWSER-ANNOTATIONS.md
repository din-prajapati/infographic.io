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


## Follow-up browser comment 1 — Dedicated text-extraction review (US-EDIT-025 T8)

Requested flow: Paste text → Extract & review → separate Review detected facts sidebar → Confirm selected facts → Listing overview → Apply to design. Back returns to the original composer text. The review uses the approved mockup structure: sticky title/Back, collapsible Original source text, individual fact cards with current values and expandable source evidence. Existing values and imported contacts require explicit selection. Only empty property fields can start preselected; ambiguous candidates and rejected/stale imports retain their existing guards.

Runtime trace: opt-in V3Editor → V3Panels → V3ListingPanel → shared reviewListingText/applyReviewedFacts → pending Listing workflow. Before this refinement the runtime rendered `.v3-listing-review` directly below the raw-text composer. A browser baseline confirmed that the requested separate heading/screen was missing. Parser, property API, persistence, and canvas Apply functions are outside this change.

Fresh verification: frontend/API type checks pass; backend 853/853 and frontend 868 passing with one existing skip, totaling 1,721 passing unit tests. Focused ListingPanel tests: 29/29. Existing Listing browser journeys: 9/9 pass. The first new browser run stopped on two instances of an incorrectly nested evidence-card test selector; correcting the selector retained all behavior assertions. The four new mobile/desktop light/dark review journeys then passed 4/4. These runs verify 13 distinct Listing cases; they are not described as one clean 13-case run. Logs: `.agent-logs/listing-review-unit.log`, `review-screen-check.log`, `review-screen-backend.log`, `review-screen-client.log`, `review-screen-browser.log` and `review-screen-browser-rerun.log`. Screenshots at 375px light and 1242px dark were visually reviewed under `.e2e-artifacts/v3-listing-workflow/`; keyboard focus/Back, source evidence, unchecked existing/contact facts, unchanged Bedrooms/contact and pending-versus-Apply isolation are covered. Gate4 N/A: no API/schema/backend changes. Production build was not rerun for this bounded UI refinement; prior build evidence above remains dated. Physical-device/user acceptance and milestone delivery/merge remain pending.

## Toolbar More follow-up (US-EDIT-033 T9)

The user requested Link field remain on the main toolbar and common element actions be available without a second More submenu. Runtime trace: V3Canvas → V3ElementToolbar measured ToolbarGroups → formatting overflow Popover → previous nested V3ElementActionsMenu. The Link group now reserves space before secondary formatting, and one More host contains overflow formatting plus the shared common actions directly. Spacious toolbars retain their sole common-actions More menu. The same command rendering and selection/lock/stale guards serve both presentations. Existing property-setting pickers are retained. Very narrow toolbar budgets may display the pinned Link icon with its accessible name.

Focused toolbar/shared-menu units pass39/39. Full automated/browser evidence is recorded below after checks finish; earlier report sections retain their original evidence dates.

Final T9 verification: frontend/API type checks pass; backend853 and frontend869 passing with one existing skip (1,722 passing units). Focused toolbar/shared menu units39/39 pass. Clean affected browser regression74/74 pass, no retries, covering all annotation cases, formatting/history/resize, element library and shared layer-menu actions. Logs: `.agent-logs/toolbar-single-more-check.log`, `toolbar-single-more-backend.log`, `toolbar-single-more-client.log`, `toolbar-single-more-unit.log`, `toolbar-single-more-regression.log`. The separate Save-label checks pass4/4 in `save-menu-label-browser.log`.

The initial new phone fixtures incorrectly assumed a default-open sidebar and were corrected to the existing default-closed phone state. The next run verified all new layouts but two image cases tried Save after closing only the nested Transparency setting; they now dismiss the remaining More host explicitly, preserving the two independent setting/overflow Escape behaviors. No product assertions were removed and no production changes were needed for these test setup corrections. The final74-case run is the clean evidence.

Desktop1242x668 with both sidebars in dark and phone375px in light screenshots were visually reviewed: Link remains in the toolbar, More contains no second More trigger, formatting groups appear before common actions and the menu scrolls within viewport bounds. Existing property-setting pickers remain separate. Gate4 N/A (no API/schema/backend changes); the production build and unrelated browser suites were not repeated for this scoped refinement. User/device acceptance and actual milestone merge remain pending.
