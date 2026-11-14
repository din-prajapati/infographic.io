# Story Card — US-EDIT-022

> **Status:** 🟡 Implemented and locally verified — 2026-11-14; independent functional review complete; UI/font/device acceptance and milestone merge pending
> **Feature:** F-EDIT-01 — Listing workflow integration
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-07-design-tab](../../milestones/M-EDIT-07-design-tab.md)
> **Linear:** LIN-XXX (unassigned)
> **Size:** M
> **Created:** 2026-10-29 | **Closed:** —
> **Prerequisites:** US-PROP-004, US-EDIT-025, US-EDIT-020
> **Approved source:** Mockups/listing-workflow-v1/REFINEMENT.md and P1-ESSENTIALS.md; photo ranking excluded by user approval.

---

## Story

*As a* solo real estate agent preparing listings in India, the US, UK or Canada
*I want* to save reusable templates and separate listing Designs
*So that* one layout can produce independent marketing assets for different properties

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When Save as Template succeeds through the existing authenticated template API, reusable layout, field links, geometry/styles/crops and independent static content persist while listing-specific linked values and listing association are stripped; Use this template creates a separate Design from pending listing facts without modifying the template or another Design.
- [x] **AC2 [error-path]:** When template/design save is pending duplicate saves are disabled; failure retains work with retry and never reports Saved; Save as Design explicitly discloses unapplied listing edits and persists pending/applied snapshots separately using the existing acknowledged session path.
- [x] **AC3 [regression]:** When two Designs are created from one Template with different Listings, saving/reopening and editing one retains the other artwork, property association and customizations; a new Design with a missing linked photo shows Add image instead of the prior property photograph; existing V3 image editing/crop and canvas tools remain available.
- [x] **AC4 [theme]:** When integrated Listing, Agent, Brand, Template Fields and save controls are used at 375px and 1440px in both themes, panel actions remain reachable and navigation preserves the expected overview; the opt-in V3 route remains opt-in and Assistant behavior is not changed.

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
  - `client/src/lib/v3TemplateWorkflow.ts` — Create reusable template payload and independent design from pending listing
  - `client/src/components/editor/v3/V3Editor.tsx` — Integrate Listing/Template Fields/save actions into actual opt-in V3
  - `client/src/components/editor/v3/V3Panels.tsx` — Route Listing/Agent/Brand/Template Fields and saved template/design actions
  - `client/src/components/editor/v3/v3-editor.css` — Shell integration responsive states using existing tokens
  - `client/src/lib/__tests__/v3TemplateWorkflow.spec.ts` — Template fact stripping, placeholders and independent snapshots
  - `client/src/components/editor/v3/__tests__/V3Panels.spec.tsx` — Panel routing and save action integration regression tests
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-022/STORY.md` — Record AC/test evidence and implementation status
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-022/TASKS.md` — Record task progress and verification
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-022/scaffold.json` — Maintain exact scope scaffold

---

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
Stack: React 18 + Vite, NestJS 11, Prisma 6, Tailwind v3 + shadcn/ui, Wouter router, Zustand + React Query.
Read AGENTS.md, this story, TASKS.md, scaffold.json and parent ARCHITECTURE.mmd / ENV.yaml.
Story: US-EDIT-022 — Reusable templates and independent saved Designs
Prerequisites: US-PROP-004, US-EDIT-025, US-EDIT-020
As a solo real estate agent, I want to save reusable templates and separate listing Designs so that one layout can produce independent marketing assets for different properties.
Acceptance Criteria:
AC1 [happy-path]: When Save as Template succeeds through the existing authenticated template API, reusable layout, field links, geometry/styles/crops and independent static content persist while listing-specific linked values and listing association are stripped; Use this template creates a separate Design from pending listing facts without modifying the template or another Design.
AC2 [error-path]: When template/design save is pending duplicate saves are disabled; failure retains work with retry and never reports Saved; Save as Design explicitly discloses unapplied listing edits and persists pending/applied snapshots separately using the existing acknowledged session path.
AC3 [regression]: When two Designs are created from one Template with different Listings, saving/reopening and editing one retains the other artwork, property association and customizations; a new Design with a missing linked photo shows Add image instead of the prior property photograph; existing V3 image editing/crop and canvas tools remain available.
AC4 [theme]: When integrated Listing, Agent, Brand, Template Fields and save controls are used at 375px and 1440px in both themes, panel actions remain reachable and navigation preserves the expected overview; the opt-in V3 route remains opt-in and Assistant behavior is not changed.
Out of Scope: AI Assistant, live connectors, photo ranking/roles/packs, route default changes, billing or legacy-editor redesign.
Primary files to touch (do NOT touch other files):
client/src/lib/v3TemplateWorkflow.ts
client/src/components/editor/v3/V3Editor.tsx
client/src/components/editor/v3/V3Panels.tsx
client/src/components/editor/v3/v3-editor.css
client/src/lib/__tests__/v3TemplateWorkflow.spec.ts
client/src/components/editor/v3/__tests__/V3Panels.spec.tsx
docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-022/STORY.md
docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-022/TASKS.md
docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-022/scaffold.json
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
| TC-EDIT-022-01 | Unit | P0 | happy-path: When Save as Template succeeds through the existing authe… | ✅ | Unit/browser/API evidence mapped in 2026-11-14-V3-RELEASE-HARDENING.md; UI/device acceptance separate |
| TC-EDIT-022-02 | Unit | P0 | error-path: When template/design save is pending duplicate saves are … | ✅ | Unit/browser/API evidence mapped in 2026-11-14-V3-RELEASE-HARDENING.md; UI/device acceptance separate |
| TC-EDIT-022-03 | Unit | P1 | regression: When two Designs are created from one Template with diffe… | ✅ | Unit/browser/API evidence mapped in 2026-11-14-V3-RELEASE-HARDENING.md; UI/device acceptance separate |
| TC-EDIT-022-04 | Unit | P1 | theme: When integrated Listing, Agent, Brand, Template Fields an… | ✅ | Unit/browser/API evidence mapped in 2026-11-14-V3-RELEASE-HARDENING.md; UI/device acceptance separate |

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
