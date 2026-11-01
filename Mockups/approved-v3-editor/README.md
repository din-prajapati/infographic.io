# Approved V3 editor design

Saved: 2026-10-31. Owner: Dinesh. Runtime integration: implemented locally on 2026-11-01; verification evidence, remaining features and delivery status are in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md). Formal review and merge remain pending.

The approval applies to the existing product's editor capabilities and the layout refined in this chat. It does not add Canva features or approve a deployment.

## Open the saved work

- [Approved Navy & Teal preview](index.html) — standalone interactive review, including Light, Dark and System. This is the latest approved visual direction.
- [Approved skeleton source](approved-skeleton.html) and [standalone skeleton](skeleton-preview.html) — the agreed layout before appearance alternatives.
- [Approved brand theme source](approved-brand-theme.html) — editable inline source of the latest preview.
- [Earlier Warm Gold / Cool Slate variations](appearance-preview.html) and [their source](appearance-variations.html) — comparison history.
- [Integration plan](INTEGRATION_PLAN.md) — how the design connects to the working V3 slice.
- [Snapshot manifest](SNAPSHOT.json) — source snapshot hashes and baseline Git commit.

From this folder, run `python -m http.server 5193 --bind 127.0.0.1`, then open `http://127.0.0.1:5193/index.html`. The existing chat preview on port 5192 remains available while its server is running. These repository copies do not depend on the chat visualization folder; embedded logos are included. The standalone wrapper loads its icon/runtime resources from CDNs, so full standalone rendering requires network access.

The controls above the product are review controls only. Do not add the appearance-review bar to the production editor. The production theme choice must use the product's existing theme preference.

## Frozen layout

- Top: actual product logo, Projects, editable title with content-sized width, adjacent cloud save-status icon, Undo/Redo, Preview, Save, Export.
- Rail: Templates, Tools, Text, Uploads, Brand, Property, Agent.
- Tools (latest approved revision): narrow floating vertical capsule with Select, Hand, Line, Shapes, Text and Image entries. Undo/Redo remain only in the top bar; + is removed. Shapes uses an overlapping circle-and-square symbol and opens a vertical list of the four current choices: Square/Rectangle, Circle, Triangle and Star. Duplicate/Delete appear below these tools whenever an element is selected and disappear when selection clears. The proximity toolbar holds type-specific formatting. This latest revision supersedes the earlier + submenu arrangement.
- Selection actions are universal: Text, Image and every supported Shape (Square/Rectangle, Circle, Triangle, Star) use the same Duplicate/Delete strip buttons. Match the old FloatingToolbar's `selectedElementIds.length > 0` rule, including multiple selections; do not gate these actions by element type. Duplicate/Delete operate on the selected IDs, while proximity formatting changes with the selected element type.
- Line is a user-requested new UI entry. The old editor's ShapeType and tool creation paths do not currently expose a line tool. The preview shows Straight line, Curved line and Elbow line choices in a vertical menu, matching the latest reference. Runtime support for these three line types needs its own scoped implementation contract.
- Context: element toolbar near the selected element; no permanent format bar above the workspace.
- Bottom of canvas: selected-element width × height in px and x/y coordinates at left; AI Assistant at right, above zoom controls.
- Footer: Layers before Canvas settings; element count; zoom minus, percentage dropdown, plus and Fit. Layers is not in the rail or floating mid-canvas.
- Templates: search, Recently used, More templates, thumbnail grid; no Save as template action in this panel.
- Text: Headline Large 48px, Headline Medium 36px, Title 24px, Subtitle 18px, Body Large 16px, Body 14px, Caption 12px, Price Tag 28px.
- Preview: canvas-only view, explicit Exit/Escape recovery, editing state preserved.

## Approved visual direction

Brand Navy & Teal derives from the existing logo's navy and mint/teal family. Functional UI shades are adapted for contrast, rather than treating sampled image pixels as official brand tokens.

| Role | Light | Dark |
|---|---|---|
| Header | Navy `#123E62` → deep teal `#196965` | Same gradient |
| Workspace | `#F2F4F6` | `#111318` |
| Panels | `#FFFFFF` | `#1E2228` |
| Main text | `#202A35` | `#EDF1F5` |
| Secondary text/icons | `#566372` | `#AFB9C7` |
| Accent foreground | `#076B6C` | `#7ADBCB` |
| Selected surface | `#DFF5F0` | `#203F3E` |
| Neutral hover | `#EDF0F3` | `#2A3039` |

Use consistent 1.8px rounded icon strokes, distinct hover/selected/focus/disabled states, and 140ms color transitions with reduced-motion support. Keep artwork colors independent from application theme. Production must express these roles as scoped theme tokens, not scattered component literals.

## Prototype boundaries

This bundle is a design reference, not a second editor engine. Templates use illustrative thumbnails and sample recent-use entries. Save status, generation, uploads and downloads are demonstrations. Zoom updates the prototype readout; geometry is estimated from the displayed sketch. Production must use actual server acknowledgements, template records, canvas zoom and document-coordinate state. Autosave is a pending capability, not delivered by this approval.
