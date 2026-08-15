# Story Card — US-AI-044

> **Status:** ✅ Done — all 8 ACs, all 10 TCs verified; re-confirmed live 2026-08-15 (49 tests passing). Built exactly what it scoped (intent generation only) — wiring was always the *next* story's job, not this one's; see Notes.
> **Feature:** F-AI-06-05 — LLM layout planner
> **Epic:** [EPIC-AI-06](../../EPIC.md)
> **Milestone:** [M-AI-18-editable-text-overlay](../../milestones/M-AI-18-editable-text-overlay.md) — re-scope resolved
> **Size:** M
> **Depends on:** [US-AI-043](../US-AI-043/STORY.md) (layout engine) — ✅ Done
> **Blocks:** Pipeline integration (wiring plannerIntent → layoutDesign → canvas)
> **Linear:** LIN-XXX
> **Created:** 2026-08-12 | **Closed:** 2026-08-15

---

## Notes — closure (2026-08-15)

This service is real, tested, and DI-registered — but genuinely unwired to anything, same as when
it shipped. That is not a gap in *this* story: "Frontend integration" and "Pipeline wiring" are
explicitly listed under "Explicitly not in this story" above, deferred on purpose to the next story.
That next story, [US-AI-045](../US-AI-045/STORY.md), was later closed as superseded — extraction-led
composition turned out to be the higher-fidelity default for most generations, so the *primary*
pipeline this planner was meant to feed was never built. The planner's narrower remaining job —
photo-aware template selection for the real-photo fallback path only — is tracked as
[BL-07](../../../../../BACKLOG.md), not built. This story is closed on its own terms: it delivered
exactly the intent-generation service it scoped, verified, and nothing it promised is missing.

---

## Why this story exists

US-AI-043 built a pure, deterministic layout engine: given `{ templateId, values, canvas, palette }`,
it returns non-overlapping positioned elements. It does not decide *which* template to use or *what
colours* the photo calls for — those choices require seeing the photo.

The spike proved GPT-4o can reason about photos correctly:
*"The subject is the seating area and stairs, so the scrim goes left."*
It just cannot place pixels (that is why US-AI-043 exists).

This story builds the **intent half**: a GPT-4o Vision call that analyses the listing photo and
returns `PlannerIntent { templateId, scrimSide, palette }`. Everything downstream (layoutDesign,
the canvas renderer) is deterministic once intent is fixed.

---

## Story

*As a* listing agent
*I want* the design automatically matched to my listing photo
*So that* the template, scrim position and colours complement the photo without me choosing them

---

## Scope

A **NestJS service** (`LayoutPlannerService`) with a single public method:

```ts
planLayout(photoUrl: string): Promise<PlannerIntent>
```

- Makes one GPT-4o Vision call with the photo and a structured JSON prompt.
- Parses and validates the response.
- Falls back to `DEFAULT_INTENT` on any failure (malformed JSON, bad templateId, bad palette,
  network error, missing API key) — it **never throws**.
- Is registered in `AiGenerationModule` and exported for injection by the future pipeline story.

No frontend changes. No wiring to `layoutDesign()`. No canvas rendering. Intent only.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** `planLayout(photoUrl)` sends a GPT-4o Vision request containing the
  photo URL and a structured JSON schema, and returns a valid `PlannerIntent` with `templateId`,
  `scrimSide`, `palette` and `reasoning` when the model responds correctly.

- [x] **AC2 [happy-path]:** The returned `PlannerIntent.palette` is directly usable as
  `LayoutInput.palette` in `layoutDesign()` — same four fields (`scrim`, `accent`, `text`, `muted`),
  same types — no translation needed.

- [x] **AC3 [error-path]:** When GPT-4o returns malformed or non-JSON text, `planLayout` returns
  `DEFAULT_INTENT` and logs a warning. It never throws.

- [x] **AC4 [error-path]:** When the OpenAI call throws (network error, timeout, rate-limit, quota),
  `planLayout` catches, logs the error, and returns `DEFAULT_INTENT`. It never propagates the
  exception to the caller.

- [x] **AC5 [edge-case]:** When GPT-4o returns a `templateId` not in
  `['left-scrim-hero', 'bottom-band', 'corner-card']`, the intent is rejected and `DEFAULT_INTENT`
  is returned — an unknown template ID must never reach `layoutDesign()`.

- [x] **AC6 [edge-case]:** When any palette hex field (`accent`, `text`, `muted`) fails the
  pattern `/^#[0-9a-fA-F]{6}$/`, `DEFAULT_INTENT` is returned — a malformed colour must never
  reach the canvas renderer.

- [x] **AC7 [regression]:** All existing unit tests in `api/tests/ai-generation/` pass without
  modification after adding `LayoutPlannerService` and registering it in the module.

- [x] **AC8 [regression]:** When `OPENAI_API_KEY` is absent from the environment, `planLayout`
  returns `DEFAULT_INTENT` immediately without attempting any OpenAI call — consistent with the
  demo-mode pattern already in `OpenAiService`.

---

## Explicitly not in this story

- **Frontend integration** — the planner is not yet wired to any generation endpoint or UI button.
- **Pipeline wiring** — connecting `planLayout` → `layoutDesign` → `loadComposedDesignToCanvas`
  is the next story after this one.
- **Palette extraction by pixel sampling** — GPT-4o describes colours from the photo; pixel-level
  analysis is out of scope.
- **Gemini routing** — `planLayout` always calls GPT-4o (vision). The Gemini-for-text routing in
  `OpenAiService.analyzeProperty` is separate and unrelated.
- **Caching planner results** — each call is live; caching is a future optimisation.
- **scrimSide application** — returned in the intent but the template flip (left ↔ right) is
  deferred to the pipeline integration story.
- **Any canvas rendering or image generation.**

---

## Design notes

**Why `DEFAULT_INTENT` instead of throwing?**
The layout engine can always produce a valid infographic with the default template. A planner
failure must degrade gracefully to "generic layout" — not "generation failed". The agent gets a
design, just not the AI-personalised one. All degradation is logged so it is measurable.

**Why GPT-4o and not Gemini?**
GPT-4o is vision-capable and already initialised in `OpenAiService`. Gemini Vision routing is
deferred until validated cost/quality tradeoff — the story locks in GPT-4o as the first-pass
implementation.

**Response validation is strict.** Any field outside the expected closed set causes `DEFAULT_INTENT`
return, not partial repair. This keeps the downstream `layoutDesign()` call provably safe.

**One API call, one intent.** The planner is stateless — it makes one call and returns. There is
no retry loop, no streaming, no conversation history.

---

## Engineering / PR

- **Branch:** `feat/ai/us-ai-044-layout-planner`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/ai-generation/types/planner-intent.types.ts` *(new)*
  - `api/src/modules/ai-generation/services/layout-planner.service.ts` *(new)*
  - `api/src/modules/ai-generation/ai-generation.module.ts` *(modify — register + export)*
  - `api/tests/ai-generation/layout-planner.service.spec.ts` *(new)*
  - `docs/agile/epics/phase-1-ai-core/EPIC-AI-06/ARCHITECTURE.mmd` *(update — mark planner implemented)*

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-044-01 | Auto | P0 | Valid GPT-4o response → PlannerIntent returned with all four fields | ✅ | layout-planner.service.spec.ts TC-01 (2 assertions) |
| TC-AI-044-02 | Auto | P0 | palette fields match LayoutInput.palette interface exactly | ✅ | TC-02: Object.keys check + string types |
| TC-AI-044-03 | Auto | P0 | Malformed JSON from GPT-4o → DEFAULT_INTENT, no throw | ✅ | TC-03: prose response, broken JSON, empty string (3 cases) |
| TC-AI-044-04 | Auto | P0 | OpenAI throws network error → DEFAULT_INTENT, no throw | ✅ | TC-04: ECONNREFUSED + quota exceeded (2 cases) |
| TC-AI-044-05 | Auto | P0 | Unknown templateId in response → DEFAULT_INTENT | ✅ | TC-05: 'full-bleed-hero' + 'custom-layout' (2 cases) |
| TC-AI-044-06 | Auto | P0 | Bad hex colour in palette → DEFAULT_INTENT | ✅ | TC-06: 3-digit hex, invalid char, missing field (3 cases) |
| TC-AI-044-07 | Auto | P1 | OPENAI_API_KEY absent → DEFAULT_INTENT, zero API calls | ✅ | TC-07: no key + blank photoUrl (3 cases) |
| TC-AI-044-08 | Auto | P1 | all-three valid templateIds returned → each parsed correctly | ✅ | TC-08: it.each 3 templateIds |
| TC-AI-044-09 | Auto | P1 | all-four valid scrimSide values returned → each parsed correctly | ✅ | TC-09: it.each 4 scrimSides |
| TC-AI-044-10 | Auto | P2 | Existing ai-generation unit tests pass without modification | ✅ | 303 backend tests pass (254 original + 49 new) |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

*Created 2026-08-12 — implements the "intent" half of the planner+renderer split proven by the pure-canvas spike.*
