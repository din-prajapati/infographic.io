# Story Card — US-PROP-001

> **Status:** 🔲 Not Started — reconciled 2026-11-13; certification and implementation pending
> **Feature:** F-PROP-01 — Listing workflow integration
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-01-property-record](../../milestones/M-PROP-01-property-record.md)
> **Linear:** LIN-XXX (unassigned)
> **Size:** M
> **Created:** 2026-10-29 | **Closed:** —
> **Prerequisites:** US-PROP-002
> **Approved source:** Mockups/listing-workflow-v1/REFINEMENT.md and P1-ESSENTIALS.md; photo ranking excluded by user approval.

---

## Story

*As a* solo real estate agent preparing listings in India, the US, UK or Canada
*I want* to save reusable property records and my agent/brand profile
*So that* my listing work survives sessions and stays within the authorized account

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** When an authenticated account creates, lists, reads or updates /api/v1/properties, the saved Property JSON record round-trips the shared listing contract with server-derived organization ownership and an incrementing version; GET and PUT /api/v1/listing-profiles round-trip the caller personal agent/brand profile.
- [ ] **AC2 [error-path]:** When property/profile input is invalid the API responds 400 without a write; when persistence fails it returns a recoverable error and the client retains pending inputs, never reporting Saved before acknowledgement.
- [ ] **AC3 [security]:** When an unauthenticated caller accesses either route family it receives 401; when an account accesses another organization Property it receives 404 and no write occurs; a supplied organizationId or userId cannot override server ownership; another user personal ListingProfile cannot be read or overwritten.
- [ ] **AC4 [concurrent]:** When two property updates carry the same expectedVersion, exactly one succeeds and increments version while the stale update returns 409 without overwriting the accepted record; changing the authenticated account cannot reuse a previous account profile or property response.

---

## API data contract

`SavedProperty = { id, version, record, createdAt, updatedAt }`. The Property JSON uses shared/listingWorkflow.ts. Profile is per authenticated user; version 0 denotes no saved profile and permits initial creation. Writes carry expectedVersion; no provider credentials or live data access is involved. Property mutation requests up to 12MB support the bounded manual-media record; route-scoped parser must accept a real authenticated payload larger than 100KB and reject over-limit requests without a write. Use existing Nest auth and error conventions.

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
  - `api/prisma/schema.prisma` — Add organization-scoped Property JSON record/version and user-scoped ListingProfile
  - `api/prisma/migrations/20261113000000_listing_workspace/migration.sql` — Additive listing workspace migration
  - `api/src/modules/properties/properties.module.ts` — Register properties/profile service and controllers
  - `api/src/modules/properties/properties.controller.ts` — Authenticated /api/v1/properties routes
  - `api/src/modules/properties/listing-profiles.controller.ts` — Authenticated /api/v1/listing-profiles routes
  - `api/src/modules/properties/properties.service.ts` — Scoped CRUD, profile ownership and atomic expectedVersion updates
  - `api/src/modules/properties/dto/property.dto.ts` — Validate property and profile mutation boundaries
  - `api/src/app.module.ts` — Register PropertiesModule
  - `client/src/lib/listingApi.ts` — Authenticated typed property/profile API client
  - `api/tests/properties/properties.service.spec.ts` — Mock-based ownership, validation and concurrency contracts
  - `api/tests/properties/properties.controller.spec.ts` — HTTP boundary guard and DTO contracts
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-001/STORY.md` — Record AC/test evidence and implementation status
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-001/TASKS.md` — Record task progress and verification
  - `docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-001/scaffold.json` — Maintain exact scope scaffold

---


- `api/src/main.ts` — Route-scoped 12MB listing JSON parser before default Nest parsing
- `api/tests/properties/properties.http.spec.ts` — Real HTTP >100KB listing request, authentication and body-limit tests

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
Stack: React 18 + Vite, NestJS 11, Prisma 6, Tailwind v3 + shadcn/ui, Wouter router, Zustand + React Query.
Read AGENTS.md, this story, TASKS.md, scaffold.json and parent ARCHITECTURE.mmd / ENV.yaml.
Story: US-PROP-001 — Authenticated saved properties and personal listing profiles
Prerequisites: US-PROP-002
As a solo real estate agent, I want to save reusable property records and my agent/brand profile so that my listing work survives sessions and stays within the authorized account.
Acceptance Criteria:
AC1 [happy-path]: When an authenticated account creates, lists, reads or updates /api/v1/properties, the saved Property JSON record round-trips the shared listing contract with server-derived organization ownership and an incrementing version; GET and PUT /api/v1/listing-profiles round-trip the caller personal agent/brand profile.
AC2 [error-path]: When property/profile input is invalid the API responds 400 without a write; when persistence fails it returns a recoverable error and the client retains pending inputs, never reporting Saved before acknowledgement.
AC3 [security]: When an unauthenticated caller accesses either route family it receives 401; when an account accesses another organization Property it receives 404 and no write occurs; a supplied organizationId or userId cannot override server ownership; another user personal ListingProfile cannot be read or overwritten.
AC4 [concurrent]: When two property updates carry the same expectedVersion, exactly one succeeds and increments version while the stale update returns 409 without overwriting the accepted record; changing the authenticated account cannot reuse a previous account profile or property response.
Out of Scope: AI Assistant, live connectors, photo ranking/roles/packs, route default changes, billing or legacy-editor redesign.
Primary files to touch (do NOT touch other files):
api/prisma/schema.prisma
api/prisma/migrations/20261113000000_listing_workspace/migration.sql
api/src/modules/properties/properties.module.ts
api/src/modules/properties/properties.controller.ts
api/src/modules/properties/listing-profiles.controller.ts
api/src/modules/properties/properties.service.ts
api/src/modules/properties/dto/property.dto.ts
api/src/app.module.ts
client/src/lib/listingApi.ts
api/tests/properties/properties.service.spec.ts
api/tests/properties/properties.controller.spec.ts
docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-001/STORY.md
docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-001/TASKS.md
docs/agile/epics/phase-1.5-foundation-v3/EPIC-PROP-01/stories/US-PROP-001/scaffold.json
api/src/main.ts
api/tests/properties/properties.http.spec.ts
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
| TC-PROP-001-01 | Unit | P0 | happy-path: When an authenticated account creates, lists, reads or up… | 🔲 | |
| TC-PROP-001-02 | Unit | P0 | error-path: When property/profile input is invalid the API responds 4… | 🔲 | |
| TC-PROP-001-03 | Unit | P1 | security: When an unauthenticated caller accesses either route fami… | 🔲 | |
| TC-PROP-001-04 | Integration | P1 | concurrent: When two property updates carry the same expectedVersion,… | 🔲 | |

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
