# Four editor annotations — verification, 2026-11-05

Contract: US-EDIT-038, based on the owner's four annotated screenshots. Existing worktree `v3-slice`, branch `feat/edit/m-11-v3-editor-slice`. Prior uncommitted editor work and unrelated `docs/reviews/` are preserved. No commit, push, merge or deployment.

## Delivered behavior

- Shape Effects now opens in the existing sidebar, replacing the shadow-only popover. Three-column thumbnail/label cards provide None, Drop, Glow, Echo and Glitch, followed by Advanced Radioactive, Retro and Midnight. All cards apply real effects and preserve the original shape fill. The prior sidebar returns on close. Existing shadow color, opacity, blur and offsets remain available below the gallery.
- Echo and Glitch use independent source-alpha copies in SVG and PNG. Optional `shadowLayers` retain additional copies through history and saved documents; old single-shadow records retain their established rendering. Drop retains the former default shadow values. Invalid additional layers are rejected at document/preview/write boundaries. No Color and None both remove every shadow, including valid layer-only imported records.
- The color picker keeps an editable percentage, with a reserved input area and fixed percent suffix. The whole field receives the focus outline, avoiding nested outlines and overlapping text. Slider synchronization, precise unchanged alpha, invalid-entry restoration and Escape cancellation remain intact.
- Text anchoring was already connected to DOM/PNG layout. The owner's short text box had no spare vertical space, so alignment could not visibly change. The spacing popover now explains how to reveal it. Browser measurements verify top/middle/bottom positions at 4/70/136 design pixels for two 30px lines in a 200px box; a full box safely stays at its top padding. Original text and frame geometry stay unchanged, and inline editing retains the anchor.
- Cover/Contain/Stretch already reached the image renderer/exporter. Natural-ratio uploads and locked-ratio resizing hid their differences. V3 side handles now reshape the frame independently; corners retain proportional resizing. All V3 image handles are centered on their actual edges/corners. Legacy ratio behavior and explicit crops remain unchanged. The Fit menu explains the aspect-ratio requirement and side-handle gesture. Browser tests verify distinct PNG pixels for a 2:1 source in a square frame, saved fit modes and real resize gestures.
- Effect hover/focus and numeric edits use transient previews. Confirmed actions create one history entry; cancellation, leaving the target, closing the panel and entering Preview clear unfinished effects. Unchanged rounded custom-shadow opacity does not overwrite the precise saved value on blur.

## Automated evidence

- Gate 1: `npm run check` passed frontend and API type checks, exit 0. Log: main workspace `.agent-logs/v3-annotations-check-final.log`.
- Gate 1: `npm run test:unit` passed 811 backend + 634 client = **1,445 tests**, with one pre-existing client skip. Log: `.agent-logs/v3-annotations-unit-verified.log`. The root command includes the client unit script.
- Gate 3: **98 passed (6.0m)**, exit 0. Final log: main workspace `.agent-logs/v3-annotations-browser-verified.log`. Command: `node node_modules/@playwright/test/cli.js test --config=e2e/v3-slice.config.ts`. Tests run against isolated Vite5181 with mocked auth/API and independent browser storage.
- Contract-first failures were recorded before correction: missing sidebar callback/panel, overlapping focus treatment, missing side-handle resizing, mispositioned side/corner handles, fractional custom-shadow blur rounding, and No Color with additional/layer-only shadows. See `.agent-logs/v3-annotations-*red.log`, `v3-effects-engine-red.log` and the worker focused-test logs.
- The first focused browser run had six passes and two test-selector failures: text white-space is a class rather than an inline property. The corrected selector measures the actual content rectangle. The next run had eight passes and exposed the genuine handle placement issue. Its unchanged real-drag assertions then passed after side and corner positioning was corrected.
- The first final unit run found a legacy-renderer test using the new preset as its fixture. That test now supplies explicit legacy shadow values and retains its exact CSS assertion; a separate test pins the Drop preset to the prior toolbar defaults. The complete unit suite then passed.
- Existing color tests now enter the Drop sidebar card instead of the removed Shadow button. The shadow-color return path checks Effects first, then closes Effects and checks the original Templates sidebar; the old restoration assertion is retained. The first complete browser run had 97 passes and this one obsolete return-path assumption; the corrected complete run passed all 98 cases.

## Visual and runtime evidence

The approved desktop scope covers 1242×668 light/dark Effects and opacity layouts, 1440px text-anchor/image-Fit flows and the existing shell regression captures. Five inspected final reference images are retained under `evidence/`: `annotations-effects-light.png`, `annotations-effects-dark.png`, `annotations-opacity-dark.png`, `annotation-text-anchor.png` and `annotations-fit-dark.png`.

The owner's frontend5000 and API3001 returned HTTP200 after resuming the session. Automated tests do not mutate the owner's current artwork, use production data or call paid providers. New authenticated database persistence smoke and a production build were not run; mocked save/reload is identified as such.

Gate 4 is not triggered: no backend, schema, authentication or deployment changes. The existing opt-in V3 desktop scope applies; no mobile editor shell was added. Unnamed reference effects, Crop, fill replacement and image recoloring remain outside the story. Formal Done and milestone merge remain pending user authorization.
