# P1 essentials — newer listing mockup

Implemented 2026-11-13 in the existing V3 worktree. Preview: http://127.0.0.1:5194/editor.html

## Implemented scope

| Rank | Capability | How to try it |
|---|---|---|
| 1 | Export review and SVG/PNG download | Review & export checks missing facts/images, placeholders, outdated linked values, unapplied changes, invalid prices, lifecycle/intent mismatch and text overflow. Confirm the human review checkbox, then download. Rechecks state after image loading and PNG rendering. |
| 2 | Structured pricing | Open the Property card or select the price and Edit text. Set sale/rent, currency, numeric asking price/rent and rental period. Changing intent clears the old price; changing period retains the amount. |
| 3 | Reviewed extraction | Paste text, Extract & review. Inspect source snippets, select individual facts and resolve ambiguous prices. Multiple-property input is blocked; affected facts changed during review cannot be silently overwritten. Imported agent text remains a suggestion. |
| 4 | Linked text editing | Select text → Edit text, or use Template Fields. Canonical edits stay pending until Apply; all elements linked to that field update together. Specifications use separate beds/baths/area/unit inputs. Detach creates independent Design text; reconnect returns to the linked value. |

Canvas, export preview and downloads now share one SVG artwork renderer. Images are embedded in SVG exports; PNG uses the browser's SVG-to-canvas conversion at 1080×1440. Editor selection marks and field labels are excluded from exports. The renderer retains the mockup's fixed portrait layout and existing centred photo-crop convention. Configurable crop/geometry controls remain future work.

Pricing and extraction reuse the earlier prototype's local logic through `p1-core.js`, with adapters in `p1-model.js`. `p1.js` adds UI and runtime integration after the existing editor/refinement scripts. No production imports or API/database changes. Lookup IDs remain fictional. Actual flat-poster extraction and AI/Campaign Agent execution remain absent.

Save as Template retains reusable field links; Save as Design retains the applied record, structured price and independent/custom values. The existing browser-local storage key is retained, and old records are normalized on load. Pending records remain separate from applied artwork.

## Recovery

Before edits, all 20 prior mockup files were copied and hash-verified in `../checkpoints/listing-workflow-2026-11-13-before-p1-essentials/files/`. The checkpoint also contains a hash-verified browser-state backup of the three mockup keys and `RESTORE.md`. Do not restore automatically: it would replace subsequent local changes.

## Verification

- `node --test Mockups/listing-workflow-v1/p1.test.mjs Mockups/listing-workflow-v1/refinement.test.mjs`: **30/30 pass** (17 P1 tests, 13 prior refinement tests).
- P1 tests run actual scripts and UI event handlers in JSDOM, including pricing transitions, invalid input, reviewed import ambiguity/provenance/stale checks, protected agent identity, linked edits, detach/reconnect, structured rent save/reload/reopen, review gating, embedded SVG downloads and asynchronous stale-export rejection.
- Shared export SVG rasterized with Sharp to an actual 1080×1440 PNG, visually inspected including the logo, photograph, price, specs and agent. Artifacts: `verification/p1-sample.svg` and `verification/p1-sample.png`. These are export artifacts, not browser screenshots.
- Browser automation fails before execution with a kernel-assets/path error. Native browser PNG download, pixel correspondence across browsers, desktop sidebar/dialog layout, focus, scroll and local file-upload interaction remain unverified in a fresh browser pass. SVG handler tests replace only the file-download boundary. Sharp rasterization does not prove browser-native PNG download.
- Production verification gates were not run for this isolated static mockup. No story closure, release, merge or deployment is claimed.

## P2 item 6 — proposed only, not implemented

| Control | Proposed change | Binding behavior |
|---|---|---|
| Text appearance | Font, size, weight, alignment and spacing for the selected element. | Changes appearance; linked text still comes from the selected Property/Agent field. |
| Colours | Brand swatches plus text, background and accent colours. | Does not modify Property facts; distinguish using the brand colour from a Design-specific colour. |
| Asset formats | Portrait, square and story presets with a preview and fit warnings. | Reflow needs review; do not promise perfect automatic resizing. |
| Position and crop | Move, resize and align elements; adjust photo crop inside its frame. | Geometry and crop stay with the asset/template while source links remain intact. |
| Layers | Reorder, show/hide and lock elements. | Export review should flag hidden essential facts. |

Save as Template would store these appearance defaults with its field links. Save as Design would store the current asset's appearance and content snapshot. This is separate from a full undo/redo history and arbitrary-image reconstruction.
