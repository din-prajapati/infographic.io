# PR Task List — US-AI-048

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai/us-ai-048-compose-cache`
> **PR:** #_____ (fill when opened)
> **Linear:** LIN-XXX
> **Type:** feat

---

## Four Pillars Pre-flight (check before starting AI session)

- [x] **Brain** — STORY.md is filled: ACs written, out-of-scope listed, "AI Implementation Prompt" ready
- [x] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [x] **Env** — [ENV.yaml](../../ENV.yaml) loaded (paths not guessed)

---

## PR Scope Summary

**One-liner:**
```
feat(ai): cache ComposedDesign per generation+variation so layerize is paid at most once — US-AI-048
```

---

## Task Breakdown

### T1 — Schema: `composedDesigns Json?` on Infographic + cache-key helper ✅
**Files:**
- `api/prisma/schema.prisma` — new nullable Json field
- `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` — `composeCacheKey(imageUrl)` helper (strips exp/sig)
- `api/tests/ai-generation/compose-cache.spec.ts` — key normalisation tests (same image, rotated sig → same key)

**AC(s) covered:** AC3

### T2 — Cache read path (hit → return stored, no extraction, no metering) ✅
**Files:**
- `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`
- `api/tests/ai-generation/compose-cache.spec.ts`

**AC(s) covered:** AC1, AC2, AC6

### T3 — Cache write path (successful results only; degraded never cached)
**Files:**
- `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`
- `api/tests/ai-generation/compose-cache.spec.ts`

**AC(s) covered:** AC4, AC5

### T4 — Live verification via harness
**Files:**
- `scripts/e2e-editable-verify.mjs` (no change expected — run twice against one generation)

**AC(s) covered:** TC-AI-048-06

---

## File-to-Task Mapping

| File | Task(s) |
|------|---------|
| `api/prisma/schema.prisma` | T1 |
| `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` | T1, T2, T3 |
| `api/tests/ai-generation/compose-cache.spec.ts` | T1, T2, T3 |

---

## Test Commands

```bash
npm run check
cd api && npx vitest run tests/ai-generation/compose-cache.spec.ts --reporter=verbose
npm run test:unit
npx prisma db push --schema=api/prisma/schema.prisma   # after T1
```

---

## Anti-patterns (story-specific)

- Do NOT key the cache on the full signed URL — signatures rotate; you would never hit.
- Do NOT cache the degraded/null extraction result — a provider blip would permanently poison that variation.
- Do NOT touch `creditsUsed` anywhere in this story — metering policy changes belong to US-LAUNCH-015.
- Do NOT re-provide PrismaService in module providers — DatabaseModule is @Global (CLAUDE.md).
