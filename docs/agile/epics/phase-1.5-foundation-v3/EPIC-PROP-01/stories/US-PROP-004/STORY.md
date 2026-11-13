# Story Card — US-PROP-004

> **Status:** 🔲 Not Started — reconciled 2026-11-13; certification and implementation pending
> **Feature:** F-PROP-01 — Listing workflow integration
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-03-template-contract](../../milestones/M-PROP-03-template-contract.md)
> **Linear:** LIN-XXX (unassigned)
> **Size:** M
> **Created:** 2026-10-29 | **Closed:** —
> **Prerequisites:** US-PROP-002
> **Approved source:** Mockups/listing-workflow-v1/REFINEMENT.md and P1-ESSENTIALS.md; photo ranking excluded by user approval.

---

## Story

*As a* solo real estate agent preparing listings in India, the US, UK or Canada
*I want* to apply listing updates explicitly and keep design customizations
*So that* editing listing facts cannot unexpectedly damage my artwork

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** When Property, Agent or Brand source facts are edited, only the pending record changes; Apply listing updates atomically updates all eligible linked text/image elements and applied snapshot, retains element IDs, geometry, styles, crop and unlinked/customized content, and enables Undo last apply to restore the exact prior artwork/applied snapshot without discarding pending facts.
- [ ] **AC2 [error-path]:** When a pending field is invalid Apply is blocked with a field finding and no partial canvas mutation; when a linked image source is missing an existing design retains its prior image with a review warning while a new design has an explicit Add image placeholder.
- [ ] **AC3 [regression]:** When a saved V3 Design reopens, pending facts, applied snapshot, property association, bindings and design customizations restore independently; canvas text never silently becomes canonical property facts; documents without workflow metadata continue opening through existing legacy behavior.
- [ ] **AC4 [edge-case]:** When a linked element is detached its current visible content remains independent; reconnecting or Use linked value explicitly removes that element customization; manual photo replacement remains protected from ordinary Apply, and mapping grouped specifications uses separate beds/baths/area/unit sources.

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
  - `client/src/lib/v3ListingWorkflow.ts` — Pure pending/applied snapshots, bindings, customizations, atomic Apply and Undo
  - `client/src/hooks/useV3ListingWorkflow.ts` — Listing workspace Zustand state and editor orchestration
  - `client/src/lib/canvasTypes.ts` — Add reusable field/image/compound binding and workflow snapshot types
  - `client/src/lib/canvasState.ts` — Capture/restore workflow snapshots without canvas-to-pending hydration
  - `client/src/lib/listingBindings.ts` — Add V3 guards and binding migration without changing legacy behavior
  - `client/src/lib/v3DesignSession.ts` — Carry validated additive workflow state in document sessions
  - `client/src/hooks/useV3DesignSession.ts` — Restore V3 state and subscribe to pending changes for autosave
  - `client/src/components/canvas/TextElement.tsx` — Guard direct V3 linked-text edits through customization contract
  - `client/src/lib/__tests__/v3ListingWorkflow.spec.ts` — Atomic apply, undo, binding, crop and snapshot isolation contracts
  - `client/src/lib/__tests__/v3DesignSession.spec.ts` — Reopen and autosave snapshot regression cases
  - `client/src/hooks/__tests__/useV3ListingWorkflow.spec.ts` — Workspace isolation and pending state orchestration tests
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-004/STORY.md` — Record AC/test evidence and implementation status
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-004/TASKS.md` — Record task progress and verification
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-004/scaffold.json` — Maintain exact scope scaffold

---


- `client/src/lib/slotIds.ts` — Register canonical listing field slots required by Apply

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
Stack: React 18 + Vite, NestJS 11, Prisma 6, Tailwind v3 + shadcn/ui, Wouter router, Zustand + React Query.
Read AGENTS.md, this story, TASKS.md, scaffold.json and parent ARCHITECTURE.mmd / ENV.yaml.
Story: US-PROP-004 — Pending/applied V3 listing and binding contract
Prerequisites: US-PROP-002
As a solo real estate agent, I want to apply listing updates explicitly and keep design customizations so that editing listing facts cannot unexpectedly damage my artwork.
Acceptance Criteria:
AC1 [happy-path]: When Property, Agent or Brand source facts are edited, only the pending record changes; Apply listing updates atomically updates all eligible linked text/image elements and applied snapshot, retains element IDs, geometry, styles, crop and unlinked/customized content, and enables Undo last apply to restore the exact prior artwork/applied snapshot without discarding pending facts.
AC2 [error-path]: When a pending field is invalid Apply is blocked with a field finding and no partial canvas mutation; when a linked image source is missing an existing design retains its prior image with a review warning while a new design has an explicit Add image placeholder.
AC3 [regression]: When a saved V3 Design reopens, pending facts, applied snapshot, property association, bindings and design customizations restore independently; canvas text never silently becomes canonical property facts; documents without workflow metadata continue opening through existing legacy behavior.
AC4 [edge-case]: When a linked element is detached its current visible content remains independent; reconnecting or Use linked value explicitly removes that element customization; manual photo replacement remains protected from ordinary Apply, and mapping grouped specifications uses separate beds/baths/area/unit sources.
Out of Scope: AI Assistant, live connectors, photo ranking/roles/packs, route default changes, billing or legacy-editor redesign.
Primary files to touch (do NOT touch other files):
client/src/lib/v3ListingWorkflow.ts
client/src/hooks/useV3ListingWorkflow.ts
client/src/lib/canvasTypes.ts
client/src/lib/canvasState.ts
client/src/lib/listingBindings.ts
client/src/lib/v3DesignSession.ts
client/src/hooks/useV3DesignSession.ts
client/src/components/canvas/TextElement.tsx
client/src/lib/__tests__/v3ListingWorkflow.spec.ts
client/src/lib/__tests__/v3DesignSession.spec.ts
client/src/hooks/__tests__/useV3ListingWorkflow.spec.ts
docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-004/STORY.md
docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-004/TASKS.md
docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-004/scaffold.json
client/src/lib/slotIds.ts
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
| TC-PROP-004-01 | Unit | P0 | happy-path: When Property, Agent or Brand source facts are edited, on… | 🔲 | |
| TC-PROP-004-02 | Unit | P0 | error-path: When a pending field is invalid Apply is blocked with a f… | 🔲 | |
| TC-PROP-004-03 | Unit | P1 | regression: When a saved V3 Design reopens, pending facts, applied sn… | 🔲 | |
| TC-PROP-004-04 | Unit | P1 | edge-case: When a linked element is detached its current visible con… | 🔲 | |

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
