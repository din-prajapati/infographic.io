# Tasks — US-PROP-001

> **Story:** [STORY.md](./STORY.md) — Authenticated saved properties and personal listing profiles
> **Branch:** `codex/v3-arrange-opus`
> **PR:** #_____
> **PR scope:** Authenticated saved properties and personal listing profiles; no AI Assistant or live providers.
> **Prerequisites:** US-PROP-002

## Four-Pillars Pre-flight

- [x] **Brain** — Read STORY.md and approved Mockups/listing-workflow-v1/REFINEMENT.md / P1-ESSENTIALS.md; resolve each AC to observable contract assertions before changing code.
- [x] **Muscle** — Read every Primary file below, or its existing dependency if new; verify actual V3 runtime import paths and source ownership; do not alter unrelated work.
- [x] **Map** — Read `../../ARCHITECTURE.mmd`, trace Property/profile → pending record → Apply → artwork/applied snapshot → template/design persistence → review → existing PNG renderer.
- [x] **Env** — Read `../../ENV.yaml` and all scaffold.json rules_loaded; use existing local credentials without logging them; check localhost:5000/3001 and document actual availability. Schema deployment is separate from generating migration source.

## Primary files to touch (scope lock)

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


- `api/src/main.ts` — Route-scoped 12MB listing JSON parser before default Nest parsing
- `api/tests/properties/properties.http.spec.ts` — Real HTTP >100KB listing request, authentication and body-limit tests

## Tasks

### T1 — Persistence schema and versioned service contracts

- [ ] Define service mock contracts for JSON roundtrip, org/property and user/profile scope, expectedVersion and version=0 create; implement schema/service and verify as one green unit.
- `api/prisma/schema.prisma`
- `api/prisma/migrations/20261113000000_listing_workspace/migration.sql`
- `api/src/modules/properties/properties.service.ts`
- `api/tests/properties/properties.service.spec.ts`

**Effort:** S


### T2 — Authenticated HTTP boundary and large-body behavior

- [ ] Define HTTP/guard/DTO assertions first; implement authenticated routes and route-scoped bounded parser; prove real >100KB request succeeds and invalid/over-limit/unauthorized inputs do not write.
- `api/src/modules/properties/properties.module.ts`
- `api/src/modules/properties/properties.controller.ts`
- `api/src/modules/properties/listing-profiles.controller.ts`
- `api/src/modules/properties/dto/property.dto.ts`
- `api/src/app.module.ts`
- `api/src/main.ts`
- `api/tests/properties/properties.controller.spec.ts`
- `api/tests/properties/properties.http.spec.ts`

**Effort:** S


### T3 — Typed authenticated property/profile client

- [ ] Implement existing API transport/error conventions with version-aware typed requests; coordinate shared contract and preserve pending caller inputs on failure.
- `client/src/lib/listingApi.ts`

**Effort:** S

### T4 — Verify and record evidence

- [ ] Run required focused/full gates and record exact AC/TC findings in STORY.md; keep unchecked items honest.
- [ ] Update TASKS.md and scaffold.json only as needed; Story acceptance text remains certification-locked.
- [ ] Root coordinates all commits. Define tests before implementation inside each task, then commit the passing test+source group; no separate red-test commit is required. Do not revert other agents' changes.

**Effort:** S

## Test Commands

```bash
npm run check
npm run test:unit
```

Gate 2: for UI stories verify actual V3 at 375px and 1440px in both themes, keyboard/focus, layout and no console errors. Gate 4: for US-PROP-001 verify authenticated property/profile routes including 401, cross-org 404 and stale 409. Gate 3: `npx playwright test e2e/v3-listing-workflow.spec.ts` for final US-EDIT-021 journey. Gates not applicable to pure shared helpers must be documented with this reason; never silently skip a required check. Live DB smoke is required before reporting persistent listing capability verified.

## Anti-patterns

- Copying the mockup storage/runtime as production persistence.
- Hydrating pending listing facts from canvas/custom text on reopen.
- Touching outside this Primary list without reconciling scope and certification first.
- Treating browser-local recovery as a successful backend save.



## Existing database compatibility (approved root coordination)
- Historical migrations restored byte-exact: api/prisma/migrations/20261030104842_add_property_model/migration.sql and api/prisma/migrations/20261030135830_prop_price_fields/migration.sql.
- Preserve legacy Property columns and Infographic.propertyId relation; add nullable canonical record without destructive rewrite. Read legacy records through compatibility serializer.


## Local integration verification — 2026-11-13
Implementation integrated on codex/v3-arrange-opus. Full Gate1, focused/new browser and real database evidence are recorded in docs/research/2026-11-13-V3-LISTING-IMPLEMENTATION.md. Story closure/merge is not claimed; broad candidate visual/accessibility regression remains pre-merge work. Root coordinates commits; no failing-test-only commits.
