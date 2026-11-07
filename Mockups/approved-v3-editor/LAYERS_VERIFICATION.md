# Layers sidebar verification

Date: 2026-11-07 (Asia/Calcutta). Stories US-EDIT-042 and US-EDIT-043. Branch `codex/v3-editor-checkpoint-2026-11-05`; prior uncommitted work preserved. No new commit, push, merge or deployment.

## Delivered scope

The bottom **Layers** button opens/toggles the full sidebar, including with no selection. The old compact V3 popup and toolbar Layers shortcuts are removed. The sidebar contains **All** and **Overlapping**, actual previews, row menus, handle-only drag ordering, keyboard ordering and a fixed page-background row. Canvas selection keeps it open; its close button, footer toggle or Escape restores the preceding sidebar.

Every element toolbar's final **More** button and each layer row use `V3ElementActionsMenu`: Copy, Paste, Duplicate, Delete; Bring forward, Send backward, Bring to front, Send to back; Hide/Show, Lock/Unlock. These share compact icon rows, separators, hover and disabled styling. Direct Lock/Duplicate/Delete remain visible. Stack/visibility entries require one eligible target; multi-selection copy/duplicate/delete/lock preserve existing atomic history. Menus reject stale targets and preserve canvas pointer interaction.

**Arrange remains excluded.** No Arrange tab, alignment controls, size/ratio/position/rotation fields, distribute/tidy-up or future placeholders were added. The optional RotationHandle callback only reports its existing temporary angle to the Layers overlap view; it adds no new rotation UI or editing feature.

## Runtime and invariants

V3Editor -> footer V3Canvas -> V3LayersPanel / V3ElementToolbar -> shared V3ElementActionsMenu -> v3LayerActions / v3LayerGeometry -> existing canvas store/history/session/renderers. The legacy default route and document format remain unchanged.

- List order reverses the stable canvas paint order, including equal/gapped/negative indices. A real move normalizes unique indices and changes no geometry/style/selection IDs. Boundary/no-op/stale/locked operations do not create history. One completed drop is one Undo step.
- Row menus first select their own row, then use live-ID and selection checks. Copy/Paste/Duplicate/Delete reuse existing atomic commands. Hidden/locked rows remain reachable; a hidden layer can be unlocked and shown. A stale menu cannot act on an unrelated selection.
- Drag order uses live source/anchor IDs, an insertion marker and edge auto-scroll. Escape, self-drop, drag-end and stale/locked sources cancel without history. Alt+Arrow provides adjacent keyboard moves; menus provide all four global ordering actions. Overlapping disables drag and offers Switch to All to drag.
- Overlap uses individual selected frames, rather than the enclosing rectangle between separated selections. Hidden elements are excluded, locked visible elements included. Bounds account for rotation and line path/stroke/endings, including quadratic extrema and flat local frames. This is conservative frame geometry, not pixel/alpha collision; rotated AABBs can include extra candidates.
- Temporary drag/resize/rotation and style previews feed the overlap presentation without entering the saved document or history. Canonical reference checks discard stale presentation. The final edit still follows the existing gesture/history path.
- Background is a fixed special row, not a CanvasElement. It opens the existing background-color sidebar and is never reordered, duplicated or deleted. In Overlapping it appears only when a visible selected frame intersects the page.

## Preview coverage

Actual text/font/case/tracking/anchor/paint and emoji; all supported shape paths, borders, gradients and effects; real source images/icons with fit/corners/flips/filter/overlay; shared line paths, dashes, colors and endings. Static previews never mount draggable canvas components. Unique SVG IDs avoid clashes with canvas gradients/filters. Image loading/error states are named, and a new source resets the failure state. Memoization ignores position/stack-only changes so reordering does not recreate source-image work.

Visual review improved the thumbnail surface to a neutral light checkerboard and widened it to 96px, making dark text/icons readable inside either theme. The surrounding sidebar preserves the approved Navy/Teal tokens.

## Gate evidence

- Gate 1: `npm run check` passed; **1,515 unit tests passed** (811 API + 704 client), one pre-existing client skip unchanged.
- Gate 2: all retained desktop screenshots visually inspected in both themes; readable previews and bounded sidebar/menu at 1242×668. Existing regression also checks the 1440px shell; the current mobile fallback is preserved without introducing a mobile Layers composition.
- Gate 3: **124 distinct browser cases verified across the full run and final affected rerun**. The full run passed 116/124; seven menu-name failures were corrected and one blank-save timeout passed immediately on rerun. The final 28-case run passed, including all eight prior failures, every Layers/library case and the existing More-menu case. This is combined evidence, not a claim of a single all-green 124-case invocation.
- Gate 4: not applicable, frontend-only.

Evidence logs (ignored under the main repository `.agent-logs`): `v3-layers-annotation-final-check.log`, `v3-layers-annotation-final-units.log`, `v3-layers-annotation-full.log` and `v3-layers-annotation-final-browser.log`. The initial failing footer/menu tests remain retained; no failing tests were skipped or weakened. The menu tests exposed selection loss with modal pointer handling and Radix's generated accessible-name override; both were repaired and tested.

Type/unit checks: `npm run check` (frontend + API TypeScript), `npm run test:unit` (mock-based API and client). Browser tests use `e2e/v3-slice.config.ts`, isolated Vite on 5181 and intercepted API/auth fixtures. Save/reload verifies serialization and client session behavior; it is not an authenticated database persistence smoke test. No backend/schema changes or paid calls. Gate 4 is not applicable.

Browser contracts cover both themes at1242×668, actual previews and bounded menus, row-specific actions/hidden unlocking, real drag/Undo/Redo/save/reload, red pixels in the exported PNG at the exact changed overlap location, live Overlapping, footer-only entry, sidebar restoration and no duplicate popup, no-selection/background behavior, cancellation/self-drop/keyboard history boundaries, and edge auto-scroll in a29-layer list.

Retained evidence under `Mockups/approved-v3-editor/evidence/`:
- layers-all-dark.png
- layers-all-light.png
- layers-overlapping-dark.png
- layers-menu-dark.png
- layers-drag-dark.png

Formal story Done and milestone delivery remain merge-pending.


## Element-specific toolbar inventory

| Element | Existing specific controls preserved |
|---|---|
| Text (including emoji) | Font family; grouped decrease/value/increase size; text color; bold, italic, underline, strikethrough; three-state case; alignment; bullet/numbered lists; letter/line spacing and text-box anchor; opacity. |
| Shape | Compact Edit and full shape browser; fill; border color, pattern and weight; rectangular corners; opacity; Effects sidebar. |
| Photo/image | Edit adjustments; Replace; horizontal/vertical flip; border color, pattern and weight; corners; opacity; Cover/Contain/Stretch fit; Reset. |
| Property SVG icon | Edit/replace icon; icon color; stroke weight; opacity. |
| Line | Stroke color, pattern, rounded caps and weight; start/end decorations; swap ends; Straight/Elbowed/Curved type; opacity. |

All five variants retain direct Lock/Duplicate/Delete and final shared More. These are property controls, separate from the common element-action menu.

## Annotation revision evidence — 2026-11-07

A contract-derived browser test first reproduced the old footer popup. Pointer-click checks then exposed modal dropdown opening clearing selection; the shared menu now uses nonmodal interaction with a dedicated regression test. Explicit accessible names also override Radix’s generated labelled-by reference. Localhost5000 serves the new V3Canvas source (HTTP200, old compact callback absent). Initial logs include `v3-footer-revision-red.log`; final gate logs are listed above. All logs are ignored under the main repository `.agent-logs` directory. No authenticated owner artwork was changed.
