# V3 listing refinement — 2026-11-13

## Feedback revision — welcome, Property card and saved search

Refinement v2 restores the first-screen welcome layout and full-width country/source controls, retaining Listing ID, Paste text and Saved properties. The details screen now uses one Property information card with address, description, prominent price, grouped beds/baths/area, optional extra specs, status and feature chips. Clicking anywhere on that card opens the existing edit form.

Saved properties includes a live, case-insensitive address/name/listing-ID search with a clear action, result count and no-match state. Filtering preserves each record's original selection index and does not change saved data or artwork. The query is transient and remains while switching source tabs in the session.

Five pre-feedback refinement files were copied and hash-verified under `../checkpoints/listing-workflow-2026-11-13-before-card-search/`; the earlier full file/browser-data checkpoint remains intact. No new browser-storage format or migration was introduced.

All 13 current refinement behavior/render-contract tests pass. Both local URLs return HTTP 200. Browser automation remains unavailable, so no new screenshot or fresh visual check is claimed. See [the feature and UI/UX gap analysis](GAP-ANALYSIS-4180-vs-5194.md) for the comparison with port 4180, including 33 newly passing older-model binding/extraction/pricing tests and the remaining functional gaps.

Open http://127.0.0.1:5194/editor.html. Reload an already-open editor tab to load the new script and styling. Existing saved pending/applied records are retained; an unsaved form edit should be saved or cancelled before reload.

## Rollback checkpoint

Before UX changes, all 14 original files were copied and SHA-256 verified in `../checkpoints/listing-workflow-2026-11-13-before-refinement/files/`. The three mockup storage keys from the user-facing origin were separately exported to `browser-state.json` and verified by hash/readback. Branch/HEAD and exact instructions are in that checkpoint's `checkpoint.json` and `RESTORE.md`.

Browser export required a temporary local receiver because browser automation stopped working. The purpose-built app browser opener loaded the backup utility, which exported only the three specified mockup keys to the receiver. The receiver was stopped after verification. No production storage was read or changed.

## Current flow

- Find a property: Listing ID / Paste text / Saved properties. Sample lookup first presents a result card. Selecting it opens the listing details without modifying the artwork.
- Details: pinned address/back navigation, two-thumbnail Media preview, compact property cards, paired specifications, Agent and Brand cards, pinned Apply footer. Media has See all; Uploads holds the actual stored-photo/upload actions.
- Agent and Brand cards activate their matching rail destinations. Returning to Listing restores the overview's scroll position.
- Template Fields is closed by default. Selecting artwork selects the element without opening the panel; Link field or the footer button opens it. Friendly field labels replace raw slot IDs. Customize this design is collapsed until needed.
- Template setup configures lifecycle photo rules. Save as Template stores reusable layout metadata, field links and pack rules together. Linked fields do not store the current Listing's values as fixed content. Explicitly unlinked elements can remain static template content.
- Templates + Listings produce separate Designs. Use this template fills a new Design from the pending Listing. A new Design with a missing image shows an Add image placeholder; updating an existing Design with a missing source keeps its prior content and exposes a warning.
- Save as Design creates an independent browser-local snapshot of applied artwork, Listing association and custom values. Unapplied changes are explicitly called out. Saved Designs reopen from Templates & designs; current record updates remain pending until Apply listing updates.
- Design customizations do not alter the Listing or reusable Template. Apply preserves custom values; Use linked value removes a customization. Undo still restores the previous applied snapshot.
- Workflow opens a diagram and source catalogue, including MLS, state RERA, WhatsApp text, saved records and future integrations. Market Report needs reviewed market data, not only property facts.

## Runtime and persistence

P1 essentials were subsequently added after the refinement scripts. See [P1-ESSENTIALS.md](P1-ESSENTIALS.md) for the current runtime, 30 passing checks, export artifacts and browser-verification limitations. The earlier verification section below is historical evidence for the pre-P1 revision.

`editor.html` loads the original `editor.js` / `editor.css`, then `refinement.js` / `refinement.css`. The refinement replaces focused rendering and routing functions while retaining the existing extraction, file processing, image rules and Apply/Undo helpers. Restoring the old HTML stops loading the refinement without deleting the new files.

Storage remains `v3-listing-sidebar-v2`. Saved listings, templates and independent designs are additive fields. Form drafts and source-search results are transient. The original listing workspace at `index.html`, its runtime files and all production files remain untouched. `state-transfer.html` supports mockup-only export/restore.

## Verification and limits

`node --test Mockups/listing-workflow-v1/refinement.test.mjs`: 9/9 behavior checks passed. They cover result selection, pending versus applied data, Apply/Undo and skipped images, one Template with two independent Listings/Designs, explicit missing-image placeholders, customization isolation, template photo rules, Brand/Agent routing, compact rendered controls and browser-local save payloads. Both scripts pass syntax checks. HTML, scripts, styles and an image returned HTTP 200. Original checkpoint file hashes were rechecked; original listing runtime files still match their checkpoint versions.

These are model/render-contract tests in an isolated Node DOM stub, not a new browser end-to-end or pixel check. Browser controls failed with an environment/kernel-assets error before fresh visual verification could run. The prior `editor-preview.jpg` is a previous-revision image, not evidence for this revision. Desktop Fit/scroll/focus behavior and local uploads rely on browser APIs and still need a fresh manual/browser pass. The revised page was opened through the app's browser opener.

Production type/unit/integration gates were not run: this is an isolated static mockup with no production imports, story closure, provider integrations or database changes. Save actions are clearly browser-local; no MLS/RERA or campaign-agent execution is implied.
