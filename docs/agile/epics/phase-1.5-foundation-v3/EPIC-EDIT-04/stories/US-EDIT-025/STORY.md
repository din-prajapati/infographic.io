# Story Card — US-EDIT-025

> **Status:** 🟡 Implemented and locally verified — 2026-11-14; independent functional review complete; UI/font/device acceptance and milestone merge pending
> **Feature:** F-EDIT-01 — Listing workflow integration
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-09-v3-shell](../../milestones/M-EDIT-09-v3-shell.md)
> **Linear:** LIN-XXX (unassigned)
> **Size:** M
> **Created:** 2026-10-29 | **Closed:** —
> **Prerequisites:** US-PROP-001, US-PROP-002, US-PROP-004
> **Approved source:** Mockups/listing-workflow-v1/REFINEMENT.md and P1-ESSENTIALS.md; photo ranking excluded by user approval.

---

## Story

*As a* solo real estate agent preparing listings in India, the US, UK or Canada
*I want* to manage listing sources, media and identity in the approved V3 sidebar
*So that* I can prepare listing information without leaving the design workflow

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When the Listing destination opens, the approved welcome offers Paste text, Saved properties and manual entry with country controls; selected saved records open a pinned-address overview with clickable Property card, Media, Agent and Brand cards, and pinned Apply footer; Agent/Brand destinations return to the prior Listing overview scroll position.
- [x] **AC2 [error-path]:** When saved-property/profile requests are pending the controls show loading and prevent duplicate submissions; on failure inline errors expose retry and retain form inputs; saved search is case-insensitive across address/name/listing ID with result count, clear action and no-results state; no unavailable Listing ID source reports a fictional successful lookup.
- [x] **AC3 [edge-case]:** When reviewed local paste is confirmed, only selected valid non-stale facts enter pending state, ambiguous price/mixed-property findings require resolution, source snippets remain inspectable and imported contact text is suggestion-only; manual media selection/upload uses existing file handling and never assigns photo roles or rankings.
- [x] **AC4 [theme]:** When rendered at 375px or 1440px in light or dark theme, forms, gallery, cards and Apply actions remain reachable without page horizontal overflow, text uses theme tokens with at least 4.5:1 contrast, and keyboard users can label, open, save and cancel each form.

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
  - `client/src/components/editor/v3/V3ListingPanel.tsx` — Welcome, saved search, reviewed paste, property edits, agent/brand and manual gallery UI
  - `client/src/components/editor/v3/v3-listing-panel.css` — Responsive token-based light/dark listing styling
  - `client/src/components/editor/v3/__tests__/V3ListingPanel.spec.tsx` — Search, forms, loading/errors, review and navigation contracts
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-025/STORY.md` — Record AC/test evidence and implementation status
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-025/TASKS.md` — Record task progress and verification
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-025/scaffold.json` — Maintain exact scope scaffold

---

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
Stack: React 18 + Vite, NestJS 11, Prisma 6, Tailwind v3 + shadcn/ui, Wouter router, Zustand + React Query.
Read AGENTS.md, this story, TASKS.md, scaffold.json and parent ARCHITECTURE.mmd / ENV.yaml.
Story: US-EDIT-025 — Approved Listing overview, Property, Agent and Brand panels
Prerequisites: US-PROP-001, US-PROP-002, US-PROP-004
As a solo real estate agent, I want to manage listing sources, media and identity in the approved V3 sidebar so that I can prepare listing information without leaving the design workflow.
Acceptance Criteria:
AC1 [happy-path]: When the Listing destination opens, the approved welcome offers Paste text, Saved properties and manual entry with country controls; selected saved records open a pinned-address overview with clickable Property card, Media, Agent and Brand cards, and pinned Apply footer; Agent/Brand destinations return to the prior Listing overview scroll position.
AC2 [error-path]: When saved-property/profile requests are pending the controls show loading and prevent duplicate submissions; on failure inline errors expose retry and retain form inputs; saved search is case-insensitive across address/name/listing ID with result count, clear action and no-results state; no unavailable Listing ID source reports a fictional successful lookup.
AC3 [edge-case]: When reviewed local paste is confirmed, only selected valid non-stale facts enter pending state, ambiguous price/mixed-property findings require resolution, source snippets remain inspectable and imported contact text is suggestion-only; manual media selection/upload uses existing file handling and never assigns photo roles or rankings.
AC4 [theme]: When rendered at 375px or 1440px in light or dark theme, forms, gallery, cards and Apply actions remain reachable without page horizontal overflow, text uses theme tokens with at least 4.5:1 contrast, and keyboard users can label, open, save and cancel each form.
Out of Scope: AI Assistant, live connectors, photo ranking/roles/packs, route default changes, billing or legacy-editor redesign.
Primary files to touch (do NOT touch other files):
client/src/components/editor/v3/V3ListingPanel.tsx
client/src/components/editor/v3/v3-listing-panel.css
client/src/components/editor/v3/__tests__/V3ListingPanel.spec.tsx
docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-025/STORY.md
docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-025/TASKS.md
docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-025/scaffold.json
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
| TC-EDIT-025-01 | Unit | P0 | happy-path: When the Listing destination opens, the approved welcome … | ✅ | Unit/browser/API evidence mapped in 2026-11-14-V3-RELEASE-HARDENING.md; UI/device acceptance separate |
| TC-EDIT-025-02 | Unit | P0 | error-path: When saved-property/profile requests are pending the cont… | ✅ | Unit/browser/API evidence mapped in 2026-11-14-V3-RELEASE-HARDENING.md; UI/device acceptance separate |
| TC-EDIT-025-03 | Unit | P1 | edge-case: When reviewed local paste is confirmed, only selected val… | ✅ | Unit/browser/API evidence mapped in 2026-11-14-V3-RELEASE-HARDENING.md; UI/device acceptance separate |
| TC-EDIT-025-04 | Unit | P1 | theme: When rendered at 375px or 1440px in light or dark theme, … | ✅ | Unit/browser/API evidence mapped in 2026-11-14-V3-RELEASE-HARDENING.md; UI/device acceptance separate |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded in table above
- [x] `npm run check` passes (0 new TypeScript errors)
- [x] `npm run test:unit` passes (no regressions)
- [ ] Relevant visual/browser/API gates pass with recorded evidence
- [ ] Manual flow verified on `localhost:5000` (actual opt-in V3 route)
- [ ] PR merged (PR #_____)
- [ ] No console errors in changed flow
- [x] [TASKS.md](./TASKS.md) task list fully checked ✅
- [ ] STORY.md status updated to `✅ Done`

## Reconciliation — 2026-11-13

This existing ID is retained. The approved listing mockup supersedes earlier draft paths and immediate canvas writes for the V3 slice. This card is a bounded M-sized implementation contract; follow-up product expansion remains deferred. Historical completion is not claimed. See docs/research/2026-11-13-LISTING-V3-INTEGRATION-MATRIX.md for sibling scope ownership.


## Release reconciliation — 2026-11-14

The current reconciled ACs are implemented; evidence is mapped in docs/research/2026-11-14-V3-RELEASE-HARDENING.md. AC implementation is distinguished from release acceptance. Historical verification keeps its original date; this pass records fresh checks separately. Open review, user font/UI annotations, device acceptance and milestone PR/merge remain unchecked. No formal closure or default-editor cutover is claimed.


Fresh automated gates and the individual AC evidence map are recorded in docs/research/2026-11-14-V3-RELEASE-HARDENING.md. This is local verification, not formal Done. User UI/font acceptance, physical-device checks, unresolved operational gates and actual milestone PR/merge remain separate.
