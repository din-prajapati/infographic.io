# V3 color and paint verification - 2026-11-05

User-approved scope: COLOR_PAINT_PLAN.md. Contracts: US-EDIT-035 (paint engine), US-EDIT-036 (shared color panel), US-EDIT-037 (compact stroke/type menus). Existing worktree and branch are retained. Previous uncommitted031-034 work and unrelated docs/reviews are preserved.

## Delivered behavior

- All eight color targets share one sidebar: text, shape fill/stroke/shadow, image border/overlay, line stroke and canvas background. Toolbar swatches open the sidebar; Add/current color opens the custom picker. Closing restores the prior sidebar, including the Brand edit detour and image editor.
- Solid picker: saturation/brightness, hue, alpha, hex, percent and feature-detected eyedropper. No Color keeps element geometry/content selectable. Search/grid/list reuse design colors, existing Brand palettes and defaults; default shade names match the actual supplied palette. Individual palette swatches change only the active target.
- Gradient paints:2-5 evenly spaced alpha stops, three linear presets and two radial presets. Shadows remain solid-only. Gradient tab changes preview only; confirmation commits once. CSS/SVG/PNG share bounds and preset directions, including non-square diagonal and radial geometry. New text gradient fills retain original editable text; underline/strike and the inline-edit caret presentation use the same first-stop color in DOM and PNG.
- Paint overrides are optional, with synchronized legacy fallback colors. Validation, capture/restore, save fingerprints, thumbnails and PNG include confirmed paints. Legacy color changes remove stale overrides. Legacy named/short/rgb colors normalize without disappearing. The existing editor displays saved background paints without gaining new color controls.
- Background color edits are undoable. Transient previews never enter canonical state, history or autosave, and selection/Preview/dismissal cancels unfinished drafts. Precise alpha is retained when an unchanged rounded display blurs; Escape followed by blur cannot commit a cancelled edit.
- Shape/image strokes offer No stroke, solid, long dashes, short dashes and dots; lines offer four patterns plus rounded endpoints. Last positive border weight survives No stroke/menu dismissal during the document session. The line-type picker has three compact icon/label/check rows and closes after selection.
- Delayed automatic canvas fitting no longer overwrites a manual zoom/pan choice or applies to a stale document/schedule.

## Automated evidence

- Gate1: `npm run check` passes frontend and API type checks, exit0. Main workspace log: `.agent-logs/v3-color-check-final2.log`.
- Gate1: `npm run test:unit` passes811 backend +614 client =1,425 tests; one existing client skip. This command also runs the client unit script. Log: `.agent-logs/v3-color-unit-final2.log`.
- Gate3 final complete runner: 89 passed (5.3m), exit0. Command: `node node_modules/@playwright/test/cli.js test --config=e2e/v3-slice.config.ts`; log: `.agent-logs/v3-color-browser-complete.log`.
- Contract-first failures were reproduced for missing paint/controller/panel behavior, toolbar color routing/five patterns, cancelled field blur, clean alpha precision, default shade-name search, No stroke weight after reopening, manual zoom versus delayed fitting, and legacy background gradient readback. Focused corrected tests are included in the complete suites.
- An initial focused browser attempt had11 pass/2 fail: the overlay test initially used an already absent overlay (a legitimate no-op), and a stroke test encountered a page reload during active development. The overlay fixture now starts with a real overlay; the complete run is performed after runtime edits stop. A later full run had88 pass/1 fail, exposing the delayed-fit/manual-zoom race. After its correction, a complete89-case run passed; legacy background readback was then added to the existing radial-background case. Its first assertion targeted the transparent inner node instead of the actual outer artboard; correcting that selector verified the rendered background. The final complete run passed all89 cases. No timeout or assertion was weakened.
- Review corrected flipped image-border gradient coordinates, transformed line-decoration paint coordinates, diagonal CSS direction, overlay/filter separation, legacy color normalization, stale background drafts, Brand/sidebar restoration and cancelled numeric blur. TypeScript narrowing cleanup was also required and is reflected in final Gate1.

## Visual and runtime evidence

Gate2 uses the approved desktop-only scope:1242x668 light/dark picker/gradient screenshots, compact stroke and line-type screenshots, and existing1280/1440 shell checks. Final screenshots are retained under `evidence/color-{solid-light,solid-dark,gradient-light,gradient-dark,stroke-dark,line-type-dark}.png` and were inspected after the final complete run.

The existing frontend5000 and API3001 both returned HTTP200. Tests use isolated Chromium with mocked auth/API on Vite5181 and do not modify the owner's live artwork, call paid providers or access production data. New authenticated database persistence smoke and production build were not run; historical smoke/build evidence is not presented as new evidence.

Gate4 is not triggered: no backend, authentication, schema or deployment changes. Photo extraction, image-pixel recoloring, Change all, Crop, new shape types and other excluded features remain outside this increment. Changes remain uncommitted; formal Done, PR merge, push and deployment remain pending user authorization.
