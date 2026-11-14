# Story Card — US-EDIT-020

> **Status:** 🟡 Implemented and locally verified — 2026-11-14; independent functional review complete; UI/font/device acceptance and milestone merge pending
> **Feature:** F-EDIT-01 — Listing workflow integration
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-06-linked-editing](../../milestones/M-EDIT-06-linked-editing.md)
> **Linear:** LIN-XXX (unassigned)
> **Size:** M
> **Created:** 2026-10-29 | **Closed:** —
> **Prerequisites:** US-PROP-004
> **Approved source:** Mockups/listing-workflow-v1/REFINEMENT.md and P1-ESSENTIALS.md; photo ranking excluded by user approval.

---

## Story

*As a* solo real estate agent preparing listings in India, the US, UK or Canada
*I want* to inspect and control which listing facts artwork elements use
*So that* I can reuse templates and keep deliberate design-specific edits

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When Link field or Template Fields is invoked, the inspector shows the selected element with friendly Property/Agent/Brand source labels, explicit independent/linked/customized state and separate beds/baths/area/unit inputs for specifications; selecting artwork alone never opens the inspector.
- [x] **AC2 [error-path]:** When there is no selection or a selected element cannot accept the chosen field type, the inspector explains the condition and disables incompatible mapping without modifying artwork or source facts.
- [x] **AC3 [edge-case]:** When Customize this design is expanded, a local text/photo override changes only that element and not pending property/profile data; Detach retains visible content and Use linked value/reconnect explicitly removes the override; ordinary Apply preserves overrides.
- [x] **AC4 [theme]:** When Template Fields is used at 375px and 1440px in light/dark themes, field labels and actions remain visible/reachable without horizontal page overflow; controls have accessible labels and expose expanded/selected state to keyboard users.

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
  - `client/src/components/editor/v3/V3TemplateFields.tsx` — Friendly field mapping, text/image bindings, specifications and customizations UI
  - `client/src/components/editor/v3/v3-template-fields.css` — Responsive theme-aware inspector styling
  - `client/src/components/editor/v3/__tests__/V3TemplateFields.spec.tsx` — Selection, map, detach/reconnect and customization UI contracts
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-020/STORY.md` — Record AC/test evidence and implementation status
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-020/TASKS.md` — Record task progress and verification
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-020/scaffold.json` — Maintain exact scope scaffold

---

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
Stack: React 18 + Vite, NestJS 11, Prisma 6, Tailwind v3 + shadcn/ui, Wouter router, Zustand + React Query.
Read AGENTS.md, this story, TASKS.md, scaffold.json and parent ARCHITECTURE.mmd / ENV.yaml.
Story: US-EDIT-020 — Template Fields and design customization inspector
Prerequisites: US-PROP-004
As a solo real estate agent, I want to inspect and control which listing facts artwork elements use so that I can reuse templates and keep deliberate design-specific edits.
Acceptance Criteria:
AC1 [happy-path]: When Link field or Template Fields is invoked, the inspector shows the selected element with friendly Property/Agent/Brand source labels, explicit independent/linked/customized state and separate beds/baths/area/unit inputs for specifications; selecting artwork alone never opens the inspector.
AC2 [error-path]: When there is no selection or a selected element cannot accept the chosen field type, the inspector explains the condition and disables incompatible mapping without modifying artwork or source facts.
AC3 [edge-case]: When Customize this design is expanded, a local text/photo override changes only that element and not pending property/profile data; Detach retains visible content and Use linked value/reconnect explicitly removes the override; ordinary Apply preserves overrides.
AC4 [theme]: When Template Fields is used at 375px and 1440px in light/dark themes, field labels and actions remain visible/reachable without horizontal page overflow; controls have accessible labels and expose expanded/selected state to keyboard users.
Out of Scope: AI Assistant, live connectors, photo ranking/roles/packs, route default changes, billing or legacy-editor redesign.
Primary files to touch (do NOT touch other files):
client/src/components/editor/v3/V3TemplateFields.tsx
client/src/components/editor/v3/v3-template-fields.css
client/src/components/editor/v3/__tests__/V3TemplateFields.spec.tsx
docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-020/STORY.md
docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-020/TASKS.md
docs/agile/epics/phase-1.5-foundation-v3/EPIC-EDIT-04/stories/US-EDIT-020/scaffold.json
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
| TC-EDIT-020-01 | Unit | P0 | happy-path: When Link field or Template Fields is invoked, the inspec… | ✅ | Unit/browser/API evidence mapped in 2026-11-14-V3-RELEASE-HARDENING.md; UI/device acceptance separate |
| TC-EDIT-020-02 | Unit | P0 | error-path: When there is no selection or a selected element cannot a… | ✅ | Unit/browser/API evidence mapped in 2026-11-14-V3-RELEASE-HARDENING.md; UI/device acceptance separate |
| TC-EDIT-020-03 | Unit | P1 | edge-case: When Customize this design is expanded, a local text/phot… | ✅ | Unit/browser/API evidence mapped in 2026-11-14-V3-RELEASE-HARDENING.md; UI/device acceptance separate |
| TC-EDIT-020-04 | Unit | P1 | theme: When Template Fields is used at 375px and 1440px in light… | ✅ | Unit/browser/API evidence mapped in 2026-11-14-V3-RELEASE-HARDENING.md; UI/device acceptance separate |

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
