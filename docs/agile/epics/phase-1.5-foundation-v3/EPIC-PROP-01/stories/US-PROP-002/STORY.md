# Story Card — US-PROP-002

> **Status:** 🔲 Not Started — reconciled 2026-11-13; certification and implementation pending
> **Feature:** F-PROP-01 — Listing workflow integration
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-01-property-record](../../milestones/M-PROP-01-property-record.md)
> **Linear:** LIN-XXX (unassigned)
> **Size:** M
> **Created:** 2026-10-29 | **Closed:** —
> **Prerequisites:** None
> **Approved source:** Mockups/listing-workflow-v1/REFINEMENT.md and P1-ESSENTIALS.md; photo ranking excluded by user approval.

---

## Story

*As a* solo real estate agent preparing listings in India, the US, UK or Canada
*I want* to enter and review structured listing facts
*So that* I can reuse accurate property information without silently accepting guesses

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** When shared/listingWorkflow.ts receives a listing for IN, US, GB or CA, it retains country, ISO currency, area value/unit, sale/rent intent, numeric amount and rental period separately; formatting preserves 0 without treating it as missing, and switching sale/rent clears the previous amount while switching rental period retains the amount.
- [ ] **AC2 [error-path]:** When a negative/non-finite price or area, unsupported currency/unit, missing rent period or unrecognized import value is submitted, validation returns field-specific findings and does not change the caller record; unknown values remain empty and are never invented.
- [ ] **AC3 [edge-case]:** When local pasted text contains multiple property identities or conflicting price candidates, reviewed import blocks mixed-property input or requires an explicit price choice; each proposed fact has its original source snippet and selection state; agent/contact text is suggestion-only and is not automatically selected.
- [ ] **AC4 [concurrent]:** When a fact changed after the import review baseline was captured, committing selected reviewed candidates rejects the changed fact instead of silently overwriting it; unselected and unchanged facts retain their exact prior values.

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
  - `shared/listingWorkflow.ts` — Define pure listing, structured pricing, provenance and reviewed-import contracts
  - `api/tests/listing/listing-workflow.spec.ts` — Contract-first shared pricing, validation and reviewed import tests
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-002/STORY.md` — Record AC/test evidence and implementation status
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-002/TASKS.md` — Record task progress and verification
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-002/scaffold.json` — Maintain exact scope scaffold

---

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
Stack: React 18 + Vite, NestJS 11, Prisma 6, Tailwind v3 + shadcn/ui, Wouter router, Zustand + React Query.
Read AGENTS.md, this story, TASKS.md, scaffold.json and parent ARCHITECTURE.mmd / ENV.yaml.
Story: US-PROP-002 — Structured global listing and reviewed text import
Prerequisites: None
As a solo real estate agent, I want to enter and review structured listing facts so that I can reuse accurate property information without silently accepting guesses.
Acceptance Criteria:
AC1 [happy-path]: When shared/listingWorkflow.ts receives a listing for IN, US, GB or CA, it retains country, ISO currency, area value/unit, sale/rent intent, numeric amount and rental period separately; formatting preserves 0 without treating it as missing, and switching sale/rent clears the previous amount while switching rental period retains the amount.
AC2 [error-path]: When a negative/non-finite price or area, unsupported currency/unit, missing rent period or unrecognized import value is submitted, validation returns field-specific findings and does not change the caller record; unknown values remain empty and are never invented.
AC3 [edge-case]: When local pasted text contains multiple property identities or conflicting price candidates, reviewed import blocks mixed-property input or requires an explicit price choice; each proposed fact has its original source snippet and selection state; agent/contact text is suggestion-only and is not automatically selected.
AC4 [concurrent]: When a fact changed after the import review baseline was captured, committing selected reviewed candidates rejects the changed fact instead of silently overwriting it; unselected and unchanged facts retain their exact prior values.
Out of Scope: AI Assistant, live connectors, photo ranking/roles/packs, route default changes, billing or legacy-editor redesign.
Primary files to touch (do NOT touch other files):
shared/listingWorkflow.ts
api/tests/listing/listing-workflow.spec.ts
docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-002/STORY.md
docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-002/TASKS.md
docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-002/scaffold.json
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
| TC-PROP-002-01 | Unit | P0 | happy-path: When shared/listingWorkflow.ts receives a listing for IN,… | 🔲 | |
| TC-PROP-002-02 | Unit | P0 | error-path: When a negative/non-finite price or area, unsupported cur… | 🔲 | |
| TC-PROP-002-03 | Unit | P1 | edge-case: When local pasted text contains multiple property identit… | 🔲 | |
| TC-PROP-002-04 | Integration | P1 | concurrent: When a fact changed after the import review baseline was … | 🔲 | |

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
