---
title: Story Card — US-PROP-005
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-PROP-005 — Template version and proven flag

> **Status:** 🔲 Not Started — drafted 2026-10-29. Harden with `/new-story` (test cases, Four-Pillars pre-flight, TASKS.md) before implementing.
> **Epic:** [EPIC-PROP-01](../../EPIC.md)
> **Milestone:** [M-PROP-03-template-contract](../../milestones/M-PROP-03-template-contract.md)
> **Size:** S
> **Depends on:** —
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* the product owner curating templates
*I want* templates to carry a version and a "proven" mark, and designs to remember which version they came from
*So that* kits can later be built only from stable, proven templates, and changing a template never silently changes existing designs

---

## Acceptance Criteria

> Drafted from the 2026-10-29 V3 gap analysis. File paths are the expected touch points, to be confirmed by `/new-story`.

- [ ] **AC1 [happy-path]:** `Template` gains `version` (int) and `proven` (boolean, admin-only); a design created from a template stores `templateId` + `templateVersion`.
- [ ] **AC2 [happy-path]:** Re-seeding a template with changed content bumps its version; existing designs keep their old version reference.
- [ ] **AC3 [happy-path]:** The seed marks the curated premium templates as proven, and the Design tab's Look picker (US-EDIT-022) lists proven templates for the current format.
- [ ] **AC4 [security]:** Only an admin path can set `proven`; the public template API cannot.

---

## Out of Scope

- Template marketplace
- Versioning user-saved templates
- Kit definitions (Phase 2)

---

## Engineering / PR

- **Branch:** milestone branch (see PROJECT_CONTEXT.yaml `git.branch_format`)
- **PR:** #_____
- **Expected files:**
  - `api/prisma/schema.prisma` — Template.version, Template.proven
  - `api/scripts/seed-premium-templates.ts` — version bump + proven
  - `api/src/modules/templates/*` — expose version/proven
  - `api/src/modules/designs/*` — store templateVersion

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] Test cases written by `/new-story`, run and recorded
- [ ] Gate 1 passes · Gate 2 (frontend) · Gate 4 (backend) as applicable
- [ ] PR merged
- [ ] STORY.md status updated to ✅ Done

---

*Story drafted: 2026-10-29*
