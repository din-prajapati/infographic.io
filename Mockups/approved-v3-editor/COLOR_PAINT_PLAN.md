# Approved V3 Color and Stroke Contract — 2026-11-05

User approved implementation of the conversation plan on 2026-11-05. This contract supersedes prior gradient/paint exclusions only for US-EDIT-035–037; completed editor capabilities and approved Navy/Teal shell remain.

## Shared paint interface

```ts
type PaintStop = { color: string; opacity: number }; // normalized #RRGGBB, opacity0..1
type Paint =
  | { type: 'none' }
  | { type: 'solid'; color: string; opacity: number }
  | { type: 'linear'; angle: 0 | 90 | 135; stops: PaintStop[] }
  | { type: 'radial'; center: 'center' | 'corner'; stops: PaintStop[] };
```

BaseElement gains optional paints with color/fill/stroke/overlay Paint keys. Text uses color; shapes fill/stroke; images stroke (border)/overlay; lines stroke. CanvasState/document adds optional backgroundPaint. Shadows remain existing solid color+opacity, without Gradient tab. Gradients contain2–5 evenly distributed stops. No backend/schema migration.

Legacy strings remain readable fallbacks and are synchronized by shared paint patch helpers: solid uses its color, none uses transparent, gradient uses first-stop color. Explicit paint overrides take rendering precedence. Absent overrides preserve all previous appearance. Palette application and appearance Reset must remove or replace affected overrides, avoiding stale gradients over newly applied strings. Linear preset angles use design semantics:0 left-to-right,90 top-to-bottom,135 top-left-to-bottom-right; do not interpret these as raw CSS angle conventions.

Invalid/non-finite paint inputs, invalid enum values, unsupported targets and invalid stop counts cannot enter canonical state. Old documents without paints load unchanged; malformed new paints use the existing visible load error rather than rendering invalid data.

## Color sidebar

Eight targets: text, shape fill, shape stroke, shape shadow, image border, image overlay, line stroke, canvas background. Toolbar swatches open the shared sidebar. Shadow swatch and background swatch use the same panel. Image overlay has a color entry within existing Edit image. Color panel temporarily replaces the existing left panel; close restores it. Target title updates on selection change; stale previews cannot mutate the prior element. Multi-selection, locked or hidden elements reject element-color edits. Background remains independently editable.

```text
+--------------------------------+
| Fill color              [≡] [X]|
| [Search name or #hex          ] |
| Shape colors                   |
| [+] [Eyedropper] [/] [Current]  |
| Colors in this design          |
| (●) (●) (●) (●) (●) (●)        |
| Brand colors             [Edit]|
| (●) (●) (●) (●) (●)            |
| Default solid colors           |
| (●) (●) (●) (●) (●) (●)        |
| Default gradients              |
| (////) (////) (////)            |
+--------------------------------+
```

Grid/list switch uses labeled swatches. Search filters visible names/hex and offers valid custom hex. Deduplicate committed document colors including gradient stops. Brand swatches affect only the target; existing whole-design palette application stays separate. Edit opens existing palette management and retains return target. No empty Photo colors section.

Plus/current-color opens the detailed picker. All controls keyboard accessible, labeled, focused visibly. Eyedropper uses browser support when present; unsupported/cancelled requests leave document unchanged and retain manual entry.

```text
+--------------------------------+
| [ Solid color ] [ Gradient ]   |
| +----------------------------+ |
| | Saturation / brightness o  | |
| +----------------------------+ |
| Hue     [======o=============] |
| Alpha   [checkerboard======o=] |
| [● #D4FFD4          | 100 %] [E]|
+--------------------------------+

+--------------------------------+
| [ Solid color ] [ Gradient ]   |
| Gradient colors                |
| [● Stop 1] [● Stop 2] [+]       |
| Style                          |
| [ Left→Right ] [ Top→Bottom ]  |
| [ Diagonal   ] [ Center out ]  |
| [ Corner out ]                 |
+--------------------------------+
```

Saturation/brightness, hue, alpha, hex and percentage are custom controls, not native color dialogs. Stops use the same solid picker. Minimum2 maximum5 stops; removing stops below2 is disabled. Switching Gradient previews two stops derived from the current color; dismiss cancels, stop/style confirmation commits. Switching Solid uses the selected stop.

Live changes are transient; completed slider drag, confirmed numeric edit, or swatch selection makes exactly one Undo revision. Escape cancels unfinished changes. Selection change, panel close or Preview entry clears pending changes. Paint alpha is independent of element opacity.

No Color: checkerboard+slash, accessible name No color. Shape fill becomes transparent; text transparent but editable; stroke invisible but selectable; overlay/shadow removed; background transparent in PNG. Never delete content/geometry.

## Stroke and line type

Separate color from style: shape [Edit][Fill][Stroke color][Stroke style][Corners]; image gets Border color before Stroke style; line gets Stroke color, Stroke style, Start, Swap, End, Type. Text retains A color. Style menus contain no nested color section.

```text
+----------------------------------+
| [ / ] [ ── ] [ ─ ─ ] [ --- ] [··]|
| Stroke weight                    |
| [o====================] [ 7 ]    |
+----------------------------------+

+----------------------------------+
| [ ── ] [ ─ ─ ] [ --- ] [··]      |
| Rounded end points         [OFF] |
| Stroke weight                    |
| [o====================] [ 4 ]    |
+----------------------------------+

+-------------------+
| o──o Straight   ✓ |
| o─┐  Elbowed      |
| o~o  Curved       |
+-------------------+
```

Shape/image five choices: none,solid,long dashes,short dashes,dots. Line four patterns, retaining rounded-end toggle and decorations. Existing dashed remains long dashes; short-dashed is a new explicit style with distinct DOM/SVG/PNG output. Shape/image width0–20; none sets0; choosing visible style restores prior positive width (default1). Selecting visible border paint at width0 enables width1. Line width1–20; No Color hides line. No heading or Done button in stroke/type menus. Line type menu ~150px wide, three compact rows with matching icons/trailing check; selecting commits once and closes.

## Compatibility, limits and verification

HTML/SVG, inline text editing, decorations, overlays, background, thumbnails and PNG agree. Gradient text remains editable. Background paint participates in dirty detection, autosave, persistence and Undo/Redo. Live preview never serializes. Retain legacy/default editor behavior and prior line, spacing, geometry, fit, rotation, palette, save/export capabilities.

Desktop-only V3 slice: visual evidence at1242x668 and1440 width in light/dark; no375px mobile shell added. Unit and browser evidence covers eight targets, None, alpha, five gradient presets, stop edits, history/cancellation/stale selection/locks, unsupported eyedropper, border restoration, compact line type, old document and new save/reload/PNG parity. Required commands: npm run check; npm run test:unit; npm run test:unit:client; npx playwright test --config=e2e/v3-slice.config.ts.

Exclude photo-color extraction, recoloring image pixels, Change all, Crop, new shapes, collaboration, paid AI, SVG/PDF export, route/default changes, performance optimization and production delivery. No commit/push/merge/deploy without user permission.
