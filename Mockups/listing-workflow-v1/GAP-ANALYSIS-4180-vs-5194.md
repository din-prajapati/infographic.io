# Gap analysis — listing sidebar and earlier linked-editing prototype

**Update after this comparison:** P1 ranks 1–4 have now been brought into the newer mockup: checked export, structured pricing, stronger extraction review and linked text/component editing. See [P1 implementation and verification](P1-ESSENTIALS.md). The comparison below describes the pre-P1 baseline; remaining generation, flat-poster extraction and advanced appearance gaps still apply.

Date: 2026-11-13. Versions: port 5194 `editor.html` with refinement v2, versus port 4180 `?design=v3-generated-sample` in the primary checkout.

**Verdict: partially aligned. The newer mockup is the stronger listing-management and template-reuse concept; the earlier mockup is substantially more complete for editing and exporting an actual marketing asset. The new sidebar is not a functional replacement for the old prototype.**

## Evidence and limits

Both URLs returned HTTP 200. Reviewed the actual entry points, rendering/binding/pricing/extraction code and workflow documents. Newly ran 13 tests for the newer mockup and 33 focused binding/extraction/pricing tests for the earlier prototype: all passed. The older verification document's historical 64-test result is not a fresh 64-test claim here.

Browser automation remains unavailable due to its kernel-assets environment failure. UI/UX comparisons use the user's supplied screenshots and the inspected markup/styles, not a fresh side-by-side interactive visual audit. The new welcome/card/search rendering contracts are tested in the existing Node DOM stub; actual focus, scrolling and appearance need a fresh browser pass. No PUT or generation request was made to the old running server; its user designs were not changed.

## Fully agreed

- Property facts and agent identity should be reviewed rather than guessed from a generated image or seller message.
- Template reuse must preserve layout while substituting the selected listing's content.
- A design-specific customization must not silently overwrite the property or agent record.
- Users need explicit control over adopting generated/imported content, recovery and save/reopen.
- Both remain local prototypes. Neither proves production MLS/RERA access or arbitrary-image extraction.

## Feature comparison

| Capability | Earlier prototype — 4180 | New listing sidebar — 5194 | Gap / decision |
|---|---|---|---|
| Listing intake and selection | Text intake with update-current versus new-blank-listing choice; Projects are primarily design-centric. | Listing-ID sample results, reviewed text, saved-property catalogue and address/name/ID search. | Newer concept better separates a Property from its marketing Designs. ID lookup remains fictional. |
| Extraction quality | Handles ambiguous prices, multiple-property/configuration detection, currency/units, source snippets and stale-review protection. | Bounded regex parser detects selected simple patterns; largely accepts the first match and requires explicitly labelled addresses. | Significant regression if the new parser becomes the production reference. Retain the older review safeguards in the new intake UI. |
| Price and rental intent | Numeric amount, currency, sale/rent intent and rental period; validated parsing and coordinated changes. | Display-price string and lifecycle/status labels. A rent layout is not a structured rental-price model. | Earlier model is materially stronger. Do not equate Just Rented template selection with correct rent semantics. |
| Linked canvas editing | Editable element graph; linked text edits can update canonical facts; compound specs use component fields; detach/reconnect supported. | Select existing sample elements, choose compatible field links, or set a custom design value. Property edits are staged until Apply. | New mapping/customization is useful, but not full canvas editing. Staged Apply is an intentional new policy, not a defect to remove. |
| Flat poster to editable elements | Edit Elements → Locate/review detected text → Confirm links & edit, using saved sample geometry and clean background. | No raster extraction/mapping-review workflow. | Earlier interaction must be brought forward separately; neither implementation supplies arbitrary-poster OCR/reconstruction. |
| Design/background generation | Create design and Generate Background, previews, compare/use/keep-current and stale-result rejection; local sample PNG composition. | Listing Agent/Campaign Agent are workflow-diagram concepts; template filling is deterministic HTML. | Newer mockup does not implement the earlier assistant workflow or real agent execution. |
| Design controls | Look, accent/ink/font/format settings, editable text, positions/visibility, independent elements, zoom and Undo/Redo. | Fixed sample artboard; Fit, field selection, custom values and one-step Undo apply. Several rail panels are labelled placeholders. | Save as Template stores rules and fixed layout metadata; it does not establish full template authoring. |
| Property media | Background/photo upload plus contact portrait/logo inputs; no equivalent ranked multi-photo property catalogue established. | Multi-photo property library/uploads, roles, ranking, fallback and separate design-only image overrides. | Newer concept is stronger for property-to-template photo selection. The library is sample data, not a production asset DB. |
| Agent and Brand records | Contact fields, portrait/logo and CTA primarily held with the design. | Separate browser-local saved Agent and Brand selections; overview cards route to matching rail sections. | Newer concept better represents shared records; organization-wide persistence and record ownership remain absent. |
| Template and Design saving | Reusable presentation-only templates; design collection and bindings saved through a local JSON server. | Templates retain field links/rules; separate Design snapshots retain applied content, listing association and custom values in browser storage. | New relationship model is clearer, but localStorage is not backend persistence or cross-device storage. |
| Export and stale-output protection | Review/validation and PNG/SVG export use the SVG renderer; stale baked-in facts block export. | Local review approval and save actions; no PNG/SVG export path. Missing source values can preserve old artwork with a skipped-update warning. | Largest gap for completing the customer's job. A local approval is not a validated, downloadable campaign asset. |

## UI/UX comparison

| Dimension | Earlier prototype | Newer mockup and this revision |
|---|---|---|
| First-run orientation | Numbered journey: look → details → visual → review/export. | Restored Start with the facts / Your listing, ready to design introduction with Listing ID, Paste text and Saved properties tabs. Clearer entry for a listing-first user. |
| Listing summary | Form-oriented Property/Contact settings in the right inspector. | One clickable Property card now groups address, description, prominent price, specs, status and feature chips; Agent and Brand remain separate cards. Less fragmentation. |
| Saved-property discovery | Projects emphasize saved designs rather than a searchable property catalogue. | Search by address, name or listing ID, live counts, no-match state and stable result selection. Large result thumbnails may still become cumbersome with a large catalogue; list/grid choices are future work. |
| Workspace use | Journey strip and generally occupied inspector consume space but keep task actions visible. | Source/details panel on the left; Template Fields on demand; fit uses available canvas space. Better listing overview, although portrait artwork naturally leaves horizontal space. |
| Editing discoverability | Selection inspector explains actual text editing, structured facts and detach/reconnect. | Friendly Link field and Customize this design terminology. More understandable for configuration, but the rail currently suggests capabilities that are only placeholders. |
| Media and record navigation | Photo/settings actions are spread across contact/design/assistant contexts. | Media thumbnail strip → See all; Uploads is the single photo-entry destination. Agent/Brand cards open their rail sections. |
| Feedback and trust | Generated/flat/editable modes and stale-output states are explicit. | Pending count, Apply/Undo and custom-value markers exist. The pending Listing can differ dramatically from the currently applied artwork, as the user's INR-versus-USD screenshot demonstrates. Add a clear canvas source/applied-listing indicator before release. |
| Visual density | More complete controls, but a busier task and settings surface. | Compact grouped card avoids separate address/price/spec tiles. Welcome copy is intentionally restored at the user's request; it belongs to intake rather than the details screen. |

## Critical divergences, ranked

1. **Completion and correctness:** 5194 cannot yet deliver a checked export. A preserved old price/photo after a skipped update must not be mistaken for the current Listing merely because the design is approved locally. The earlier export-validation concept is the stronger reference.
2. **Fact interpretation:** the new simple parser and string price model should not replace the earlier ambiguity, currency, rent-period and source-review logic. This is a genuine capability gap, not styling work.
3. **Editing depth:** the new mockup explains template links but cannot actually author arbitrary layouts or perform the older image-to-editable workflow. Integrate those contracts with the real V3 editing tools rather than implementing another renderer from scratch.
4. **Update policy:** immediate bidirectional updates in 4180 and staged Apply in 5194 are different product decisions. Keep the newly selected staged flow. If adding canvas-side source editing, distinguish Edit listing field from Customize this design and apply source changes deliberately.

## Still missing in both

- Authorized live listing-source integrations with country/provider-specific capabilities and photo availability.
- Production Property/Agent/Brand/Template/Design persistence, access controls and conflict handling across users/devices.
- Real AI-provider generation, arbitrary-image extraction and text-free reconstruction.
- Campaign orchestration, batch format quality checks, delivery/scheduling and asset-level revision status. A diagram or lifecycle label is not an agent implementation.
- Reviewed market datasets and periods for Market Report assets.
- Fresh accessibility, responsive, overflow and browser end-to-end verification across the complete combined workflow.

## Risk register

| Gap | Impact | Likelihood if treated as production-ready | Priority |
|---|---|---|---|
| Outdated or missing content approved without export validation | High | High | P1 |
| Ambiguous price or rental terms reduced to a simple string | High | High | P1 |
| Fixed sample layout mistaken for complete template authoring | High | High | P1 |
| Browser-only records mistaken for shared persisted records | High | High | P1 |
| Pending Listing and applied canvas source unclear | High | High | P1 |
| Large saved-property catalogue / keyboard / small-screen behavior not verified | Medium | Medium | P2 |

## Recommended next actions

1. Keep the new listing overview and source navigation; make the applied Listing and pending update state explicit on the canvas.
2. Reconcile the older structured pricing and extraction-review contracts with the new staged intake, preserving user-selected facts and agent identity.
3. Specify export review and stale-output protection for both editable and flat artwork before treating local Approve as a meaningful readiness signal.
4. Connect Template Fields and Save as Template/Design to the actual V3 editor's element model, appearance controls and existing production persistence. Do not duplicate the old prototype wholesale.
5. Bring forward the assistant and extraction-review interactions as separately scoped work, with real provider feasibility gates.
6. Validate one end-to-end customer task: import a real listing → select approved template → review facts/photos → produce two formats → edit once → save/reopen → download correct assets.

## Source references

- Earlier workflow and simulation boundaries: [README](D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/Mockups/buildographic-canvas-simplification-v3/README.md) and [interaction contract](D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/Mockups/buildographic-canvas-simplification-v3/USE-CASE-WORKFLOW.md).
- Earlier runtime: [studio.mjs](D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/Mockups/buildographic-canvas-simplification-v3/studio.mjs), [bindings.mjs](D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/Mockups/buildographic-canvas-simplification-v3/bindings.mjs), [pricing.mjs](D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/Mockups/buildographic-canvas-simplification-v3/pricing.mjs), [extraction.mjs](D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/Mockups/buildographic-canvas-simplification-v3/extraction.mjs) and [renderer.mjs](D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/Mockups/buildographic-canvas-simplification-v3/renderer.mjs).
- Newer runtime and limits: [REFINEMENT.md](D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/.codex-worktrees/v3-slice/Mockups/listing-workflow-v1/REFINEMENT.md), [refinement.js](D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/.codex-worktrees/v3-slice/Mockups/listing-workflow-v1/refinement.js) and [editor.js](D:/Dinesh/DCloud/GITDrive/Work/Products/InfographicEditor-Unified/.codex-worktrees/v3-slice/Mockups/listing-workflow-v1/editor.js).
