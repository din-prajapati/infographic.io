# Story Card — US-EDIT-021

> **Status:** 🔲 Not Started — reconciled 2026-11-13; certification and implementation pending
> **Feature:** F-EDIT-01 — Listing workflow integration
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-06-linked-editing](../../milestones/M-EDIT-06-linked-editing.md)
> **Linear:** LIN-XXX (unassigned)
> **Size:** M
> **Created:** 2026-10-29 | **Closed:** —
> **Prerequisites:** US-EDIT-022
> **Approved source:** Mockups/listing-workflow-v1/REFINEMENT.md and P1-ESSENTIALS.md; photo ranking excluded by user approval.

---

## Story

*As a* solo real estate agent preparing listings in India, the US, UK or Canada
*I want* to review listing artwork before downloading a PNG
*So that* I do not publish missing or outdated property facts by mistake

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** When Review & export is invoked, the dialog lists missing required facts/photos, placeholders, invalid price, stale linked content, unapplied changes, intent/period mismatch and measurable text overflow; only an explicit human-review acknowledgement with no blocking findings enables PNG export through the existing actual V3 canvas renderer without selection/field-label UI.
- [ ] **AC2 [error-path]:** When image loading or PNG rendering fails no successful download is reported and retry remains available; when artwork or pending/applied state changes while the asynchronous render is running, the stale export is rejected and review acknowledgement must be renewed.
- [ ] **AC3 [regression]:** When the reviewed artwork is exported, the PNG has the design canvas dimensions and includes current text, geometry, chosen photos and crop without editor selection chrome; explicit independent/custom values are not mistaken for stale linked facts; hidden essential facts produce a review finding.
- [ ] **AC4 [theme]:** When the dialog opens at 375px or 1440px in light/dark theme, all findings, acknowledgement, Cancel and Export actions remain keyboard reachable, focus returns to the trigger on close and the page has no horizontal overflow.

---

## Out of Scope

- Does not implement AI Assistant, generation changes, MLS/RERA or any live property connector.
- Does not implement photo ranking, role assignment, lifecycle photo packs, automatic crop changes or template reflow.
- Does not change the default editor route, existing payment/usage metering, onboarding or legacy editor behavior.
- Does not add autosave redesign, arbitrary poster reconstruction, new billing restrictions or connector caching.

---

## Engineering / PR

- **Branch:** `codex/v3-arrange-opus` (existing approved V3 integration branch)
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/lib/v3ExportReview.ts` — Pure findings and artwork revision token for async export safety
  - `client/src/components/editor/v3/V3ExportReview.tsx` — Human review dialog with current findings and actual PNG download
  - `client/src/components/editor/v3/v3-export-review.css` — Theme-aware responsive review dialog
  - `client/src/lib/__tests__/v3ExportReview.spec.ts` — Missing, invalid, stale, overflow and async revision contracts
  - `client/src/components/editor/v3/__tests__/V3ExportReview.spec.tsx` — Review acknowledgement and rendering failure cases
  - `e2e/v3-listing-workflow.spec.ts` — Actual V3 two-listing save/reopen and PNG export browser journey
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-021/STORY.md` — Record AC/test evidence and implementation status
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-021/TASKS.md` — Record task progress and verification
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-021/scaffold.json` — Maintain exact scope scaffold

---

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
Stack: React 18 + Vite, NestJS 11, Prisma 6, Tailwind v3 + shadcn/ui, Wouter router, Zustand + React Query.
Read AGENTS.md, this story, TASKS.md, scaffold.json and parent ARCHITECTURE.mmd / ENV.yaml.
Story: US-EDIT-021 — Reviewed PNG export from actual V3 artwork
Prerequisites: US-EDIT-022
As a solo real estate agent, I want to review listing artwork before downloading a PNG so that I do not publish missing or outdated property facts by mistake.
Acceptance Criteria:
AC1 [happy-path]: When Review & export is invoked, the dialog lists missing required facts/photos, placeholders, invalid price, stale linked content, unapplied changes, intent/period mismatch and measurable text overflow; only an explicit human-review acknowledgement with no blocking findings enables PNG export through the existing actual V3 canvas renderer without selection/field-label UI.
AC2 [error-path]: When image loading or PNG rendering fails no successful download is reported and retry remains available; when artwork or pending/applied state changes while the asynchronous render is running, the stale export is rejected and review acknowledgement must be renewed.
AC3 [regression]: When the reviewed artwork is exported, the PNG has the design canvas dimensions and includes current text, geometry, chosen photos and crop without editor selection chrome; explicit independent/custom values are not mistaken for stale linked facts; hidden essential facts produce a review finding.
AC4 [theme]: When the dialog opens at 375px or 1440px in light/dark theme, all findings, acknowledgement, Cancel and Export actions remain keyboard reachable, focus returns to the trigger on close and the page has no horizontal overflow.
Out of Scope: AI Assistant, live connectors, photo ranking/roles/packs, route default changes, billing or legacy-editor redesign.
Primary files to touch (do NOT touch other files):
client/src/lib/v3ExportReview.ts
client/src/components/editor/v3/V3ExportReview.tsx
client/src/components/editor/v3/v3-export-review.css
client/src/lib/__tests__/v3ExportReview.spec.ts
client/src/components/editor/v3/__tests__/V3ExportReview.spec.tsx
e2e/v3-listing-workflow.spec.ts
docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-021/STORY.md
docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-021/TASKS.md
docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-021/scaffold.json
Rules:
- Touch ONLY the files listed above; do NOT implement Out of Scope.
- Define contract assertions before implementation. Do not weaken existing tests.
- Follow pending/applied snapshot isolation and reuse actual V3 render/save paths.
- Run npm run check and npm run test:unit before declaring done.
- Record browser/API verification where applicable. Never mark merged without a merge.
- When done: list files changed, ACs checked, exact test output and remaining limitations.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-EDIT-021-01 | Unit | P0 | happy-path: When Review & export is invoked, the dialog lists missing… | 🔲 | |
| TC-EDIT-021-02 | Unit | P0 | error-path: When image loading or PNG rendering fails no successful d… | 🔲 | |
| TC-EDIT-021-03 | Unit | P1 | regression: When the reviewed artwork is exported, the PNG has the de… | 🔲 | |
| TC-EDIT-021-04 | Unit | P1 | theme: When the dialog opens at 375px or 1440px in light/dark th… | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded in table above
- [ ] `npm run check` passes (0 new TypeScript errors)
- [ ] `npm run test:unit` passes (no regressions)
- [ ] Relevant visual/browser/API gates pass with recorded evidence
- [ ] Manual flow verified on `localhost:5000` (actual opt-in V3 route)
- [ ] PR merged (PR #_____)
- [ ] No console errors in changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked ✅
- [ ] STORY.md status updated to `✅ Done`

## Reconciliation — 2026-11-13

This existing ID is retained. The approved listing mockup supersedes earlier draft paths and immediate canvas writes for the V3 slice. This card is a bounded M-sized implementation contract; follow-up product expansion remains deferred. Historical completion is not claimed. See docs/research/2026-11-13-LISTING-V3-INTEGRATION-MATRIX.md for sibling scope ownership.
