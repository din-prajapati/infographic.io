---
title: Tasks — US-PROP-001
type: tasks
tags: [orion, prop, phase-1.5]
updated: 2026-10-29
---

# Tasks — US-PROP-001

> **Story:** [US-PROP-001](./STORY.md) — Property as a saved record (backend)
> **Branch:** `feat/prop/m-prop-01-property-record`
> **PR:** #_____
> **PR scope:** Prisma `Property` model + migration + org-scoped Property endpoints + `propertyId` on design responses. No client files.

---

## Four-Pillars Pre-flight

- [ ] **Brain** — Read the `Organization` and `Infographic` models in `api/prisma/schema.prisma`. Confirm (a) `Infographic.organizationId` comes from `req.user.organizationId || req.user.id`; (b) the canvas design lives in the `propertyData` JSON — `propertyId` is a separate FK column, not a key in that JSON; (c) services use the `prisma` singleton, not an injected `PrismaService`.
- [ ] **Muscle** — In `designs.service.ts` confirm `save`, `findOne` and `findAll` don't return `propertyId` today, and that `CreateDesignDto` has no `propertyId`.
- [ ] **Map** — `npx prisma migrate status --schema=api/prisma/schema.prisma`: note the last migration and confirm no `Property` table exists. Remember staging DB = dev DB (BL-37).
- [ ] **Env** — `npm run dev` starts; `npm run check` is clean; `GET /api/v1/designs` returns 200 with a JWT.

---

## Tasks

### T1 — Schema + migration
- [ ] Add `Property` (AC1 fields, `@@index([organizationId])`), `Organization.properties`, `Infographic.propertyId` + relation + `@@index([propertyId])`.
- [ ] `npx prisma migrate dev --name add_property_model --schema=api/prisma/schema.prisma` — generated SQL only.
- [ ] `npx prisma generate`; `npm run check` clean.

**ACs:** AC1, AC8 · **Effort:** S

### T2 — `PropertiesService`
- [ ] `create(orgId, dto)` — `orgId` from the caller only.
- [ ] `findAll(orgId)` ordered by `updatedAt desc`.
- [ ] `findOne(id, orgId)` via `findFirst({ where: { id, organizationId } })` → `NotFoundException` if null (never reveal "other org").
- [ ] `update(id, orgId, dto)` — `findOne` first, then update.

**ACs:** AC2–AC5 · **Effort:** S

### T3 — Controller, DTOs, module, registration
- [ ] `CreatePropertyDto` / `UpdatePropertyDto` — all optional, class-validator types (`@IsInt` for beds/baths, `@IsArray @IsString({each})` for arrays).
- [ ] `PropertiesController` (`@Controller('properties')`, JWT guard on every handler): `POST` (201), `GET`, `GET :id`, `PUT :id`.
- [ ] `PropertiesModule`; add it to `app.module.ts` imports.

**ACs:** AC2–AC5, AC9 · **Effort:** S

### T4 — Designs: expose and guard `propertyId`
- [ ] `CreateDesignDto`: `@IsString() @IsOptional() propertyId?`.
- [ ] `save()`: when `dto.propertyId` is set, check it belongs to the caller's org (404 otherwise); carry the existing value forward when omitted.
- [ ] Add `propertyId` to the create/update/findAll/findOne response mappings.

**ACs:** AC6, AC7 · **Effort:** S

### T5 — Unit tests
- [ ] `api/tests/properties/properties.service.spec.ts` (mock `prisma.property.*` with `vi.hoisted`, as in the designs spec): org id from argument; `findAll` filter; `findOne` other-org → 404 and no update; `update` other-org → 404.

**ACs:** AC5 · **Effort:** S

### T6 — Verify
- [ ] `npm run check`, `npm run test:unit`.
- [ ] Manual TC-PROP-001-01 to -06 with two accounts in different orgs; record results in STORY.md.

---

## File → Task Map

| File | Task | Change type |
|---|:--:|---|
| `api/prisma/schema.prisma` | T1 | model + FK |
| `api/prisma/migrations/<ts>_add_property_model/` | T1 | new (generated) |
| `api/src/modules/properties/**` | T2, T3 | new |
| `api/src/app.module.ts` | T3 | register module |
| `api/src/modules/designs/dto/create-design.dto.ts` | T4 | optional `propertyId` |
| `api/src/modules/designs/services/designs.service.ts` | T4 | expose + org guard |
| `api/tests/properties/properties.service.spec.ts` | T5 | new |

---

## Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/properties/properties.service.spec.ts --reporter=verbose
```

---

## Anti-patterns for this story

- **Adding `PrismaService` to `PropertiesModule.providers`.** `DatabaseModule` is `@Global()` and services use the `prisma` singleton.
- **Hand-writing the migration SQL.** Let `prisma migrate dev` generate it — `String[]` columns and the migration checksum are easy to get wrong.
- **Storing `propertyId` inside the `propertyData` JSON.** It is a real FK column, indexed and with referential integrity.

---

*Tasks created: 2026-10-29*
