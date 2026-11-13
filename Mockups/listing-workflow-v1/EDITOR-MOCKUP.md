# V3 listing sidebar — local UX reference

Latest revision: see [REFINEMENT.md](REFINEMENT.md) for the 2026-11-13 compact layout, Save as Template / Save as Design flow, rollback checkpoint and current verification limits. The historical contracts and browser results below describe the preceding revision.

Open http://127.0.0.1:5194/editor.html while the existing mockup server is running. Entry: editor.html → editor.css + editor.js; imagery is in assets/. The separate listing-workspace prototype remains at index.html.

## Interaction contract

1. Source selection: country + fictional listing feed + ID, or paste listing text. SAMPLE-101 has photos; SAMPLE-102 has none; other IDs produce No match. The not-connected source demonstrates unavailable-provider recovery. No live MLS/RERA lookup occurs.
2. Raw text uses a deliberately bounded local parser for BHK/beds, baths, INR price units, area and explicitly labelled address/headline/description/features. Supported facts are reviewed with current values and individual checkboxes. Existing values start unchecked. Missing facts stay visible. Agent/contact text and sold mentions are suggestions only.
3. Listing overview orders Photos, Property information, Agent information and Brand assets. Each record card opens a sidebar edit form; Back/Cancel discard its unsaved draft. Save updates the pending listing only. Agent and brand forms can select a browser-local saved demo record.
4. Photo editing supports the labelled sample library and local JPEG/PNG/WebP uploads (10 MB per file, maximum eight photos), resizing to 1000 px maximum dimension. Assign Hero/Exterior/Interior/Area roles, move photos up and remove them. Save commits the photo draft; Cancel discards it. A photo rule chooses the first matching role, with ranked photo #1 fallback. No photos means a skipped image update, not invented imagery.
5. Apply to design updates linked content and brand accent together, preserving unrelated artwork and appearance. The footer counts pending element changes and exposes skipped missing/unlinked values. Skipped elements retain their prior artwork. Undo last apply restores the previous applied snapshot and overrides while keeping the pending record.
6. Canvas elements expose compatible canonical text/image slots in the link inspector. Pending mapping changes also wait for Apply. A design-only override is an explicit separate action; it persists across Apply/reload until returned to the linked source.
7. Reusable template links and the lifecycle pack store future defaults only. Saving them does not replace current artwork or pending mappings. There is no new-template instantiation service in this concept. Market Report is configuration only and requires a reviewed market source and reporting period.
8. Human review shows the applied artwork, with a warning when unapplied changes exist. Approval is local; it does not publish, export or schedule.

## State and preservation

Storage key: v3-listing-sidebar-v2. This is independent of the previous editor concept key and listing-workspace key. Pending listing, applied snapshot, local saved agents/brands, mappings, template defaults, overrides and one-step apply history persist. Unsaved form drafts and in-progress extraction review do not persist. Storage failure reports that the save failed instead of claiming success.

The standalone prototype remains in codex/v3-arrange-opus. No production source, backend/database records or original listing-workspace page changed. Existing Tools/Text/Elements/Uploads panels are labelled placeholders. Agent portraits are sample assets; brand wordmarks are generated SVGs, not a production logo upload service. Artwork is HTML with fixed sample crop/layout styles; there is no free-form canvas renderer, production undo integration or arbitrary-text fit guarantee.

## Browser verification — 2026-11-12

Checks used an isolated localhost origin; the user-facing 127.0.0.1 tab was retained without resetting its data.

- Unknown ID: No matching sample listing; unavailable provider: not-connected message.
- SAMPLE-102 loaded ₹92 Lakh pending while canvas retained ₹1.25 Cr. Apply updated price and kept the existing hero with a missing-photo warning; Undo restored ₹1.25 Cr.
- Property edit Cancel retained ₹92 Lakh; Save staged ₹88 Lakh without changing canvas.
- Stored living-room photo, Hero role and Save remained pending until Apply; artwork then used modern-interior.jpg.
- Saved agent selection staged Vikram Patel while artwork retained Arjun Shah. Brand selection retained teal until Apply, which updated agent and navy accent together.
- Text override SPECIAL PRICE survived Apply and reload. Return to linked source followed by Apply restored the pending price.
- Text import detected 3 bedrooms, ₹80 Lakh and Test Avenue address. Existing facts started unchecked; accepting only price/address kept the prior two bedrooms and saved agent. Artwork stayed unchanged until Apply.
- A locally chosen image uploaded, was ranked first/assigned Hero, then saved/applied; resized JPEG loaded successfully and survived reload. Removal and validation branches are implemented; invalid-file and oversized-file paths were not exercised through the picker.
- Unlinked price retained existing artwork. Template-pack save retained the current hero. Design-only kitchen image survived Apply and returned to the applied linked hero when cleared.
- Native image-library Escape closed the dialog and returned focus to its opener. Keyboard Enter selected a canvas element. Sidebar scrolling exposed Agent/Brand cards while the Apply footer stayed pinned.
- At 1242 × 668 all artwork rows fit within the 464px artboard and all three applied images loaded. No browser console errors observed. JavaScript syntax check and HTTP 200 passed.

Preview: editor-preview.jpg. Production unit/integration gates were not run: this is a buildless, isolated artifact with no production imports or story closure. Mobile layout, arbitrary text lengths, real provider integration and production database behavior are not certified by these checks.
