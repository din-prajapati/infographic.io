# Story Card — US-AI-045

> **Status:** ⛔ Closed — superseded, re-scoped to backlog (see Notes)
> **Feature:** F-AI-06-06 — Pipeline integration
> **Epic:** [EPIC-AI-06](../../EPIC.md)
> **Milestone:** TBD
> **Size:** M
> **Depends on:**
>   - [US-AI-043](../US-AI-043/STORY.md) `layoutDesign()` — ✅ Done
>   - [US-AI-044](../US-AI-044/STORY.md) `planLayout()` — ✅ Done
>   - [US-AI-032](../US-AI-032/STORY.md) `loadComposedDesignToCanvas()` — ✅ Code done, ACs pending browser verify
> **Blocks:** Live generation with real listing photos (US-AI-010 path)
> **Linear:** LIN-XXX
> **Created:** 2026-08-12 | **Closed:** 2026-08-14 (superseded, not shipped)

---

## Notes — re-scope decision (2026-08-14)

This story as written below never got built, and per an explicit decision it never will be, in this form.

What actually shipped instead, across US-AI-046 through US-AI-051 (2026-08-13/14): **extraction-led
composition** (`88db72d`) is the default for editable mode — it reproduces the exact design the user
already saw, not a re-planned one — with `layoutDesign()`/`connectLayout.ts` (US-AI-046) surviving only
as the fallback for text-free backgrounds (the real-photo flow, US-AI-051, ✅ done and live-verified).
The pipeline this story wanted to build — `planLayout API → layoutDesign → composeFromLayout →
loadComposedDesignToCanvas` as the *primary* editable-mode path — is superseded by that architecture;
building it as scoped below would duplicate what extraction already does better for the common case.

`LayoutPlannerService.planLayout()` (US-AI-044) itself is not dead — it's real, tested (49 tests),
DI-registered, and still has one genuine unfilled job: the real-photo fallback path currently always
uses `DEFAULT_TEMPLATE_ID` with no photo awareness (`connectLayout.ts`'s `composeFromCanonicalValues`).
Wiring the planner into *just* that path — not the whole pipeline — is real remaining scope, much
smaller than this story. **Deliberately deferred to the backlog rather than built now** — user's call,
2026-08-14. Tracked as [BL-07](../../../../../BACKLOG.md).

Everything below this point is the original story as written 2026-08-12, kept for the record — it is
not the plan going forward.

---

## Why this story exists

Three pieces are built and tested in isolation:

| Story | What it built | Status |
|---|---|---|
| US-AI-043 | `layoutDesign(templateId, values, canvas, measureText) → LayoutElement[]` | ✅ Done |
| US-AI-044 | `planLayout(photoUrl) → PlannerIntent` (backend, GPT-4o Vision) | ✅ Done |
| US-AI-032 | `loadComposedDesignToCanvas(design) → canvas` (editable canvas renderer) | ✅ Code done |

None of them are connected. This story adds the two missing pieces:

1. A **backend endpoint** `POST /api/v1/layout/plan` so the frontend can call `planLayout()` over HTTP.
2. A **client-side pipeline** in AIChatBox that, in editable mode, chains all three:
   `planLayout API → layoutDesign → loadComposedDesignToCanvas → visible canvas`.

After this story, generating in editable mode produces a real listing photo as a background layer
with measured, non-overlapping, editable text elements on top of it.

---

## Story

*As a* listing agent
*I want* to click Generate and immediately see my listing photo with the design text laid over it
as editable elements
*So that* I can tweak any value without regenerating and without paying for another AI call

---

## Scope

- **Backend:** one new route on the existing generations controller —
  `POST /api/v1/infographics/:id/layout-plan` — that looks up the infographic's photo URL,
  calls `LayoutPlannerService.planLayout()`, and returns `PlannerIntent`.
- **Frontend client:**
  - `measureText.ts` — a real `CanvasRenderingContext2D`-backed measureText factory (no stub).
  - `composeFromLayout.ts` — adapter that converts `LayoutElement[]` + `backgroundUrl` into
    the `ComposedDesign` shape that `loadComposedDesignToCanvas` already understands.
  - `api.ts` — `callLayoutPlan(infographicId)` method.
  - `AIChatBox.tsx` — wire editable mode: after generation, call plan → layoutDesign →
    composeFromLayout → loadComposedDesignToCanvas.
- **No new NestJS modules, no new DB migrations, no new UI components.**

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** `POST /api/v1/infographics/:id/layout-plan` returns a valid
  `PlannerIntent` JSON body when the infographic exists and `OPENAI_API_KEY` is set.

- [ ] **AC2 [happy-path]:** In the browser, selecting "Editable" mode and clicking Generate:
  (a) calls the plan endpoint, (b) runs `layoutDesign()` client-side with a real
  `CanvasRenderingContext2D.measureText()`, (c) calls `loadComposedDesignToCanvas()` — the
  canvas shows the listing photo as background with independently selectable text elements.

- [ ] **AC3 [error-path]:** When the plan endpoint returns an error or times out, the client
  falls back to `DEFAULT_INTENT` and still loads the canvas — it never shows an error screen
  for a planner failure.

- [ ] **AC4 [regression]:** Flat mode (`renderMode:'flat'`) remains fully functional and
  unchanged — `loadAiVariationToCanvas` is still called on the flat path.

- [ ] **AC5 [regression]:** All 303 backend unit tests pass without modification after adding
  the new endpoint.

- [ ] **AC6 [edge-case]:** When the infographic has no `photoUrl` stored (e.g. pre-photo-upload
  flow), `layout-plan` returns `DEFAULT_INTENT` — it never returns 4xx or 5xx for a missing
  photo. The client proceeds with the default template.

---

## Explicitly not in this story

- **Real listing photo upload** — that is US-AI-010 (EPIC-AI-02). For now, the photo URL comes
  from `propertyData.photoUrl` if present, or falls back to the generation's result image URL.
- **scrimSide application** — `PlannerIntent.scrimSide` is returned and stored but the template
  flip (left ↔ right scrim) is deferred to a follow-up.
- **Contrast safety** — pixel sampling against the photo to ensure text is readable is deferred
  to the compositor story.
- **Integration tests with a real database.**
- **Any UI changes beyond the editable-mode pipeline trigger in AIChatBox.**

---

## Engineering / PR

- **Branch:** `feat/ai/us-ai-045-pipeline-integration`
  *(merges feat/ai/m-18-editable-text-overlay + built on feat/ai/us-ai-044-layout-planner)*
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/infographics/controllers/generations.controller.ts` *(modify — new endpoint)*
  - `client/src/lib/layout/measureText.ts` *(new — production measureText factory)*
  - `client/src/lib/layout/composeFromLayout.ts` *(new — LayoutElement[] → ComposedDesign adapter)*
  - `client/src/lib/api.ts` *(modify — add callLayoutPlan())*
  - `client/src/components/ai-chat/AIChatBox.tsx` *(modify — wire editable pipeline)*

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-045-01 | Auto | P0 | POST /layout-plan returns PlannerIntent when service succeeds | 🔲 | |
| TC-AI-045-02 | Auto | P0 | POST /layout-plan returns DEFAULT_INTENT when photoUrl absent | 🔲 | |
| TC-AI-045-03 | Auto | P0 | composeFromLayout adapter converts LayoutElement[] to ComposedDesign correctly | 🔲 | |
| TC-AI-045-04 | Auto | P0 | composeFromLayout sets backgroundUrl from input, elements from layout | 🔲 | |
| TC-AI-045-05 | Auto | P1 | measureText factory returns a callable function | 🔲 | |
| TC-AI-045-06 | Auto | P1 | backend regression: 303 tests still pass | 🔲 | |
| TC-AI-045-07 | Manual | P0 | editable mode Generate → canvas shows background + selectable text | 🔲 | |
| TC-AI-045-08 | Manual | P1 | flat mode Generate → unchanged, no elements added | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

*Created 2026-08-12 — the connector story that wires US-AI-032 + US-AI-043 + US-AI-044 into a single end-to-end pipeline.*
