# Approved V3 toolbar and drawing implementation plan

Approved by Dinesh on 2026-11-01. This extends the approved Navy/Teal V3 shell without changing its skeleton. Implementation contracts: US-EDIT-032, US-EDIT-033, US-EDIT-034 in EPIC-EDIT-04/M-EDIT-11. Existing saved-document/API flow remains the foundation.

## Contextual toolbar layout

| Element | Visible controls | Secondary controls |
|---|---|---|
| Text | Font, size, colour, bold, italic, alignment, More | Underline, strikethrough, case, lists, opacity |
| Shape | Edit, Fill, Border, supported Corners, Opacity, Effects | Shadow details |
| Image | Edit, Replace, Flip, Corners, Opacity, More | Fit, Border, Reset |
| Line | Type, Colour, Stroke, Start/end decorations, Opacity | Swap ends |

Keep Duplicate/Delete universal in the vertical strip. Preserve rounded icons, quiet hover surfaces, teal selected/focus states and light/dark/system tokens. Toolbars anchor near selection, measure viewport boundaries, flip/clamp and overflow secondary controls. Locked/mixed selections cannot edit individual properties. Artwork is never recoloured by a UI theme switch.

## Existing editor parity and image sidebar

Retain all old text controls: existing fonts, size1–500 with ±, colour, bold/weight synchronization, italic/underline/strikethrough, case, alignment, bullet/numbered lists, opacity. Shape picker retains Rectangle/Square, Circle, Triangle, Star; changing shape preserves geometry/style/embedded text. Fill supports transparent, custom and brand colours. Shape/image Border supports none/solid/dashed/dotted, colour and thickness0–20. Rectangle/image corners0–100. Shape Effects is local None/Shadow: colour, opacity0–100%, blur0–100px, offsets−100..100px.

Image Edit opens the approved left sidebar with Back/Close, selected-image preview and Adjust. Brightness/Contrast/Saturation use icons, sliders and numeric inputs displaying−100..100 with0neutral (stored0..200 with100neutral). Adjust Reset affects only filters. Toolbar Reset restores filters/overlay/flips/opacity/radius and removes border, preserving source/geometry/fit. Image Replace uses upload/picker, retains ID/geometry/rotation/style, clears old source metadata and refreshes thumbnail; cancel/failure retains original and errors are visible. Switching images follows selection; non-image selection closes Edit; Back restores prior panel.

## Lines and rotation

Enable straight/curved/elbow pointer-drag drawing with transient preview, release-to-create/select and return to Select. Escape cancels; ignore gestures shorter than4screen pixels. Keyboard Insert creates200design-pixel line at centre. Defaultnavy#153B5B,2px,solid,no decorations. Shift constrains straight angles45°. Edit whole line/endpoints, curve bend and elbow middle segment; elbows remain orthogonal. Stroke styles solid/dashed/dotted and independent none/arrow/circle/bar ends; type changes retain endpoints/style. Existing Layers/visibility/locking/coordinates/clipboard/Duplicate/Delete apply.

Text/image/shape receive a circular outside-bounds rotation handle, centre-based drag/live angle, Shift15°snap and accessible numeric input. Handle size remains constant across zoom. Lines use endpoint orientation. Escape cancels, Preview hides handles, locked elements cannot rotate. Every completed gesture/numeric edit yields one history entry; previews remain transient and only completed changes trigger autosave.

## Model and compatibility

First-class LineElement extends base with lineType,start/end/control local coordinates, elbowAxis/elbowOffset,stroke,width,style and start/end decorations. Add optional image borderColor/borderWidth/borderStyle, shape strokeStyle and shadow{color,opacity,blur,offsetX,offsetY}. Existing records default solid/no new shadow or image border. Shared geometry/style helpers drive DOM, hit testing, thumbnails and Canvas PNG export. Update load/template/recovery validation and legacy dispatch to preserve lines. No DB migration or new backend API.

## Verification and exclusions

Create/harden scoped cards, then implement032geometry/drawing,033toolbars/sidebar,034rotation/styles/export/integration. Gate1frontend/API typechecks plusbackend/clientunit suites; Gate2light/dark/system1191x668/1440visual/focus/edges; Gate3draw/edit/undo/redo/save/reload/export/cancel/errorbrowser journeys. Retain authenticated real-server smoke separately from route mocks. All cards remain Not Started/In Progress until evidence and formal PR merge; independent review remains required.

Explicitly desktop-only: no375pxshell redesign. Exclude Crop, attached connectors, line labels, Animate, Position, Style, AI image modification, BG remover, eraser, Magictools, upscale, generation/video/StyleMatch and automatic segmentation. No inactive AI placeholders. Update IMPLEMENTATION_STATUS with delivered versus outstanding scope.
