# V3 Elements library and common controls verification

Approved implementation: US-EDIT-039, US-EDIT-040, US-EDIT-041. Branch `codex/v3-editor-checkpoint-2026-11-05`. Existing checkpoint `0f8c666` is preserved; this increment is uncommitted pending renewed permission under the approved plan.

## Delivered

- Shared Lock / Duplicate / Delete / final More actions on text, shape, image and line; context actions use the same atomic commands. Locked layers can be selected and unlocked. Underline, Strikethrough and Text case are direct buttons after Italic, per the latest annotation follow-up; More contains common actions only.
- Shape Edit uses the image Edit sliders icon and a compact, auto-closing list. Elements > Shapes exposes ten supported shapes and variants, with search, insertion and frame-preserving replacement.
- Elements > Icons offers 26 curated SVG property icons, five categories and English/German search. Icon-only or editable label rows insert in one Undo step. Existing exact address/phone/email bindings are reused; amenity labels remain editable text. Rooms and Bedrooms are separate.
- Icons retain embedded SVG artwork, color, stroke and opacity through saves. Shared color controls include No Color. Ordinary photographs are not recolored as icons. Emoji provides 12 editable text choices and discloses device/font variation.

## Automated baseline

`npm run check`: passed (frontend + API TypeScript). `npm run test:unit`: 1,476 passed (811 API + 665 client); one existing skipped client case (`loadVariation.spec.ts`, server-error fallback) remains skipped. No tests were disabled for this change.

The browser gate uses `e2e/v3-slice.config.ts`, an isolated Vite server on 5181 and intercepted auth/API fixtures. Save/reload assertions test serialization and session behavior; they do not certify authenticated database persistence. No database, backend or paid AI calls are involved.

Original library browser baseline: **109 passed** (`v3-library-browser-final.log`). This includes 98 existing cases and 11 new common-action/library cases. All original library runtime changes were included. Screenshots were visually inspected for layout, contrast, overlays and desktop bounds in light/dark; the final evidence-only rerun also passed all 11 cases, with transitions disabled during screenshot capture.

Gate 4 is not applicable: no backend, schema or API change. The configured visual checklist file is absent; use the skill's standard light/dark, focus, overlay, contrast and viewport checks. Desktop library composition is the approved scope; existing mobile fallback is preserved in source; no new mobile library layout is claimed or visually certified.

## Keyboard comparison

Legacy column is a source audit of EditorLayout.tsx / EditorToolbar.tsx and related handlers, not a claim that each legacy shortcut passed a live browser test. V3 is covered by unit and browser commands, with input/menu/IME/Preview protection.

| Shortcut | Legacy editor source | New V3 |
|---|---|---|
| Ctrl/Cmd+S | Registered by EditorToolbar | Save |
| Ctrl/Cmd+Z | Registered; limited focus guards | Undo |
| Ctrl/Cmd+Y / Shift+Z | Registered | Redo |
| Delete / Backspace | Registered; no typing guard in layout | Delete eligible selection |
| Ctrl/Cmd+D | No layout handler | Duplicate selection atomically |
| Ctrl/Cmd+C / V | Registered; paste has input guard | Internal snapshot copy/paste |
| H | Registered with input/textarea guard | Hand tool |
| Held Space | Releases to Select | Restores previous tool; blur/unmount safe |
| Ctrl/Cmd +/- | No layout handler | Zoom |
| Shift+1 | No layout handler | Fit canvas |
| P / Escape | Escape registered; Preview via button | Preview / exit |
| Arrows / Shift+arrows | Element-specific behavior | 1px / 10px nudge; line handler not doubled |
| Shift+click | Existing selection behavior | Preserved |

Copy/paste is internal to this editor; it does not request operating-system clipboard access. No new cross-application clipboard feature is claimed.

## Review boundaries

No Crop, new polygon geometry, persistent grouping, backend migration, external icon service, arbitrary SVG upload, push, merge or deployment. Stories remain In Progress / merge pending until milestone delivery.

## Runtime trace

`/editor?editor=v3` → V3Editor → V3Canvas / V3ElementsPanel → shared Zustand canvas store → existing session serialization, HTML artwork and PNG renderer. The legacy route remains the default. Icons are existing ImageElements with an optional validated metadata field, and their SVG source is embedded in the saved document. No source re-fetch or icon service is needed to reload. Metadata validation is enforced at the shared paint/document boundary and atomic insertion boundary. Preview color drafts stay outside canonical history.

Implementation review corrected Alt-modifier and open-menu shortcut guards, menu checkbox semantics and keyboard visibility of layer controls. The compact picker's dialog role is explicit so existing assistive technology and browser checks can locate it.

## Retained evidence

The final screenshots are saved under `Mockups/approved-v3-editor/evidence/`:

- `common-toolbar-dark.png`: shared action order at 1242×668.
- `elements-shapes-dark.png`: grouped shapes, supported variants and compact search.
- `elements-icons-light.png` / `elements-icons-dark.png`: same library and artwork in both themes.
- `elements-emoji-dark.png`: labeled editable emoji choices.

Export verification decodes the downloaded PNG and counts red artwork pixels inside the edited icon's exact frame after save/reload. This checks the actual icon rather than only a successful download. Replacement verification preserves icon ID/frame/color/stroke and restores the previous identity with one Undo. Existing browser cases also cover image Fit/Reset, observable text anchor alignment, color/gradient/border/effect previews, no-color persistence, selection geometry, save failures and legacy routing.

## Annotation follow-up — compact Layers and direct text controls

The user-approved follow-up changes Layers to 36px rows with 24px visibility/lock buttons and 8px panel padding, using a content-sized panel capped at 320px with scrolling. Selected rows use V3 theme tokens. A document capture listener dismisses only Layers on outside pointer presses without suppressing the underlying click; panel/trigger refs preserve inside interactions and toggle behavior. Escape is unchanged. All density selectors are scoped to V3, preserving legacy Layers.

Underline, Strikethrough and the existing AA/aa/Aa case cycle are now icon-only text toolbar controls after Italic, before alignment. Their existing formatting, save/reload and Undo behavior remains. More stays last and contains only Copy, Paste, Duplicate, Delete and Lock/Unlock.

Follow-up Gate 1 passed: frontend/API type checks and 1,476 unit tests (one existing skip). Final follow-up browser result: **113 passed** (`v3-layers-followup-browser.log`). Compact Layers in both themes and the direct text toolbar were visually inspected at 1242×668; no clipping or excess blank panel area. New acceptance checks cover direct text formatting, compact Layers and outside/inside clicks in both themes, trigger/Escape dismissal, and a bounded scrollable 13-layer list. Screenshots: `compact-layers-dark.png`, `compact-layers-light.png`, `direct-text-toolbar-dark.png`.
