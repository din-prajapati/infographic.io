# Approved V3 Elements Library and Common Controls Plan

Approved by Dinesh on 2026-11-06 in response to the preceding annotated plan. Navy/Teal shell and existing functionality remain. Desktop-only V3 composition at 1242×668 and 1440px; existing mobile fallback remains usable without promising a new mobile editor.

## 1. Common toolbar and keyboard contract — US-EDIT-039

Every selected text, shape, image and line toolbar ends with the following controls, in this order. More is always last. User follow-up on 2026-11-06 moves Underline, Strikethrough and Text case to direct text toolbar buttons before the common controls; More contains only common actions.

```text
[ Element-specific controls ] | [Lock] [Duplicate] [Delete] [...]
                                                        +------------------+
                                                        | Copy      Ctrl+C |
                                                        | Paste     Ctrl+V |
                                                        | Duplicate Ctrl+D |
                                                        | Delete    Delete |
                                                        | Lock / Unlock    |
                                                        +------------------+
```

1. All common buttons and context entries call the same atomic selected-element commands. Duplicate generates fresh element IDs, preserves element contents/styles/metadata, offsets duplicates consistently, selects the copies and records one history step for the entire selection. Delete removes only eligible selected elements and records one history step. Copy is an internal editor clipboard snapshot; paste makes independent IDs and one history step. No browser clipboard permission is necessary.
2. Lock and Unlock are available for selected elements; locked elements remain selectable/unlockable through Layers. A locked selection cannot be moved, edited, deleted or duplicated. No stale preview survives delete, lock, selection change or document replacement. Empty/ineligible actions are safe no-ops and do not create history.
3. V3 implements Ctrl/Cmd+S save, Ctrl/Cmd+Z Undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z Redo, Delete/Backspace delete, Ctrl/Cmd+D duplicate, Ctrl/Cmd+C/V internal copy/paste, H hand, held Space temporary hand, Ctrl/Cmd+plus/minus zoom, Shift+1 fit, P Preview and Escape exit/cancel. Shift+click keeps existing add/remove selection behavior. Arrow keys nudge focused canvas selections 1px or 10px with Shift; a line must not receive duplicate nudge events from overlapping handlers.
4. Input, textarea, select, contenteditable, text editing, IME composition and interactive menus retain normal keyboard semantics. Canvas destructive shortcuts do not run there, or in Preview. Modifier combinations cannot accidentally trigger unmodified H/P. Save and safe history shortcuts retain existing intended behavior. Temporary Space hand releases on keyup and window blur; Ctrl+D browser bookmarking is prevented only when the editor handles duplication.
5. Keyboard verification records old/new editor support honestly, including registered-but-broken cases. Toolbar controls have accessible names, focus visibility and keyboard activation. Layout stays within desktop viewport in light and dark; overflow may wrap or scroll without hiding More.

## 2. Shape editing and library contract — US-EDIT-040

1. Shape Edit uses the same SlidersHorizontal icon as image Edit. The current shape menu becomes a compact icon/label/check list with no redundant title, excessive gaps or Done button; selecting closes it, using existing line-type density as reference.
2. Elements sidebar supports Shapes, Icons and Emoji tabs. Shapes groups expose existing rectangle/square, circle, ellipse, triangle, star, speech bubble, left arrow and right arrow; rounded rectangle and capsule are rectangle corner-radius variants. No new polygon geometry is implied.
3. Insert creates one valid selected shape at a visible canvas position with one Undo step. Shape replacement preserves ID, x/y, width/height, rotation, paints, opacity, borders and effects, changing only shape identity/variant-specific corner rounding. Current selection is visibly checked. Wrong-type, hidden, locked, deleted or stale targets cannot be replaced.
4. Search filters supported shape names; a zero-result state is explicit. Close/tab/rail transitions preserve existing sidebar behavior. All supported shapes save/reload and export with existing renderers. No old default-route UI rebuild.

```text
+------------------------------+
| Elements                   × |
| [Shapes] [Icons] [Emoji]      |
| [ Search shapes            ] |
| Basic shapes                 |
| [Square] [Rounded] [Circle]   |
| [Ellipse] [Triangle]          |
| Arrows                       |
| [Left] [Right]               |
| Stars & callouts             |
| [Star] [Speech bubble]        |
+------------------------------+
```

## 3. Property icons and emoji contract — US-EDIT-041

1. Initial curated library contains exactly 26 entries: location, rooms, bedrooms, floor area, availability, keys, cooker, refrigerator, shower, bath, washing machine, heating, air conditioning, daylight, furnished, Wi-Fi, parking, lift, accessibility, garden, balcony, phone, email, pet friendly, storage and security. Reuse installed Lucide SVG primitives with stable catalog IDs, readable English labels and German search aliases. Rooms and Bedrooms are distinct entries/labels; no unsupported inference from a bed symbol.
2. Categories are Property details, Kitchen & bathroom, Comfort, Building & outdoors and Contact. Search is case-insensitive across English and German aliases (including Heizung, Dusche, Küche); empty results are explicit.
3. Insert stores a self-contained SVG data source as an existing ImageElement with optional validated icon metadata; no backend or new element-type migration. Icon identity, selected solid color and stroke width survive duplicate, Undo/Redo and save/reload. PNG output includes the actual icon. Color uses the approved shared color selection flow; replacing an icon keeps frame, position, rotation and existing image styles, never silently recolors ordinary photographs.
4. An icon-only insertion is one history operation. An icon + editable label row inserts both elements in one operation and selects both. The label is a TextElement, uses existing listing-field bindings only where the existing field is an exact semantic match, and otherwise remains editable unbound text; no new Property schema or false binding. The icon and label do not claim new persistent grouping behavior.
5. Emoji is a small curated explicitly labeled tab, inserted as existing editable TextElement. No external emoji service or font download. Font-dependent emoji appearance is disclosed; the professional property icon catalog uses consistent SVG artwork.
6. Invalid/unknown icon identity, malformed metadata, unsupported colors or out-of-range stroke widths cannot create executable markup or corrupt a document. Only curated SVG templates and validated values generate assets; no arbitrary SVG upload feature. Stale/locked target replacement is a no-op. A failed image decode/export reports the existing retryable error rather than false success.
7. Buttons and tabs are keyboard accessible, SVG thumbnails have names, both themes preserve contrast, and the sidebar remains within 1242×668/1440px desktop bounds. Do not show nonfunctional future actions.

```text
+------------------------------+
| Elements                   × |
| [Shapes] [Icons] [Emoji]      |
| [Search heater / Heizung    ] |
| Property essentials          |
| [Location] [Rooms] [Area]     |
| [Calendar] [Bed] [Keys]       |
| Comfort & amenities          |
| [Heating] [Shower] [Kitchen]  |
| [Wi-Fi] [Parking] [Sunlight]  |
+------------------------------+
```

## Delivery boundaries

Implement all three slices in the current checkpoint branch/worktree. Preserve all peer edits. No paid calls, backend/schema changes, new drawing engine, new grouping system, Crop, large polygon/star/flowchart catalog, or automatic property-value invention. No commit, push, merge or deployment without renewed user permission. Verify check/unit plus scoped isolated browser suite; distinguish API-mocked persistence from authenticated database smoke. Stories remain merge-pending until approved milestone delivery.

## Approved annotation follow-up — 2026-11-06

V3 Layers uses 36px rows, 24px row controls, reduced padding and content-sized height with scrolling at the existing maximum. Outside pointer presses close Layers without suppressing the clicked action; interactions inside keep it open. Trigger and Escape dismissal remain. Direct text controls preserve the existing three-state case cycle and undo behavior.
