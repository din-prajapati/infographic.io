# TASKS — US-AI-045 Pipeline Integration

## Four-Pillars Pre-flight

- [x] **Brain** — STORY.md ACs written (AC1–AC6; types: happy-path×2, error-path, regression×2, edge-case)
- [x] **Muscle** — file list + ordered tasks below
- [x] **Map** — `docs/agile/epics/phase-1-ai-core/EPIC-AI-06/ARCHITECTURE.mmd` exists
- [x] **Env** — `OPENAI_API_KEY` already declared; no new env vars required

## Primary files touched

| File | Action |
|------|--------|
| `api/src/modules/infographics/controllers/generations.controller.ts` | MODIFY |
| `api/tests/infographics/layout-plan.endpoint.spec.ts` | CREATE |
| `client/src/lib/layout/measureText.ts` | CREATE |
| `client/src/lib/layout/composeFromLayout.ts` | CREATE |
| `client/src/lib/layout/__tests__/composeFromLayout.spec.ts` | CREATE |
| `client/src/lib/api.ts` | MODIFY |
| `client/src/components/ai-chat/AIChatBox.tsx` | MODIFY |

## Tasks

### T1 — Backend: POST /api/v1/infographics/:id/layout-plan endpoint
**Commit:** `feat(ai): T1 add layout-plan endpoint to generations controller — US-AI-045`

**Files:**
- `api/src/modules/infographics/controllers/generations.controller.ts`
- `api/tests/infographics/layout-plan.endpoint.spec.ts` (new)

**Changes (controller):**
- Inject `LayoutPlannerService` (already exported from `AiGenerationModule`)
- Add `@Post(':id/layout-plan') async layoutPlan(@Param('id') id: string, @Req() req): Promise<PlannerIntent>`
  - Look up `infographic.propertyData.photoUrl` (may be undefined)
  - Call `this.layoutPlannerService.planLayout(photoUrl ?? '')` — service handles empty URL → DEFAULT_INTENT
  - Return the intent directly (already validated PlannerIntent shape)
  - Endpoint is behind the existing JWT guard on the controller
- No new module imports; LayoutPlannerService is already in AiGenerationModule exports

**Changes (tests):**
- Mock `LayoutPlannerService` + `PrismaService`
- TC-01: service returns valid intent → endpoint returns it
- TC-02: infographic has no photoUrl → endpoint returns DEFAULT_INTENT (from service fallback)
- TC-03: LayoutPlannerService throws → endpoint still returns DEFAULT_INTENT (never 5xx for planner failure)

### T2 — Frontend: measureText factory + composeFromLayout adapter
**Commit:** `feat(ai): T2 add measureText factory and layout-to-design adapter — US-AI-045`

**Files:**
- `client/src/lib/layout/measureText.ts` (new)
- `client/src/lib/layout/composeFromLayout.ts` (new)
- `client/src/lib/layout/__tests__/composeFromLayout.spec.ts` (new)

**Changes (measureText.ts):**
- `export function createMeasureText(): (text: string, fontSize: number, weight: number) => number`
  - Creates a hidden `<canvas>` element once
  - Returns a closure that sets `ctx.font = "${weight} ${fontSize}px Inter"` and calls `ctx.measureText(text).width`
  - Falls back to proportional stub `text.length * fontSize * 0.55` when `getContext` returns null (jsdom/SSR)
- No tests needed for this file — it wraps the native browser API

**Changes (composeFromLayout.ts):**
- Import `LayoutElement` from `./types`
- Import `ComposedDesign` from `../../../api/src/...` — NO; import from a local re-export or use `as`
  - Actually: define a minimal local `ComposedDesignLike` interface inline OR import from the shared `composed-design.types.ts` through the client's path alias if available
  - **Simplest**: cast LayoutElement[] as `ComposedDesign['elements']` using `as unknown as` (same shape, AC2 of US-AI-043 proves this)
- `export function composeFromLayout(elements: LayoutElement[], backgroundUrl: string): ComposedDesign`
  - Returns `{ backgroundUrl, elements: elements as unknown as ComposedTextElement[], extraction: { attempted: false, blocksDetected: 0, matched: 0 } }`
- Import `ComposedDesign` and `ComposedTextElement` from `../../api/...` — wait, this is the client, can't import from api/
  - Instead: define a local `ComposedDesignShape` interface in `composeFromLayout.ts` matching the shape that `loadComposedDesignToCanvas` expects
  - OR look at what `api.ts` already exports — it already has `ComposedDesign` type there (from US-AI-032 T2)

**Changes (tests):**
- TC-03: composeFromLayout sets backgroundUrl correctly
- TC-04: composeFromLayout maps elements array verbatim
- TC-05: composeFromLayout sets extraction.attempted=false, blocksDetected=0, matched=0
- TC-06: works with empty elements array

### T3 — Frontend: wire AIChatBox editable path to full pipeline
**Commit:** `feat(ai): T3 wire editable pipeline in AIChatBox — US-AI-045`

**Files:**
- `client/src/lib/api.ts`
- `client/src/components/ai-chat/AIChatBox.tsx`

**Changes (api.ts):**
- Add `callLayoutPlan(infographicId: string): Promise<PlannerIntent>` method
  - `POST /api/v1/infographics/${infographicId}/layout-plan`
  - Returns parsed `PlannerIntent` or `DEFAULT_INTENT` on any network error

**Changes (AIChatBox.tsx):**
- In the editable mode handler (`handleEditVariation` or equivalent from US-AI-032 T4):
  - After generation completes, retrieve the infographic id from the response
  - Call `callLayoutPlan(infographicId)` → `PlannerIntent`
  - On failure: use `DEFAULT_INTENT` (AC3)
  - Build `values: Partial<Record<SlotId, string>>` from the listing payload in the chat context
  - Call `layoutDesign({ templateId: intent.templateId, values, canvas: { width, height }, palette: intent.palette, measureText: createMeasureText() })` → `LayoutElement[]`
  - Call `composeFromLayout(elements, backgroundImageUrl)` → `ComposedDesign`
  - Call `loadComposedDesignToCanvas(design)` — already exists from US-AI-032 T3
  - AC4: flat mode path (`renderMode:'flat'`) must remain untouched

## Task Checklist

- [ ] T1 — layout-plan endpoint + backend tests
- [ ] T2 — measureText factory + composeFromLayout adapter + client tests
- [ ] T3 — AIChatBox editable pipeline wiring
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes, backend 303+ ✅
- [ ] STORY.md ACs updated ✅

## Commit template (verbatim)

```
feat(ai): T1 add layout-plan endpoint to generations controller — US-AI-045
feat(ai): T2 add measureText factory and layout-to-design adapter — US-AI-045
feat(ai): T3 wire editable pipeline in AIChatBox — US-AI-045
```
