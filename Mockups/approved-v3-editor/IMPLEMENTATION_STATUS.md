# Approved design integration

Date: 2026-11-01. Branch: `feat/edit/m-11-v3-editor-slice`.

The runtime foundation remains US-EDIT-031. Integration is tracked under reconciled US-EDIT-024 and US-EDIT-027; neither milestone nor the wider V3 roadmap is declared Done by this report. `/editor?editor=v3` remains opt-in; `/editor` remains the existing editor.

## Added beyond the earlier V3 slice

| Capability | Runtime integration |
|---|---|
| Approved shell | Actual logo, Projects, title-adjacent cloud status, top-bar history/Preview/Save/Export; seven-item rail; no workflow strip or permanent right inspector |
| Appearance | Scoped Navy/Teal surface roles in light/dark, existing system preference, rounded Lucide icons and hover/selected/focus/disabled states; UI theme does not recolor artwork |
| Tools | Select/Hand, direct Line/Shapes/Text/Image entries; four real shape creation actions; universal selected Duplicate/Delete including mixed selections |
| Text | Eight approved style sizes, Text panel content editor with one deliberate blur commit and Escape cancellation; pending draft retained through Preview |
| Canvas | Selection coordinates in design pixels; proximity formatting; footer Layers, settings, actual zoom presets and Fit; viewport Hand scrolling |
| Templates | API-backed search/thumbnails, loading/empty/failure/retry states, replacement confirmation, success-only account-scoped recent template IDs |
| Listing/Brand | Existing Property and Agent forms and linked slots, brand slot controls and palette editor/apply operations in approved panels |
| Assistant | Existing AI Chat component and generation placement operations opened from the approved bottom-right action |
| Autosave | Two-second idle save for server-backed designs; new designs start after first explicit Save; serialized guarded acknowledgements, error retry, timestamp and local recovery controls |
| Recovery | User/design-scoped local draft, explicit Restore/Discard, manual Save required to upload a restored draft, unload/Projects navigation protection |

## Features still to implement

| Feature | Remaining work / owning contract |
|---|---|
| Straight, curved and elbow line drawing | Menu choices are present and explicitly unavailable. The old renderer has no line element contract; insertion, editing, hit testing, history, serialization and PNG rendering need a separate scoped implementation. |
| Image crop workspace | The prior crop feature is archived under `client/src/features/crop/CROP_FEATURE_ARCHIVED.md`; restoration needs its own scoped work. Current image controls support fit, flip, opacity and brightness/contrast/saturation adjustment. No nonfunctional Crop button is presented. |
| Linked-element inspector and Manage links | US-EDIT-020. Existing slot bindings are reused; the new management/rebinding workflow is not delivered by shell composition. |
| Export review and stale-image guard | US-EDIT-021. Current export remains the verified PNG path; review checks and out-of-date generated-image decisions are separate. |
| New Look/accent/photo design workflow | Remaining US-EDIT-022. Text styles moved to Text; the same-format Look picker and recent property-photo workflow remain. |
| Assistant task redesign | US-EDIT-023. Existing Chat is wired; the proposed Create design / Generate Background task choice and side-by-side Use/Keep current flow are separate. |
| Paste-first Property and reusable contact/brand profile | Remaining US-EDIT-025 and its dependencies. Existing forms are wired; autofill review, new CTA/registration bindings and cross-design Brand profile behavior need their own implementation. The approved rail label remains Agent. |
| Edit Elements extraction review | US-EDIT-026. Real extraction spike, confidence/role review, Locate, explicit link assignments and confirm/cancel conversion remain separate. |
| Full route-transition protection | Unload and Projects/logo exits are guarded; browser Back/Forward and every application route transition still require a central router guard. |

Phone layout, SVG export, offline mode, collaboration and a whole-site marketing theme migration are outside this approved integration. Production default-route rollout is a separate decision.

## Verification and delivery

Latest type checks (frontend and API), production build and full unit suites pass: 811 backend + 426 client = 1,237 tests, with one existing client skip. No backend/schema files changed. The build retains existing large-chunk/Browserslist/PostCSS notices.

Fresh authenticated browser/API/database smoke passed: real login, design GET, blur text edit, Undo/Redo, PUT with the same canonical ID, independent GET and database assertion, full reload, valid 1600×1200 PNG export, both theme screenshots and zero uncaught browser errors. The disposable account, organization and design were cleaned up. This is independent of route-mocked browser evidence. Paid AI-provider generation was not invoked.

The initial live attempt ran before the API finished starting and failed its health connection. After health returned 200, the complete smoke passed. No failed attempt is represented as a success.

Browser integration passes: 35 retained/new cases in the complete scoped runner plus the additional listing-field/Layers/Assistant journey (36 cases total). Final selected-element Tools captures also pass at 1191×668 in both themes; 1280px/1440px keyboard, contrast (≥4.5:1) and geometry checks pass. [Light capture](evidence/approved-light.png), [dark capture](evidence/approved-dark.png), [sanitized live smoke proof](evidence/live-smoke.json). Independent review, milestone PR and main merge remain pending. This does not declare the broader roadmap or either milestone Done.

Logs live in the workspace's ignored `.agent-logs/v3-approved-runtime-{check,unit,build,browser}.log` and `.agent-logs/v3-approved-live-smoke.log`. Browser captures and sanitized live proof are under the worktree's `.e2e-artifacts/us-edit-031/` and `.e2e-artifacts/v3-approved-live/`.
