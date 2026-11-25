# Story Card — US-EDIT-024

> **Status:** 🟡 In Progress — approved contract reconciled 2026-10-31; implementation, verification and merge pending.
> **Feature:** V3 editor shell (no separate feature ID assigned)
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-09-v3-shell](../../milestones/M-EDIT-09-v3-shell.md)
> **Linear:** Unassigned
> **Size:** L — retained existing story; execute the bounded shell, canvas-adapter and content-panel task increments separately and review each. No renderer or new AI workflow expansion.
> **Depends on:** US-EDIT-031 runtime foundation; US-EDIT-027 owns autosave and session changes.
> **Created:** 2026-10-29 | **Closed:** —
> **Approval:** [Approved visual contract](../../../../../../../Mockups/approved-v3-editor/README.md) and [integration plan](../../../../../../../Mockups/approved-v3-editor/INTEGRATION_PLAN.md).

---

## Story

*As a* solo real estate agent editing an existing design on desktop
*I want* the approved Navy and Teal editor shell around the existing canvas operations
*So that* I can find familiar tools and listing information in the approved positions without losing saved work.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When an authenticated agent opens `/editor?editor=v3`, the top bar shows the actual product logo, Projects, an editable content-sized title with adjacent cloud status, Undo, Redo, Preview, Save and Export in the approved order. Projects opens `/my-designs`; ordinary `/editor` continues to open the legacy editor. The mock appearance-review bar is not mounted in the product.
- [x] **AC2 [happy-path]:** When the workspace is ready, its rail lists Templates, Tools, Text, Uploads, Brand, Property and Agent in that order. Selecting a rail item opens its own panel; Assistant opens above the bottom-right zoom area. Layers opens from the footer immediately before Canvas settings. No workflow guide bar or permanent right-hand inspector is introduced.
- [x] **AC3 [happy-path]:** When Tools opens, its floating vertical strip exposes Select, Hand, Line, Shapes, Text and Image. Top-bar Undo/Redo stay reachable. Shapes opens a vertical Square/Rectangle, Circle, Triangle and Star menu using the overlapping circle/square symbol. Each supported creation action adds the corresponding real store element. Image invokes the real image-selection/upload path; Hand moves the viewport without modifying document geometry. The strip has no +, Undo or Redo entry.
- [x] **AC4 [error-path]:** When Line opens, Straight line, Curved line and Elbow line are visible as unavailable choices with an explicit explanation that drawing support is pending. Clicking an unavailable choice never creates a substitute shape or reports successful insertion. These renderer additions require a separate contract.
- [x] **AC5 [happy-path]:** Given any nonempty selection containing text, image or any supported shape, including multiple selected IDs, the strip displays Duplicate and Delete. Duplicate operates on all selected IDs using existing duplication semantics; Delete operates on all selected IDs respecting existing lock rules. Given empty selection, both actions disappear. Formatting availability does not gate these universal selection actions.
- [x] **AC6 [happy-path]:** When one text element is selected, type-specific formatting appears near that element and Text exposes content editing plus eight styles: Headline Large 48px, Headline Medium 36px, Title 24px, Subtitle 18px, Body Large 16px, Body 14px, Caption 12px and Price Tag 28px. When the content textarea loses focus, a changed draft commits once into the existing history; Undo restores the entire previous content. Escape restores the uncommitted draft. Reopening a panel or entering/exiting Preview does not discard a changed draft. Locked elements cannot be edited. Image/shape selection uses its existing supported formatting operations in the proximity toolbar.
- [x] **AC7 [happy-path]:** Given a single selected element at x=80, y=120, width=200 and height=40 design pixels, the bottom-left geometry readout reports `200 × 40 px · x 80, y 120` at 50%, 100% and 200% zoom. With empty selection it is hidden; with multiple selected elements it reports the selection count instead of presenting one element's geometry. Footer zoom presets 50%, 100%, 200%, plus/minus and Fit change actual canvas zoom; Fit uses available viewport space. Canvas settings edits the existing document dimensions/background through existing operations.
- [x] **AC8 [happy-path]:** When Templates opens, real template thumbnails are searchable and grouped into Recently used and More templates. Successfully applied template IDs update recent history scoped to the signed-in account; template visibility and eligibility still come from the existing API. Applying a template to nonempty canvas retains replacement confirmation, and cancellation leaves the canvas unchanged. This panel has no Save as template control.
- [x] **AC9 [error-path]:** Given a pending templates request, the panel shows loading; given no matching templates, it shows an empty result; given an API failure, it shows an error and retry action. No sample records or mock success messages substitute for API data. Changing accounts does not display another account's recent history.
- [x] **AC10 [happy-path]:** When Property, Agent or Brand opens, the existing PropertyDetailsForm, AgentInfoForm and palette operations are reachable in their approved separate panels. Editing an existing bound property/agent field updates the same listing store and connected elements as the legacy operation; a palette action changes artwork only when deliberately invoked. Assistant opens the existing AI chat/generation experience with its existing progress, errors and quota enforcement; this story adds no generation request solely from opening Assistant.
- [x] **AC11 [theme]:** When the existing application preference resolves to light or dark, every shell panel, popover and toolbar uses the approved scoped Navy/Teal token roles; artwork colors remain unchanged. Icons use consistent rounded strokes and visible hover, selected, focus and disabled states; reduced-motion preference disables color-transition animation. At 1191px and 1440px widths, the tool strip, selected-element readout, Assistant and footer remain independently reachable without overlap. This story is explicitly desktop-only; 375px redesign is deferred by epic scope.
- [x] **AC12 [regression]:** Given an existing design, open → text edit → Undo/Redo → acknowledged Save → reload retains the same canonical server ID, metadata and committed text. PNG export uses the existing exporter and failure/retry behavior. Preview hides editing chrome, permits no edits, and exits through Exit or Escape while preserving draft/history/selection. P and save/history shortcuts do not steal typing from editable controls. Existing load/save race protections and auth boundary remain active.
- [x] **AC13 [error-path]:** Given a load, save or export failure, the existing actionable error and retry remain available; editing tools cannot mutate a workspace before its guarded load is ready. Cloud status reports the real session state, never an elapsed timer or a simulated acknowledgement. Autosave timing/retry/navigation changes belong exclusively to US-EDIT-027.

---

## Out of Scope

- Does not implement line rendering, curved connectors, new shape types or modify canvas serialization/export engines.
- Does not implement autosave/session policy; US-EDIT-027 owns it, including the real timestamp and recovery contract.
- Does not implement US-EDIT-020 linked-element management, US-EDIT-021 export review, US-EDIT-022 redesigned Look workflows, US-EDIT-023 new Assistant workflows, US-EDIT-025 new listing flows or US-EDIT-026 extraction review. Existing operations are adapted here; those stories require reconciliation against the actual remainder.
- Does not change default route rollout, backend/API/schema, plan limits, marketing themes, offline mode, collaboration or mobile layout.
- Does not transplant prototype fake data/actions or mount the legacy EditorLayout and duplicate its keyboard handlers.

---

## Engineering / PR

- **Branch:** `feat/edit/m-11-v3-editor-slice` (approved dependent work on the existing isolated foundation branch; M-EDIT-11 and M-EDIT-09 remain separately traceable).
- **PR:** #_____ (not merged)
- **Primary files touched:** exact production/test paths in [TASKS.md](./TASKS.md); no session files are authorized here.
- **Planning reconciliation:** this approval supersedes draft024's guide bar, Assistant top placement, Layers rail, canvas badges and legacy-shell file list. The parent milestone wording still requires a planning update; it is not authority to restore those obsolete controls.

---

## AI Implementation Prompt

> Implement US-EDIT-024 against the approved bundle, this card and TASKS.md. Reuse US-EDIT-031 session/controller/renderers, existing leaf panels and operations. Follow Wouter, Zustand, React Query, scoped theme tokens and existing auth. Touch ONLY paths listed in TASKS.md. Do not implement Out of Scope or fabricate unavailable line actions. Write acceptance-derived failing tests before implementation. Preserve tests for session identity, metadata, acknowledged persistence, history, Preview and PNG; adapt only the UI edit trigger. Run `npm run check`, `npm run test:unit`, `npm run test:unit:client` and scoped Playwright before declaring local verification. Report changed files, individually checked ACs, exact results, outstanding verification and remaining feature scope. Never mark Done before all DoD requirements, including PR merge, are satisfied.

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-EDIT-024-01 | Browser / Unit | P0 | happy-path: When an authenticated agent opens , the top bar shows the… | ✅ | See implementation report: automated flows, visual captures and live smoke; provider generation not invoked. |
| TC-EDIT-024-02 | Browser / Unit | P0 | happy-path: When the workspace is ready, its rail lists Templates, To… | ✅ | See implementation report: automated flows, visual captures and live smoke; provider generation not invoked. |
| TC-EDIT-024-03 | Browser / Unit | P0 | happy-path: When Tools opens, its floating vertical strip exposes Sel… | ✅ | See implementation report: automated flows, visual captures and live smoke; provider generation not invoked. |
| TC-EDIT-024-04 | Browser / Unit | P0 | error-path: When Line opens, Straight line, Curved line and Elbow lin… | ✅ | See implementation report: automated flows, visual captures and live smoke; provider generation not invoked. |
| TC-EDIT-024-05 | Browser / Unit | P0 | happy-path: Given any nonempty selection containing text, image or an… | ✅ | See implementation report: automated flows, visual captures and live smoke; provider generation not invoked. |
| TC-EDIT-024-06 | Browser / Unit | P0 | happy-path: When one text element is selected, type-specific formatti… | ✅ | See implementation report: automated flows, visual captures and live smoke; provider generation not invoked. |
| TC-EDIT-024-07 | Browser / Unit | P0 | happy-path: Given a single selected element at x=80, y=120, width=200… | ✅ | See implementation report: automated flows, visual captures and live smoke; provider generation not invoked. |
| TC-EDIT-024-08 | Browser / Unit | P0 | happy-path: When Templates opens, real template thumbnails are search… | ✅ | See implementation report: automated flows, visual captures and live smoke; provider generation not invoked. |
| TC-EDIT-024-09 | Browser / Unit | P0 | error-path: Given a pending templates request, the panel shows loadin… | ✅ | See implementation report: automated flows, visual captures and live smoke; provider generation not invoked. |
| TC-EDIT-024-10 | Browser / Unit | P0 | happy-path: When Property, Agent or Brand opens, the existing Propert… | ✅ | See implementation report: automated flows, visual captures and live smoke; provider generation not invoked. |
| TC-EDIT-024-11 | Browser / Unit | P1 | theme: When the existing application preference resolves to ligh… | ✅ | See implementation report: automated flows, visual captures and live smoke; provider generation not invoked. |
| TC-EDIT-024-12 | Browser / Unit | P1 | regression: Given an existing design, open → text edit → Undo/Redo → … | ✅ | See implementation report: automated flows, visual captures and live smoke; provider generation not invoked. |
| TC-EDIT-024-13 | Browser / Unit | P0 | error-path: Given a load, save or export failure, the existing action… | ✅ | See implementation report: automated flows, visual captures and live smoke; provider generation not invoked. |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ and test cases run/recorded.
- [ ] `npm run check`, `npm run test:unit`, `npm run test:unit:client` pass with no regression.
- [ ] Applicable frontend/browser gates pass, both themes visually checked, no console errors in changed flow.
- [ ] Authenticated live persistence/export smoke recorded separately from mocked API tests.
- [ ] Independent review and milestone PR merge recorded.
- [ ] [TASKS.md](./TASKS.md) fully checked and status updated only after completion.

## Local verification — 2026-11-01

Implemented acceptance scope is locally verified by 1,237 unit tests (one existing skip), type/build gates, 36 browser integration cases, responsive light/dark captures and a real authenticated API/database save/reload/export smoke. Brand/Assistant reuse was also inspected against existing leaf contracts; paid AI-provider generation was not invoked. The story remains In Progress until independent review and milestone PR merge. See Mockups/approved-v3-editor/IMPLEMENTATION_STATUS.md for remaining features.
