---
title: Tasks — US-EDIT-006
type: tasks
tags: [orion, edit, canvas, brand]
updated: 2026-08-26
---

# Tasks — US-EDIT-006

> **Story:** [US-EDIT-006](./STORY.md) — Brand layers from existing data (logo + licence)
> **Branch:** `feat/edit/m-02-brand-layers`
> **PR:** #_____
> **PR scope:** Place an agent's saved logo and licence on generated designs as real, movable
> canvas layers. No prompt changes, no extraction changes, no credit path touched.

---

## Four-Pillars Pre-flight

Fill before writing code. A story without this is not ready to implement.

- [ ] **Brain** — read `M-EDIT-02` §"Which mechanism, when" and the
      [findings doc](../../../../../PRD/2026-08-26-compose-forward-findings.md). Confirm you can
      state why brand furniture is composed forward while typography stays with extraction.
- [ ] **Muscle** — confirm `useAgentStore.agent.logoPreview` / `.license` are populated in the
      running app (Agent tab in the right sidebar) before writing placement code against them.
- [ ] **Map** — confirm the id-prefix provenance convention in `canvasState.ts`
      (`composed-`, `ai-gen-`, template `ps-*`) and that `brand-` is unused.
- [ ] **Env** — `npm run dev` up; an account with a saved logo; no Ideogram credit needed for
      TC-03 (no generation required to assert the empty case).

---

## Tasks

### T1 — Decide placement strategy, write it down

- [ ] Choose Option A (safe-margin heuristic) or B (wire `LayoutPlannerService`) per STORY.md
      §"Open decision". **Default to A.**
- [ ] Record the decision and its reason in this file before any implementation.
- [ ] Define the seam so Option B can replace A later without touching callers.

**Effort:** XS

---

### T2 — `placeBrandLayers()` in `canvasState.ts`

- [ ] New exported function; reads `useAgentStore` state, returns the elements it placed.
- [ ] Logo → `ImageElement` with a `brand-logo-` id (AC1, AC4).
- [ ] Licence → `TextElement` with a `brand-license-` id (AC2, AC4).
- [ ] Absent asset → place nothing; never a placeholder (AC3).
- [ ] Never throws on malformed/empty input (TC-06).

**Effort:** S

---

### T3 — Call it when a variation lands

- [ ] Invoke after `loadAiVariationToCanvas` in `RightSidebar.tsx`.
- [ ] Placement must not disturb the AI raster's z-order or the canvas dimensions.
- [ ] Confirm no network call is issued by the placement path (AC5).

**Effort:** S

---

### T4 — Verify

- [ ] Unit: `placeBrandLayers()` absent-asset matrix (TC-06).
- [ ] E2E: `e2e/us-edit-006-brand-layers.spec.ts` — TC-01/02/03/04/05.
- [ ] Regression: `e2e/us-edit-005-canvas-edit-toolbar.spec.ts` still passes (AC6).
- [ ] Record results in STORY.md's test-case table.

**Effort:** S

---

## File → Task Map

| File | Task | Change type |
|---|:--:|---|
| `client/src/lib/canvasState.ts` | T2 | new function |
| `client/src/components/editor/RightSidebar.tsx` | T3 | call site |
| `client/src/hooks/useAgentStore.ts` | T2 | read-only |
| `e2e/us-edit-006-brand-layers.spec.ts` | T4 | new |

---

## Test Commands

```bash
npm run check                       # Gate 1 — typecheck
npm run test:unit                   # Gate 1 — unit
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-edit-006-brand-layers.spec.ts --project=chrome-headed
PLAYWRIGHT_BASE_URL=http://localhost:5000 npx playwright test e2e/us-edit-005-canvas-edit-toolbar.spec.ts --project=chrome-headed
```

> `PLAYWRIGHT_BASE_URL` defaults to **staging** in `.env` — always override to localhost when
> verifying local changes.

---

## Anti-patterns for this story

- **Do not place a placeholder** when an asset is missing. A generic avatar or an empty logo box
  on an agent's listing is worse than nothing — AC3 exists precisely to forbid it.
- **Do not modify the image prompt** to reserve space. That changes generation output and belongs
  to a different milestone; this story only adds layers on top of what already comes back.
- **Do not reuse the `composed-` id prefix.** `CanvasEditToolbar` derives its entire state from
  that prefix — reusing it would make brand layers read as extraction output and permanently
  disable "Edit elements" (exactly the bug class fixed in US-EDIT-005).
- **Do not let the placement decision (T1) expand the story.** Wiring `LayoutPlannerService` is
  attractive and is its natural first job, but it is a fallback plan, not the goal here.

---

*Tasks created: 2026-08-26*
