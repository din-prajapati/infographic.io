# V3 listing integration — local delivery

Date: 2026-11-13. Branch: `codex/v3-arrange-opus`.
Scope: approved listing mockup integrated through Design persistence and reviewed PNG export. AI Assistant, country-specific providers, photo ranking/roles/packs, deployment and default editor routing remain outside this delivery.

## Implemented

- Listing intake with country selection, manual entry, reviewed local pasted text and authenticated saved-property search. Unsupported live lookup is clearly unavailable. Country/currency/area/intent/period support covers IN, US, GB and CA.
- Property summary and Save/Cancel editing, Agent/Brand profile destinations, explicit profile adoption, manual gallery upload/removal and per-frame photo selection. Existing canvas palettes remain available inside Brand.
- Separate pending and applied Listing records and mappings, atomic Apply, skipped-image warnings and Undo last apply. Geometry, crop, typography and independent/customized artwork are preserved. Undo last apply refuses to discard later unrelated artwork or mapping changes.
- Template Fields with compatible text/image links, component specification editing, detach/reconnect and explicit per-Design customization. Source edits remain pending; Use linked value restores the applied source. Old photo customizations require review when switching Listing association.
- Reusable Template saving removes linked Listing facts/photos. Selecting a template creates a new acknowledged backend Design instead of mutating its source. Saved Designs retain independently reopenable pending/applied facts, mappings and customizations.
- Listing-aware PNG export requires human review and checks missing/invalid/pending/stale/placeholder/overflow/image conditions. Export uses the existing V3 renderer at the document dimensions and rejects asynchronous document changes. Plain unlinked non-listing canvases retain the existing generic export path.

## Main source groups

| Responsibility | Files |
|---|---|
| Canonical listing, decimal pricing and reviewed import | `shared/listingWorkflow.ts` |
| Authenticated Property/profile persistence | `api/src/modules/properties/`, `api/prisma/schema.prisma`, additive migrations, `client/src/lib/listingApi.ts` |
| State and existing session integration | `client/src/lib/v3ListingWorkflow.ts`, `client/src/hooks/useV3ListingWorkflow.ts`, canvas serialization, bindings and V3 session modules |
| Listing and field UI | `V3ListingPanel.tsx`, `V3TemplateFields.tsx` and styles under `client/src/components/editor/v3/` |
| Template/design/export integration | `v3TemplateWorkflow.ts`, `v3ExportReview.ts`, `V3ExportReview.tsx`, `V3Editor.tsx`, `V3Panels.tsx` |
| Empty photo frames | `client/src/components/canvas/ImageElement.tsx` |

## Database compatibility

The configured database already contained the historical Property migrations omitted from this worktree. Restored both historical SQL files byte-for-byte from their original Git commits; retained the old scalar Property columns and Infographic association. The new migration adds nullable canonical record JSON, name/version fields and a personal ListingProfile table. It does not drop or rewrite existing Property records.

`prisma migrate deploy` successfully applied `20261113000000_listing_workspace`. Old rows without canonical JSON are normalized on read; the original scalar data remains unchanged. Property access is organization-scoped, profiles user-scoped, and expectedVersion updates reject stale writes with 409. The scoped large-image parser retains normal JSON parsing for unrelated routes, including login.

## Actual verification evidence

- Baseline frontend/API type checks and original unit suites passed before source changes.
- Integrated frontend/API type checks passed.
- Full backend suite: **840 passed**. Full frontend suite: **795 passed, one existing skip**. Tests were run with two workers after an unrestricted run lost a worker; assertions and coverage were not weakened.
- Focused final checks cover the subsequent small source/search/layout and acknowledgement changes; see local logs for exact results.
- Production build passed; existing Browserslist/PostCSS/bundle-size warnings remain.
- New browser suite: **5 passed** using real V3 components and mocked HTTP/auth. It covers source save versus Apply, multi-instance updates, Undo, save/reopen, UI template-to-new-Design creation, template fact stripping, reviewed native PNG download and mobile light/dark controls.
- Separate real JWT/API/Prisma/browser audit: **PASS**, without HTTP mocks or canvas-store writes. Verified property/profile persistence, cross-organization 404, unauthenticated 401, stale-write 409, personal-profile isolation, exact database/API document equality, fresh-context Design reopen, distinct Listing A/B snapshots, unchanged reusable template, manual photo crop and protected headline customization.
- Exact before/reopen comparison: **0 differing pixels** for both editor artboards and both downloaded PNGs, each 800×600. All four comparisons used the same browser/fonts; this is not a cross-device rasterization guarantee.
- Disposable verification organizations, users and their owned records were cleaned after every live audit. Existing user records were not intentionally modified.

Logs: `.agent-logs/listing-complete-{check,api-units,client-units}.log`, `listing-final-focused.log`, `listing-ready-check.log`, `listing-ready-build.log`, `listing-browser-verified.log`, `listing-live-audit-final.log`.

Real audit: `.e2e-artifacts/v3-listing-persistence-live-2026-11-13/result.json` and before/reopened screenshots/downloads. Reproduce with `node --env-file=../../.env scripts/v3-listing-persistence-smoke.mjs` while the local servers are running. Browser suite: `npx playwright test --config=e2e/v3-listing.config.ts`.

## Boundaries and remaining release work

- The full historical 133-case V3 browser suite was not rerun for this delivery; new targeted journeys and complete unit suites were run. Broad visual/accessibility regression and whole-candidate review remain pre-merge work.
- Pasted-text extraction is a bounded local parser with evidence, ambiguity and stale-review checks. It is not a production AI extraction-quality claim.
- Property photos are chosen manually, with bounded raster uploads. No automatic ranking, role selection or photo substitution was introduced.
- No AI Assistant integration, MLS/RERA/UK/Canadian live data connector, deployment, push, main merge or default editor change occurred. Formal story Done/merge status is not claimed.
- Automatic approval rejected manual ORION replay-summary writing as unsupported execution evidence; no replay summaries were written through that rejected action. Actual CLI hardening locks, audits and test output remain the evidence.

Recovery baseline: local branch `codex/v3-before-listing-2026-11-13`; mockup archive `Mockups/checkpoints/v3-before-listing-integration-2026-11-13/listing-mockup.zip` (SHA-256 `495067780815DD59F7AF61464ED5FFECFCF13B502F5CDC5CFFEEA0E005468291`). Existing untracked prototypes/checkpoints were preserved.

Committed sanitized live result: [live-result.json](evidence/v3-listing-2026-11-13/live-result.json). Final affected unit rerun: 43 passed; final browser rerun: 5 passed. Final typecheck and production build passed.
