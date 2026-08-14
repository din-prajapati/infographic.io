# TASKS — US-AI-044 LLM Layout Planner

## Four-Pillars Pre-flight

- [x] **Brain** — STORY.md ACs written (AC1–AC8, all four required types: happy-path, error-path, edge-case, regression)
- [x] **Muscle** — file list + ordered tasks below
- [x] **Map** — `docs/agile/epics/phase-1-ai-core/EPIC-AI-06/ARCHITECTURE.mmd` exists
- [x] **Env** — `OPENAI_API_KEY` already declared; no new env vars required for this story

## Primary files touched

| File | Action |
|------|--------|
| `api/src/modules/ai-generation/types/planner-intent.types.ts` | CREATE |
| `api/tests/ai-generation/planner-intent.types.spec.ts` | CREATE |
| `api/src/modules/ai-generation/services/layout-planner.service.ts` | CREATE |
| `api/tests/ai-generation/layout-planner.service.spec.ts` | CREATE |
| `api/src/modules/ai-generation/ai-generation.module.ts` | MODIFY |
| `docs/agile/epics/phase-1-ai-core/EPIC-AI-06/ARCHITECTURE.mmd` | MODIFY |

## Tasks

### T1 — Define PlannerIntent types, DEFAULT_INTENT and validation helpers
**Commit:** `feat(ai): T1 define PlannerIntent types and validation helpers — US-AI-044`

**Files:**
- `api/src/modules/ai-generation/types/planner-intent.types.ts` (new)
- `api/tests/ai-generation/planner-intent.types.spec.ts` (new)

**Changes:**
- `TemplateId` union: `'left-scrim-hero' | 'bottom-band' | 'corner-card'`
- `ScrimSide` union: `'left' | 'right' | 'bottom' | 'none'`
- `Palette` interface: `{ scrim: string; accent: string; text: string; muted: string }`
- `PlannerIntent` interface: `{ templateId: TemplateId; scrimSide: ScrimSide; palette: Palette; reasoning: string }`
- `VALID_TEMPLATE_IDS: readonly TemplateId[]` — closed set the service validates against
- `VALID_SCRIM_SIDES: readonly ScrimSide[]` — closed set
- `DEFAULT_INTENT: PlannerIntent` — fallback when GPT-4o fails (left-scrim-hero, scrimSide:left, neutral palette)
- `isPaletteValid(p: unknown): boolean` — checks accent/text/muted match `/^#[0-9a-fA-F]{6}$/`; scrim matches hex or `rgba(...)` pattern
- `isValidPlannerIntent(raw: unknown): raw is PlannerIntent` — checks all fields present and valid
- Tests: `DEFAULT_INTENT` satisfies all field checks; valid intent passes guard; invalid templateId fails; bad hex fails; missing field fails

### T2 — Implement LayoutPlannerService with GPT-4o Vision call and full unit tests
**Commit:** `feat(ai): T2 implement LayoutPlannerService with GPT-4o Vision — US-AI-044`

**Files:**
- `api/src/modules/ai-generation/services/layout-planner.service.ts` (new)
- `api/tests/ai-generation/layout-planner.service.spec.ts` (new)

**Changes:**
- `@Injectable() class LayoutPlannerService`
  - Constructor: reads `OPENAI_API_KEY` from env; sets `this.openai` to `new OpenAI(...)` or `null`
  - `async planLayout(photoUrl: string): Promise<PlannerIntent>`
    - Returns `DEFAULT_INTENT` immediately when `this.openai === null` (AC8, no API call)
    - Returns `DEFAULT_INTENT` immediately when `photoUrl` is empty/blank (defensive)
    - Calls `this.openai.chat.completions.create` with model `'gpt-4o'`, one user message containing:
      - `{ type: 'image_url', image_url: { url: photoUrl, detail: 'low' } }` — `detail:'low'` for cost control
      - `{ type: 'text', text: PLANNER_PROMPT }` — the schema-enforcing system prompt
    - Parses `response.choices[0].message.content` via `JSON.parse` inside try/catch
    - Calls `isValidPlannerIntent(parsed)` — returns `DEFAULT_INTENT` on any failure
    - Returns the parsed, validated intent
    - Entire OpenAI call wrapped in outer try/catch → returns `DEFAULT_INTENT` on any error
  - `PLANNER_PROMPT` constant (module-level, not exported): instructs GPT-4o to return only valid JSON matching the schema
- Test suite (TC-01 through TC-10): mock `OpenAI` via `vi.mock('openai')`; cover every AC

### T3 — Register in AiGenerationModule, update ARCHITECTURE.mmd, Gate 1
**Commit:** `feat(ai): T3 register LayoutPlannerService in module and update architecture — US-AI-044`

**Files:**
- `api/src/modules/ai-generation/ai-generation.module.ts` (modify)
- `docs/agile/epics/phase-1-ai-core/EPIC-AI-06/ARCHITECTURE.mmd` (modify)

**Changes:**
- Add `LayoutPlannerService` to `providers` and `exports` in `AiGenerationModule`
- ARCHITECTURE.mmd: change planner node style from `:::new` to `:::good` (implemented); add `planLayout()` to node label

## Task Checklist

- [x] T1 — PlannerIntent types + DEFAULT_INTENT + validation helpers + type tests
- [x] T2 — LayoutPlannerService + GPT-4o Vision call + full unit test suite
- [x] T3 — Module registration + ARCHITECTURE.mmd + Gate 1
- [x] `npm run check` passes ✅
- [x] `npm run test:unit` passes, backend 303 (254 + 49 new) ✅
- [x] STORY.md ACs updated — only what was verified ✅

## Estimation

| Task | Effort |
|------|--------|
| T1 | 30 min |
| T2 | 60 min |
| T3 | 15 min |
| **Total** | **~1.75 h** |

## Commit template (verbatim, no trailing lines)

```
feat(ai): T1 define PlannerIntent types and validation helpers — US-AI-044
feat(ai): T2 implement LayoutPlannerService with GPT-4o Vision — US-AI-044
feat(ai): T3 register LayoutPlannerService in module and update architecture — US-AI-044
```
