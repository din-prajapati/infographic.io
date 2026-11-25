# Position, Layers and Arrange — proposed plan

Date: 2026-11-07 (Asia/Calcutta). Original proposal retained below; later authorization implements Layers only. The latest annotation revision at the end supersedes footer and toolbar entry points. Arrange remains future work.

## Reference inspected

Inspected the existing Canva design tab's Position > Layers, All/Overlapping, a layer's ellipsis menu, and Position > Arrange. Only tabs/filters/menus were opened; no artwork edits or rearrangements were made. Returned to Layers > All with the layer menu closed.

Observed:
- Layers shows artwork previews, highest/frontmost element first, row drag handles and a separate menu for each element.
- For the selected image, Overlapping reduced the list to the image and background in this document. This observation does not prove Canva's collision algorithm, transparent-pixel handling, or multi-selection semantics.
- The image row menu offers Copy, Copy style, Paste, Duplicate, Delete, Align to page, Lock, and several unrelated features such as comments, links, timing and downloads. We should expose only implemented editor actions.
- Arrange shows Forward, Backward, To front, To back; six Align to page controls; Width, Height, Ratio, X, Y and Rotate fields. Stacking buttons were disabled for the inspected selection; no document modifications were needed to inspect them.

## Original proposed entry points (superseded for Layers)

Add Position before the common Lock/Duplicate/Delete/More controls in element toolbars. Open a full sidebar with Arrange and Layers tabs. Keep the recently approved compact footer Layers popup for quick selection; share ordering/selection/action logic between both views. Never show both Layers surfaces at once. Closing Position restores the previous sidebar. Preserve the Navy/Teal theme and direct text formatting controls.

Full sidebar rows should be about 52–56px to accommodate real previews. The existing quick popup keeps its compact 36px rows; do not enlarge it silently.

## Layers ASCII

```text
+------------------------------------+
| Position                         X |
| [ Arrange ]     [ Layers ======= ]  |
|                                    |
| [ All =========== | Overlapping ]  |
| Front / top                        |
| +--------------------------------+ |
| | ::  [----- red line -----]  ... | |
| +--------------------------------+ |
| | ::  [ADD A HEADING]         ... | |
| +--------------------------------+ |
| | ::  [colored circle]       ... | |
| +================================+ |
| | ::  [photo thumbnail]       ... | | <- selected
| +================================+ |
| | ::  [heater / emoji]        ... | |
| +--------------------------------+ |
| | ::  [background]       [locked] | | <- fixed page background
| +--------------------------------+ |
| Back / bottom           [scroll]   |
+------------------------------------+
        :: drag handle
```

Background is a fixed special row representing the existing page background, not a newly invented CanvasElement. It is not draggable/deletable/duplicable. It can open the existing background-color flow. Omit it from geometric selection/multi-selection. In Overlapping, include it only when a selected visible element intersects the page.

```text
Row ...
+------------------------------+
| Copy                  Ctrl+C |
| Paste                 Ctrl+V |
| Duplicate             Ctrl+D |
| Delete                Delete |
|------------------------------|
| Bring forward                |
| Send backward                |
| Bring to front               |
| Send to back                 |
|------------------------------|
| Hide / Show                  |
| Lock / Unlock                |
+------------------------------+
```

The row menu targets the clicked row, never an unrelated previously selected element. Opening it selects that element first; common commands reuse V3 atomic actions. Disabled states are explicit for locked elements and stack boundaries. Hidden rows remain in All, with a dimmed preview and a visible Show action. Menus and drag handles appear on hover/focus; keyboard access does not depend on hover.

### Actual previews

- Text: scaled text/content with font, color and case; emoji uses the same text approach.
- Shape: actual geometry, fill, border and gradient, rather than a generic square.
- Image: actual source, fit/corner treatment and flips; property icons use their embedded SVG.
- Line: shared path, color, weight, dashes and endings.
- Loading/broken image: stable named fallback, with no effect on selection or export.

Use shared paint/geometry helpers, not draggable canvas components. Keep previews clipped to their cards; preserve element aspect ratio. Cache expensive image work and invalidate a preview only when its appearance changes. Existing legacy thumbnail code is not an accurate all-type renderer: text is a generic icon, shapes are simplified, and lines fall back to a generic element.

### Reordering

Drag handle shows an insertion line; auto-scroll near list edges. Commit exactly one Undo step on drop. Escape/cancel/no-op drops create no history. Keyboard reorder controls provide the same operations. Keep selected element IDs and all geometry/styles unchanged. Normalize a stable, unique stacking order rather than adding/subtracting a zIndex that may collide.

Initially drag one layer at a time. Locked layers cannot be dragged, though their relative visual order may change when other layers pass them. Multi-selection remains available, but block/group dragging is a separate addition. Do not add fake persistent grouping.

### Overlapping

```text
Selected photo on canvas
        |
        v
[ Layers > Overlapping ]
+------------------------------------+
| :: [selected photo]            ... |
| :: [line crossing photo frame] ... |
| :: [shape behind photo]        ... |
|    [page background]      [locked]  |
+------------------------------------+

Nothing selected:
"Select an element to see overlapping layers."
```

Proposed initial contract:
- Keep the selected element(s) and visible elements whose transformed frame bounds intersect any selected frame, in the same global stacking order.
- Exclude hidden elements; include locked visible elements. With multiple selected elements, use the union of their individual overlaps, not the large empty rectangle between them.
- Use rotation-aware bounds and stroke-aware line bounds. Frame intersection is geometric, not an opaque-pixel/alpha mask test; rotated bounding boxes can conservatively include extra candidates.
- Update live as elements move, resize, rotate, hide or are removed. No selection produces a prompt, and no additional overlaps produces an explicit selected-only state.
- Disable drag reordering in the filtered list initially: hidden/intervening layers make a drop ambiguous. Keep the four global ordering commands available and offer Switch to All to drag.

## Arrange ASCII and scope

```text
+------------------------------------+
| Position                         X |
| [ Arrange ======= ]     [ Layers ] |
|                                    |
| Stacking                           |
| [ Forward ]       [ Backward ]     |
| [ To front ]      [ To back ]      |
|------------------------------------|
| Align to: [ Page v ]               |
| [Left] [H-center] [Right]           |
| [Top ] [V-center] [Bottom]          |
|------------------------------------|
| Advanced                           |
| Width  [ 320 ]  Height [ 180 ]      |
| [ratio lock]                       |
| X      [ 120 ]  Y      [ 240 ]      |
| Rotate [   0 ] degrees             |
+------------------------------------+
```

Core Arrange: reuse the same four stacking commands, plus six page-alignment actions. For multiple selected elements, align their combined visual bounds as a unit, preserving spacing. Disable mutations for locked/ineligible selections. One completed action equals one Undo step.

Advanced Arrange: X/Y refer to the element's stored frame origin, width/height to its local dimensions, and rotation to degrees. This avoids changing coordinate meaning as an item rotates. Validate blank/nonfinite/out-of-range inputs, support Escape cancellation and one commit per completed edit, and preserve aspect ratio when enabled. Lines must resize their local geometry correctly. For the initial delivery these numeric fields require a single unlocked selection; multi-selection numeric transforms are separate work.

Optional later: align individual elements to a selection, distribute horizontally/vertically, equal spacing/tidy-up, multi-layer block dragging and pixel-precise overlap. Do not silently include these in the core estimate.

## Implementation basis and likely file scope

Current V3 path: V3Editor -> V3Canvas -> LayersTab -> LayerItem, with V3ElementToolbar and v3EditorActions for common actions. Existing preview component LayerItemWithThumbnail is legacy and incomplete for this design. Existing getElementBounds ignores rotation; it cannot be reused unchanged for overlap/alignment. Existing Forward/Backward increment/decrement zIndex and can tie adjacent elements.

Likely existing integration files:
- client/src/components/editor/v3/V3Editor.tsx
- client/src/components/editor/v3/V3Canvas.tsx
- client/src/components/editor/v3/V3ElementToolbar.tsx
- client/src/components/editor/v3/v3-editor.css
- client/src/styles/v3-element-toolbar.css
- client/src/lib/v3EditorActions.ts
- shared geometry/paint helpers where needed

Likely new modules: V3PositionPanel, V3LayerList, V3LayerPreview, V3LayerMenu; pure layer-order, overlap and arrange helpers; matching unit/browser tests. Reuse the current document format, state/history and save/export paths. No backend/schema changes or paid services. Avoid adding a drag library unless the existing installed UI tooling is insufficient.

## Estimates

Engineering effort ranges, including tests and visual checks; estimates assume current element types and one active page.

| Layers work | Estimate |
|---|---:|
| Position shell, list selection and shared row menu | 1.5–2 h |
| Accurate all-type previews and fallback/cache behavior | 2–3 h |
| Atomic stable reorder, drag/drop, keyboard and auto-scroll | 2–3 h |
| Overlapping geometry/filter states | 1–2 h |
| Regression, persistence/Undo and both-theme visual checks | 1.5–2 h |
| Layers total | 8–12 h |

| Arrange work (after shared layer commands exist) | Estimate |
|---|---:|
| Core: four stacking actions, six page-alignment actions and tests | 3–5 h |
| Advanced: single-selection dimensions, ratio, X/Y, rotation and tests | +3–5 h |
| Full proposed Arrange total | 6–10 h additional |
| Optional distribute/spacing/tidy-up | +2–3 h, separate scope |

Layers + full proposed Arrange: 14–22 h total. Layers + core Arrange: 11–17 h. If Arrange ships independently first, allow another 1–2 h for the shared ordering foundation (not charged again when both ship together). Largest uncertainty: accurate previews and rotated/line geometry; not menu styling.

## Delivery order and acceptance

1. Stable shared layer-order commands and actual preview list, with row menus.
2. Drag/keyboard reorder and Overlapping.
3. Core Arrange using the shared commands.
4. Advanced single-element numeric controls if approved.

Verification: all four element types plus property SVG icons and emoji; equal/gapped existing zIndex values; locked/hidden/deleted targets; Undo/Redo and save/reload; actual PNG order; no-op/cancel; no-selection Overlapping; rotation/line cases; filtered-list disabled dragging; menu focus/Escape/outside dismissal; long-list scrolling; both themes at 1242×668 and 1440px; current compact popup behavior preserved. Run type/unit gates and the existing isolated V3 browser suite with new cases.

This document is a reviewable proposal. No runtime files, package dependencies, story statuses or Git commits were changed by this planning task.


## Superseding annotation — 2026-11-07

The footer Layers button now owns the full sidebar entry and toggles it. Remove the compact V3 popup and toolbar Layers shortcut. The sidebar stays open during canvas selection; closing it restores the preceding panel. Common toolbar More menus share the layer-row menu component and actions, with guarded stack/visibility actions for a single selected layer. Existing type-specific property controls remain available. Arrange is still future work.
