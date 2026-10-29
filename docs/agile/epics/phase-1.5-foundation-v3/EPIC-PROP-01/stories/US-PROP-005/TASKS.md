---
title: Tasks — US-PROP-005
type: tasks
tags: [orion, prop, templates, versioning]
updated: 2026-10-29
---

# Tasks — US-PROP-005

> **Story:** [US-PROP-005](./STORY.md) — Template version and proven flag
> **Branch:** `feat/prop/m-prop-03-template-contract`
> **PR:** #_____
> **PR scope:** `version` + `proven` on curated canvas templates (JSON), seed write/increment, API exposure, `proven` never accepted from requests, design source-template provenance, unit test. No migration.

---

## Four-Pillars Pre-flight

- [ ] **Brain** — Read `designs.service.ts`: why `Infographic.templateId` is a placeholder (see `save()` and `getDefaultTemplateId()` in the seed); where `save()` writes `canvasDesign`; how `findAdminCuratedTemplates()` differs from `findAll()`.
- [ ] **Muscle** — `npx tsx api/scripts/seed-premium-templates.ts --dry-run` runs; `GET /api/v1/canvas-templates?visibility=admin_curated` returns the curated rows; `canvasDesign.version` is absent today.
- [ ] **Map** — Look at one canvas-template row's `propertyData.canvasDesign` in Prisma Studio.
- [ ] **Env** — `npm run dev`, `npm run check`, `npm run test:unit` green; no migration file added on this branch.

---

## Tasks

### T1 — Seed data fields
- [ ] `version: number`, `proven: boolean` on `StarterCanvasTemplate`; `1` / `true` on every curated template. `npm run check`.

**ACs:** AC1 · **Effort:** XS

### T2 — Seed script
- [ ] Create: write `version`, `proven`. `--refresh`: `version = (existing ?? 1) + 1`, canvas-template rows only. Dry-run prints "version N → N+1"; summary shows both.

**ACs:** AC2 · **Effort:** S

### T3 — Expose in `findAdminCuratedTemplates()`
- [ ] Map `version` and `proven` (default `false`); rows seeded before this story return no `version` until the next `--refresh` (comment it).

**ACs:** AC3 · **Effort:** XS

### T4 — `proven` stripped; source-template provenance
- [ ] DTO: optional `sourceTemplateId` (`@IsString`), `sourceTemplateVersion` (`@IsInt @Min(1)`); no `proven`.
- [ ] `save()`: never write `proven` from the request; store `sourceTemplateId`/`Version` on create; return them from `findOne`/`findAll`.

**ACs:** AC4, AC5 · **Effort:** S

### T5 — Unit test
- [ ] `api/tests/canvas/template-version-proven.spec.ts`: every curated template `proven === true`, integer `version ≥ 1`, none undefined.

**ACs:** AC1 · **Effort:** XS

### T6 — Manual check
- [ ] `--refresh --dry-run`, then `--refresh` on dev; TC-PROP-005-01 to -03; record in STORY.md.

**ACs:** AC2–AC5 · **Effort:** XS

---

## File → Task Map

| File | Task | Change type |
|---|:--:|---|
| `api/scripts/data/premium-templates.data.ts` | T1 | fields |
| `api/scripts/seed-premium-templates.ts` | T2 | write + increment |
| `api/src/modules/designs/services/designs.service.ts` | T3, T4 | expose, strip, provenance |
| `api/src/modules/designs/dto/create-design.dto.ts` | T4 | provenance fields |
| `api/tests/canvas/template-version-proven.spec.ts` | T5 | new |

---

## Test Commands

```bash
npm run check
npm run test:unit
cd api && npx vitest run tests/canvas/template-version-proven.spec.ts --reporter=verbose
npx tsx api/scripts/seed-premium-templates.ts --refresh --dry-run
```

---

## Anti-patterns for this story

- **Adding a Prisma migration.** These fields live in JSON; US-PROP-001 already adds a migration in this wave, and a stray second one muddles the deploy history.
- **Adding `proven` to `CreateDesignDto`.** Its absence is the guard; an optional DTO field invites a future `...dto` spread to persist it.
- **Widening the `--refresh` query beyond `aiModel: 'canvas-template'`.** A name match alone could overwrite a user's design that shares a template's name.

---

*Tasks created: 2026-10-29*
