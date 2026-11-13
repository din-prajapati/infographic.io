# Listing mockup → actual V3 integration contract

Date: 2026-11-13. User approved the proposed implementation through persistence/export review and explicitly stopped scope before AI Assistant. This document reconciles existing story IDs; it does not claim implementation or verification.

## Approved reference and boundaries

Visual/behavior sources: [refined listing sidebar](../../Mockups/listing-workflow-v1/REFINEMENT.md), [P1 essentials](../../Mockups/listing-workflow-v1/P1-ESSENTIALS.md), existing opt-in V3 renderer, tools and acknowledged design-session persistence. The mockup is workflow/interaction evidence, not production persistence code. Production does not import mockup browser-local storage or fabricate provider success.

Include Listing, Property, Agent, Brand, manual gallery/upload, Template Fields, reviewed pasted text, structured pricing, reusable templates, separate Designs and actual PNG export review. Exclude photo ranking, photo roles, pack/lifecycle selection rules, AI Assistant, MLS/RERA/other live connectors, AI generation changes, default editor route changes, automatic reflow and a general autosave redesign. Manual source input works in India, US, UK and Canada using country/currency/area-unit/intent/rental-period data from the start.

## Integration matrix and delivery sequence

| Order | Mockup capability | Actual V3 destination / contract | Existing story | Acceptance checkpoint |
|---|---|---|---|---|
| 1 | Property facts, structured sale/rent, currency and units; reviewed paste | `shared/listingWorkflow.ts` pure typed record, formatter, validation and source-candidate review | US-PROP-002 | Invalid/ambiguous facts never overwrite a record; mixed-property input blocked; selected facts carry evidence and stale review is rejected |
| 2 | Saved properties and persistent Agent/Brand identity | Nest `/api/v1/properties`, `/api/v1/listing-profiles`, Prisma Property JSON+version and user-unique ListingProfile; `listingApi.ts` | US-PROP-001 | JWT-derived org/user ownership; 401/404 isolation; expectedVersion 409; acknowledged data survives sessions |
| 3 | Pending versus applied, Apply and Undo, local design overrides | `v3ListingWorkflow.ts`, `useV3ListingWorkflow.ts`, canvas document/session and binding integration | US-PROP-004 | Source edits stay pending; atomic Apply updates eligible links only; geometry/styles/crops/customizations retained; exact last applied snapshot can be restored |
| 4 | Welcome, full country/source controls, saved search, pinned address and Property card, Media, Agent and Brand | New `V3ListingPanel.tsx` within existing V3 rail/panel shell | US-EDIT-025 | Search counts/no-result/retry work; overview navigation returns to prior scroll; reviewed paste does not auto-adopt agent identity; manual photo choice has no rank/roles |
| 5 | Template Fields closed by default; friendly mappings; structured specs; Customize this design | New `V3TemplateFields.tsx`; selection alone does not open it | US-EDIT-020 | Mapping types enforced; detach keeps current content; reconnect/Use linked value explicitly removes override without a source write |
| 6 | Save as Template / Use this template / Save as Design / reopen | `v3TemplateWorkflow.ts`, `V3Editor.tsx`, `V3Panels.tsx`; existing authenticated save/session machinery | US-EDIT-022 | Template strips listing-specific linked values; two Designs from one Template retain separate source snapshots, photos and overrides |
| 7 | Review & export | `v3ExportReview.ts`, `V3ExportReview.tsx`, existing actual V3 PNG renderer | US-EDIT-021 | Missing/invalid/stale/placeholder/overflow findings block unsafe download; explicit review required; async stale render rejected; real PNG dimensions match canvas |

Dependencies define implementation order; layers can be prepared independently only after their shared contract is fixed. Root owns V3Editor/V3Panels integration to avoid overlapping shell edits. Each TASKS.md contains the exact source/test/document allowlist. Story files are M-sized contract slices; larger follow-up product expansion is deferred, not silently added.

## Source, artwork and saved-state rules

1. **Pending record** is the editable canonical source draft for the current workspace. Source Save acknowledges backend property/profile persistence; it does not implicitly apply artwork.
2. **Applied snapshot** records source facts last intentionally applied to this artwork. Apply is one atomic operation; invalid data cannot partially update the canvas.
3. **Design customizations** belong to element IDs in the current Design and survive ordinary Apply. Direct editing linked text uses an explicit customization path. Unlinked/static content remains independent.
4. **Manual media** is selected/uploaded through existing image handling. Manual replacements remain protected from Apply. New templates/Designs never inherit previous-property photos as approved imagery. Existing Designs with missing update sources retain prior content with a visible review finding. Preserve crop when replacing source through Apply; intentional image-editor crop remains available.
5. **Reusable Template** stores appearance, geometry, links, crop and explicit static content, stripping the active Listing facts, association and linked photo contents. No ranking/roles/pack metadata is introduced.
6. **Independent Design** stores applied artwork, property association, pending/applied facts and custom values using the existing real backend. Saving with pending facts visibly discloses unapplied changes. Reopening does not derive source truth from arbitrary canvas/custom text.
7. **Reviewed paste** is local, limited extraction. It exposes candidate snippets, ambiguous alternatives, mixed-property blocking, selected fields and stale-baseline findings. Unknown values stay empty. No claim of AI extraction, official verification or provider lookup is made.
8. **Personal profile** is user-scoped; shared properties are organization-scoped. Client-provided owner IDs cannot authorize access. expectedVersion prevents stale property overwrites; missing profile begins at version 0.

## Existing-story reconciliation

| Historical draft | Current owner | Remaining deferred scope |
|---|---|---|
| US-PROP-003 message auto-fill | US-PROP-002 reviewed parser + US-EDIT-025 review UI | Remote extractor/generation integration |
| US-PROP-006 saved-property client | US-PROP-001 API client + US-EDIT-025 selection/forms + US-PROP-004 / US-EDIT-022 snapshots | Broader legacy editor rollout |
| US-PROP-007 editor intent/price | US-PROP-002 transitions + US-EDIT-025 forms + US-PROP-004 bindings / US-EDIT-020 inspector | AI generation pipeline pricing changes |
| US-AI-028 broader profile story | Only bounded personal ListingProfile persistence in US-PROP-001 | Onboarding, broader account/profile product work |
| US-PROP-005 proven template/version | Existing template endpoints reused in US-EDIT-022 | Proven-template curation/version expansion |
| US-EDIT-027 autosave | Existing foundation reused; additive snapshot integration under US-PROP-004 | Broader status/merge closeout; no autosave redesign |
| US-EDIT-022 historical Design-tab Look refactor | Reconciled reusable Template/Design actions | Proven-look rollout/new formats |

These drafts are not marked Done. Reconciliation pointers prevent duplicate implementation; future stories must retain their deferred scope explicitly.

## Verification and stop-before-Assistant checkpoint

Contract-first automated checks precede source edits and assert values at precise state/API locations. Gate 1 is `npm run check` plus `npm run test:unit`. Gate 2 checks actual V3 light/dark, 375px/1440px, keyboard/focus/scroll and console output. API smoke proves authenticated Property/profile persistence, cross-org isolation, stale-write rejection and route-scoped large manual-media payload handling. The final browser journey lives in `e2e/v3-listing-workflow.spec.ts`.

The integration is accepted only when all of these observable conditions have evidence:

- [ ] A manual structured listing and reviewed pasted listing can be saved and selected from the real property catalogue; failures retain drafts and enable retry.
- [ ] Property/Agent/Brand edits remain pending until Apply and show clear saved versus applied status.
- [ ] Apply updates all eligible links atomically while retaining frame geometry, styles, image crop, independent/static text and design customizations; Undo restores the prior applied artwork.
- [ ] One reusable Template creates Design A from Listing A and Design B from Listing B. Reopening both through real backend persistence preserves distinct facts, chosen photos, mappings and local overrides.
- [ ] Editing one Design/property does not silently mutate another saved Design or the Template; newly fetched/saved source facts enter pending/review flow.
- [ ] Missing photos in a new Design display Add image; old property photos do not silently pass review for a different Listing.
- [ ] Review blocks missing price/required photo, placeholder, invalid/mismatched pricing, stale links, unapplied changes and measured overflow; explicit independent/custom values are recognized.
- [ ] Actual browser PNG download contains the reviewed V3 artwork at design dimensions without selection UI, and an async state change cancels stale export.
- [ ] All selected story ACs/tests and applicable gates are recorded; no default route, AI Assistant or live connector behavior changes.

Passing this checkpoint prepares a later AI Assistant to propose edits through these same source/review/apply contracts. It does not authorize starting that stage in this delivery. No stories are closed or merged by this planning document.
