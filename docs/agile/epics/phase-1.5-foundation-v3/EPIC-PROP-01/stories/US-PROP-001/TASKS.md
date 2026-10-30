---
title: Tasks — US-PROP-001
type: tasks
tags: [orion, prop, phase-1.5]
updated: 2026-10-29
---

# Tasks — US-PROP-001

> **Story:** [US-PROP-001](./STORY.md) — Property as a saved record (backend)
> **Branch:** `feat/prop/m-01-property-record`
> **PR:** #_____
> **PR scope:** Prisma `Property` model + migration + org-scoped Property endpoints + `propertyId` on design responses. No client files.

---

## Four-Pillars Pre-flight

- [x] **Brain** — Read the `Organization` and `Infographic` models in `api/prisma/schema.prisma`. Confirm (a) `Infographic.organizationId` comes from `req.user.organizationId || req.user.id`; (b) the canvas design lives in the `propertyData` JSON — `propertyId` is a separate FK column, not a key in that JSON; (c) services use the `prisma` singleton, not an injected `PrismaService`.
- [x] **Muscle** — In `designs.service.ts` confirm `save`, `findOne` and `findAll` don't return `propertyId` today, and that `CreateDesignDto` has no `propertyId`.
- [x] **Map** — `npx prisma migrate status --schema=api/prisma/schema.prisma`: note the last migration and confirm no `Property` table exists. Remember staging DB = dev DB (BL-37).
- [x] **Env** — `npm run dev` starts; `npm run check` is clean; `GET /api/v1/designs` returns 200 with a JWT.

---

## Tasks

### T1 — Schema + migration
- [x] Add `Property` (AC1 fields, `@@index([organizationId])`), `Organization.properties`, `Infographic.propertyId` + relation + `@@index([propertyId])`.
- [x] `npx prisma migrate dev --name add_property_model --schema=api/prisma/schema.prisma` — generated SQL only. → `20261030104842_add_property_model`, applied to the shared dev/staging DB 2026-10-30 (no drift; 191 Infographic rows, 0 with propertyId).
- [x] `npx prisma generate`; `npm run check` clean.

**ACs:** AC1, AC8 · **Effort:** S

### T2 — `PropertiesService`
- [x] `create(orgId, dto)` — `orgId` from the caller only.
- [x] `findAll(orgId)` ordered by `updatedAt desc`.
- [x] `findOne(id, orgId)` via `findFirst({ where: { id, organizationId } })` → `NotFoundException` if null (never reveal "other org").
- [x] `update(id, orgId, dto)` — `findOne` first, then update.

**ACs:** AC2–AC5 · **Effort:** S

### T3 — Controller, DTOs, module, registration
- [x] `CreatePropertyDto` / `UpdatePropertyDto` — all optional, class-validator types (`@IsInt` for beds/baths, `@IsArray @IsString({each})` for arrays).
- [x] `PropertiesController` (`@Controller('properties')`, JWT guard on every handler): `POST` (201), `GET`, `GET :id`, `PUT :id`.
- [x] `PropertiesModule`; add it to `app.module.ts` imports.

**ACs:** AC2–AC5, AC9 · **Effort:** S

### T4 — Designs: expose and guard `propertyId`
- [x] `CreateDesignDto`: `@IsString() @IsOptional() propertyId?`.
- [x] `save()`: when `dto.propertyId` is set, check it belongs to the caller's org (404 otherwise); carry the existing value forward when omitted.
- [x] Add `propertyId` to the create/update/findAll/findOne response mappings.

**ACs:** AC6, AC7 · **Effort:** S

### T5 — Unit tests
- [x] `api/tests/properties/properties.service.spec.ts` (mock `prisma.property.*` with `vi.hoisted`, as in the designs spec): org id from argument; `findAll` filter; `findOne` other-org → 404 and no update; `update` other-org → 404.
- [x] `api/tests/designs/designs.service.spec.ts`: TC-PROP-001-07 — other-org `propertyId` on create and update → `NotFoundException`, nothing written; own-org → saved.

**ACs:** AC5 · **Effort:** S

### T6 — Verify
- [x] `npm run check`, `npm run test:unit`.
- [x] Manual TC-PROP-001-01 to -06 with two accounts in different orgs; record results in STORY.md.

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
| `api/tests/designs/designs.service.spec.ts` | T5 | cross-org `propertyId` cases (AC6) |

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
