# PR Task List — US-AI-031b

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai/m-17-real-photo-background` *(shared with US-AI-031)*
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** feat
> **Estimated total:** ~3h 45m

---

## Four Pillars Pre-flight

- [ ] **Brain** — [STORY.md](./STORY.md) read, including the **Shared contract** block (US-AI-032 depends on it)
- [ ] **Muscle** — file list + ordered tasks + test commands below
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) reviewed — this story is the *recovery* and *re-binding* planes
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded; `IDEOGRAM_API_KEY` present in local `.env`

> ⚠️ **US-AI-031 must be merged first.** This story consumes the composition it produces.
> ⛽ **Credit status:** account is out of credit. TC-AI-031b-10 is gated — ship unticked rather than faking a pass.

---

## PR Scope Summary

```
feat(ai): recover text geometry and render canonical listing values — US-AI-031b
```

---

## Task Breakdown

### T1 — Define the shared contract
**File:** `api/src/modules/ai-generation/types/composed-design.types.ts` *(new)*
**AC(s) covered:** AC3, AC8
**Estimate:** 20m

Copy the interfaces verbatim from STORY.md → Shared contract: `ExtractedTextBlock`, `ListingField`, `ComposedTextElement`, `ComposedDesign`.

- `ListingField` must mirror the keys of `buildExpectedTexts()` (`api/src/modules/ai-generation/services/infographic-prompt.builder.ts:119-123`) — `headline | address | price | stats | agentName | brokerage`
- **Zero provider types.** No Ideogram-shaped fields, no raw payload passthrough.
- Do this task first — US-AI-032 is blocked on this file existing.

**Commit:**
```bash
git add api/src/modules/ai-generation/types/composed-design.types.ts
git commit -m "feat(ai): T1 define the composed-design contract — US-AI-031b"
```

---

### T2 — Layer-extraction adapter
**File:** `api/src/modules/ai-generation/services/layer-extraction.service.ts` *(new)*
**AC(s) covered:** AC1, AC6
**Estimate:** 50m

The single seam where the provider is known. Everything downstream sees only our types.

**Changes:**
- `extractTextGeometry(imageUrl, generationId): Promise<{ backgroundUrl, blocks: ExtractedTextBlock[] } | null>`
- Endpoint `https://api.ideogram.ai/v1/ideogram-v3/layerize-text`
- Map the provider response into `ExtractedTextBlock[]` **inside this file**. Raw payloads never escape.
- Returns `null` on failure/timeout rather than throwing — AC6 requires a usable flat design, not an error path
- Structured `logGen` events including `blocksDetected`, so the beta's real-world hit rate is measurable
- Capability-named, not vendor-named — see Model portability in STORY.md

**Commit:**
```bash
git add api/src/modules/ai-generation/services/layer-extraction.service.ts
git commit -m "feat(ai): T2 add the layer-extraction adapter seam — US-AI-031b"
```

---

### T3 — Block-to-field mapper (pure)
**File:** `api/src/modules/ai-generation/services/text-block.mapper.ts` *(new)*
**AC(s) covered:** AC3, AC4, AC5, AC8
**Estimate:** 70m

**The highest-value code in this epic** — pure domain logic, zero I/O, zero provider types, survives every model swap.

**Changes:**
- `mapBlocksToFields(blocks: ExtractedTextBlock[], canonical: Record<ListingField, string>): ComposedTextElement[]`
- Binding signals in strict priority order:
  1. **fuzzy match** `detectedText` against canonical values — strongest, because the composition prompt contained those values so detected text should closely resemble them. Normalise case/whitespace/newlines first; reuse the `normalize()` approach at `infographic-prompt.builder.ts:199-201`
  2. `role` hint — coarse tiebreak
  3. `fontSize` ranking — largest tends to be the headline
- Each canonical field binds **at most once**; each block binds at most once
- Unmatched **blocks** → `slot: null`, `text: detectedText` (AC4) — **except** contact-shaped text (phone/email/URL), which is dropped per the Identity policy in STORY.md. Comment the drop with a pointer to that section.
- Unmatched **fields** → emitted with `placement: 'fallback'` and geometry from the design-intent prose (AC5). Never drop a canonical value.

**Commit:**
```bash
git add api/src/modules/ai-generation/services/text-block.mapper.ts
git commit -m "feat(ai): T3 bind recovered text blocks to canonical listing fields — US-AI-031b"
```

---

### T4 — Fallback geometry from design-intent prose
**File:** `api/src/modules/ai-generation/services/text-block.mapper.ts`
**AC(s) covered:** AC5
**Estimate:** 35m

**Changes:**
- `inferFallbackGeometry(field, intentProse, canvasSize)` — maps phrases like "upper portion", "lower-right corner", "centered", "large headline" onto coarse regions
- Deliberately approximate. The user can drag it in the editor (US-AI-032); the guarantee is that the **value is present and correct**, not perfectly placed.
- Deterministic and unit-testable — no LLM call. Adding an inference call here would introduce a new cost line and a new failure mode; explicitly rejected.

**Commit:**
```bash
git add api/src/modules/ai-generation/services/text-block.mapper.ts
git commit -m "feat(ai): T4 infer fallback geometry when detection misses a field — US-AI-031b"
```

---

### T5 — Wire lazy extraction into the edit path
**Files:** `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`, `api/src/modules/infographics/services/generations.service.ts`
**AC(s) covered:** AC2, AC6, AC7
**Estimate:** 45m

**Changes:**
- Expose extraction on the **edit** action, not generate (AC2). Generate stays exactly as US-AI-031 left it.
- Compose `ComposedDesign` = background + `mapBlocksToFields(...)` output
- Adapter returned `null` → return a flat-design result (AC6)
- No-photo path untouched; `verifyAndRepairV4JsonPrompt` still runs there (AC7)
- **Metering:** increment `costUsd` on the **existing** generation record; leave `creditsUsed` at 1. Per CLAUDE.md, `costUsd` must never be zeroed or averaged.

**Commit:**
```bash
git add api/src/modules/ai-generation/services/ai-orchestrator.service.ts api/src/modules/infographics/services/generations.service.ts
git commit -m "feat(ai): T5 run extraction lazily on the edit action — US-AI-031b"
```

---

### T6 — Record extraction cost
**File:** `api/src/config/ai-models.config.ts`
**AC(s) covered:** AC9
**Estimate:** 15m

Add the extraction cost entry with source URL <https://ideogram.ai/api-pricing/>, matching the existing `V4_MAGIC_PROMPT_COST` evidence style. Note the lazy-billing wrinkle: this spend attaches to an already-persisted generation record.

**Commit:**
```bash
git add api/src/config/ai-models.config.ts
git commit -m "docs(ai): T6 record extraction pricing and the lazy-billing wrinkle — US-AI-031b"
```

---

### T7 — Tests
**Files:** `api/tests/ai-generation/text-block.mapper.spec.ts` *(new)*, `api/tests/ai-generation/layer-extraction.service.spec.ts` *(new)*
**AC(s) covered:** AC1–AC9
**Estimate:** 50m

Mapper tests are pure — fixture geometry in, elements out, no mocking needed. This is the suite that must outlive every provider swap.

Cover: canonical value wins over drifted detected text (AC8); zero blocks → all fallback (AC5); provider failure → flat design (AC6); decorative block preserved (AC4); contact-shaped block dropped (Identity policy); extraction not called on generate (AC2); `costUsd` incremented, `creditsUsed` unchanged (AC9).

**Commit:**
```bash
git add api/tests/ai-generation/
git commit -m "test(ai): T7 cover mapping, fallback, degradation and metering — US-AI-031b"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `types/composed-design.types.ts` | T1 | AC3, AC8 | **Do first** — US-AI-032 is blocked on it |
| `services/layer-extraction.service.ts` | T2 | AC1, AC6 | Only file that knows the provider |
| `services/text-block.mapper.ts` | T3, T4 | AC3–AC5, AC8 | Pure. Zero provider types. |
| `services/ai-orchestrator.service.ts` | T5 | AC2, AC6, AC7 | Generate path unchanged |
| `services/generations.service.ts` | T5 | AC2, AC9 | Metering |
| `config/ai-models.config.ts` | T6 | AC9 | Cite source URL |
| `tests/ai-generation/*.spec.ts` | T7 | all | Mapper suite is the long-lived one |

---

## Verification (Gate 1 — mandatory)

```bash
npm run check
cd api && npx vitest run --config vitest.config.ts
cd api && npx vitest run tests/ai-generation/ --reporter=verbose
```

All 23 pre-existing `infographic-prompt.builder` tests must stay green (AC7).

⛽ **Gated:** TC-AI-031b-10 (real stylised-headline detection rate) needs credit. Ship unticked; note in the PR body.

---

## Out of Scope reminder

No editable canvas, no slots, no persistence — that is US-AI-032. This story ends at a `ComposedDesign`. No object/shape decomposition; text only.
