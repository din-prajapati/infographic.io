---
title: Story Card — US-PROP-005
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-PROP-005 — Template version and proven flag

> **Status:** 🔲 Not Started — hardened 2026-10-29 by /new-story
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-03-template-contract](../../milestones/M-PROP-03-template-contract.md)
> **Size:** S
> **Depends on:** — (parallel with US-PROP-004 on the same milestone branch)
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md)

---

## Story

*As* the product owner curating templates
*I want* templates to carry a version and a "proven" mark, and designs to remember which template version they came from
*So that* kits can later be built only from stable, proven templates, and changing a template never silently changes existing designs

---

## Storage decision

The curated gallery templates are `Infographic` rows with `aiModel: 'canvas-template'`; their metadata lives in
`propertyData.canvasDesign` JSON. `version` (int) and `proven` (bool) belong **in that JSON — no Prisma migration**. The
`Template` Prisma model is the AI generation template-selection table, not the gallery, so it is not touched.

`Infographic.templateId` always points at the default `Template` row (a constraint placeholder set in `DesignsService.save()`),
so a design's source canvas template is recorded as `canvasDesign.sourceTemplateId` (the canvas-template row's id) and
`canvasDesign.sourceTemplateVersion` in the design's own JSON.

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** `StarterCanvasTemplate` in `api/scripts/data/premium-templates.data.ts` gains `version: number` and `proven: boolean`; all curated premium templates have `version: 1` and `proven: true`. `npm run check` and `npm run test:unit` pass.
- [ ] **AC2 [happy-path]:** `seed-premium-templates.ts` writes `version` and `proven` on create, and on `--refresh` writes `version + 1` to each refreshed canvas-template row (only `aiModel: 'canvas-template'` rows); a user design created earlier with `sourceTemplateVersion: 1` still has `1` afterwards.
- [ ] **AC3 [happy-path]:** `GET /api/v1/canvas-templates?visibility=admin_curated` returns numeric `version` and boolean `proven` on every item; the curated items show `proven: true` and `version ≥ 1`.
- [ ] **AC4 [security]:** `POST` / `PUT /api/v1/canvas-templates` with `proven: true` in the body still respond 200/201, but the stored `canvasDesign` has `proven` absent or `false` — only the seed script can set it.
- [ ] **AC5 [happy-path]:** `POST /api/v1/designs` with `sourceTemplateId` and `sourceTemplateVersion: 1` stores both in `canvasDesign`, and `GET /api/v1/designs/:id` returns them.

---

## Out of Scope

- The Look picker — US-EDIT-022 filters by `proven`; this story only exposes it
- Versioning user-saved templates
- Any Prisma migration
- Kit definitions (EPIC-KIT-01, Phase 2)

---

## Engineering / PR

- **Branch:** `feat/prop/m-prop-03-template-contract`
- **PR:** #_____
- **Primary files touched:**
  - `api/scripts/data/premium-templates.data.ts` — `version`, `proven` on the interface and curated templates
  - `api/scripts/seed-premium-templates.ts` — write on create; increment on `--refresh`; show in dry-run and summary
  - `api/src/modules/designs/services/designs.service.ts` — expose `version`/`proven` in `findAdminCuratedTemplates()`; never persist `proven` from a request; store and return `sourceTemplateId`/`sourceTemplateVersion`
  - `api/src/modules/designs/dto/create-design.dto.ts` — optional `sourceTemplateId`, `sourceTemplateVersion` (no `proven`)
  - `api/tests/canvas/template-version-proven.spec.ts` — new

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Context: Buildographic (code name InfographicAI) — NestJS API; curated canvas templates are Infographic rows
(aiModel 'canvas-template') with metadata in propertyData.canvasDesign JSON. See CLAUDE.md.

Story: US-PROP-005 — Template version and proven flag

Acceptance Criteria:
AC1: StarterCanvasTemplate gains version + proven; curated templates version 1, proven true.
AC2: Seed writes both on create; --refresh increments version on canvas-template rows only; user designs untouched.
AC3: GET /api/v1/canvas-templates?visibility=admin_curated returns version + proven on every item.
AC4: POST/PUT /api/v1/canvas-templates never persists proven from the request body (still 200/201).
AC5: POST /api/v1/designs stores sourceTemplateId + sourceTemplateVersion in canvasDesign; GET returns them.

Constraints:
- NO Prisma migration — version/proven live in canvasDesign JSON. Do not touch the Template Prisma model (it is AI template
  selection, not the gallery). US-PROP-001 adds a migration in the same wave; don't add another.
- Infographic.templateId is a placeholder to the default Template row — record provenance as canvasDesign.sourceTemplateId/Version.
- Do not add proven to CreateDesignDto, and never spread the DTO into canvasDesign.

Out of Scope: Look picker (US-EDIT-022) · versioning user templates · any migration · kits.

Primary files (do NOT touch others): api/scripts/data/premium-templates.data.ts · api/scripts/seed-premium-templates.ts ·
api/src/modules/designs/services/designs.service.ts · api/src/modules/designs/dto/create-design.dto.ts ·
api/tests/canvas/template-version-proven.spec.ts (new)

Rules: touch only these files; run `npm run check` and `npm run test:unit`; report files changed, ACs checked, test output.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-PROP-005-01 | Manual | P0 | After the seed, `GET /api/v1/canvas-templates?visibility=admin_curated` returns every curated item with `proven: true` and `version ≥ 1` | 🔲 | |
| TC-PROP-005-02 | Manual | P0 | `POST /api/v1/canvas-templates` with `proven: true` → response and stored row have `proven` absent or `false` | 🔲 | |
| TC-PROP-005-03 | Manual | P1 | A design created with `sourceTemplateVersion: 1`, then `seed --refresh`, then `GET` → still `1` | 🔲 | |
| TC-PROP-005-04 | Unit | P1 | Every curated entry has `proven === true` and an integer `version ≥ 1` — `template-version-proven.spec.ts` | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ · all test cases run and recorded
- [ ] `npm run check` · `npm run test:unit` pass
- [ ] Seed `--refresh` run on dev/staging, then production after merge (one operator command at a time, verified at the data layer)
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) fully checked ✅ · STORY.md status `✅ Done`

---

## Implementation Update (log)

> Appended by code-agent during/after implementation. Newest entries on top.

### 2026-10-29 — hardened by /new-story
- Found against the code: the draft put `version`/`proven` on the `Template` Prisma model — the wrong table. Gallery templates are `Infographic` rows; both fields go in `canvasDesign` JSON, with no migration.
- "Design stores templateId" was ambiguous: `Infographic.templateId` is a placeholder, so provenance is `canvasDesign.sourceTemplateId/Version`.

---

*Story drafted: 2026-10-29 · hardened: 2026-10-29*
