# PR Task List — US-AI-051

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai/us-ai-051-textfree-photo-background`
> **PR:** #_____ · **Linear:** LIN-XXX · **Type:** feat

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled
- [ ] **Muscle** — this file has tasks + test commands
- [ ] **Map** — ARCHITECTURE.mmd current (this story changes the prompt-building branch — update the diagram if it adds a decision node)
- [ ] **Env** — ENV.yaml loaded

---

## PR Scope Summary

```
feat(ai): text-free background prompt for editable + real-photo generations — US-AI-051
```

---

## Task Breakdown

### T1 — Regression test FIRST: prompt output unchanged for renderMode=undefined/flat
**Files:** `api/tests/ai-generation/infographic-prompt.builder.spec.ts`
**AC(s):** AC2, AC3 (write failing-safe baseline before any prompt-builder change)

### T2 — Text-free prompt variant + routing by renderMode + photo presence
**Files:** `api/src/modules/ai-generation/services/infographic-prompt.builder.ts`, `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`, `api/tests/ai-generation/infographic-prompt.builder.spec.ts`
**AC(s):** AC1

### T3 — Confirm DTO threading (read-only trace, fix if actually broken)
**Files:** `api/src/modules/infographics/dto/generate-from-chat.dto.ts` (TBC — likely no change needed, verify only)
**AC(s):** AC1 (prerequisite)

### T4 — Compose fallback correctness on text-free background
**Files:** `client/src/lib/layout/loadVariation.ts` (verify only — behaviour should already be correct per its existing fallback chain; add a spec case if a gap is found)
**AC(s):** AC4

### T5 — Live verification with a real uploaded photo
**Files:** none — run `scripts/e2e-editable-verify.mjs` variant with photo upload, or manual browser pass
**AC(s):** AC5

---

## File-to-Task Mapping

| File | Task(s) |
|------|---------|
| `infographic-prompt.builder.ts` + spec | T1, T2 |
| `ai-orchestrator.service.ts` | T2 |
| `generate-from-chat.dto.ts` | T3 |
| `loadVariation.ts` + spec | T4 |

---

## Test Commands

```bash
npm run check
cd api && npx vitest run tests/ai-generation/infographic-prompt.builder.spec.ts --reporter=verbose
npm run test:unit
```

---

## Anti-patterns (story-specific)

- Do NOT write T2 before T1's regression test exists and passes against current behaviour — the whole point of AC2 is proving nothing else moved.
- Do NOT touch the synthetic (no-photo) generation path — AC3 is a hard boundary.
- Do NOT reopen the extraction-vs-engine precedence decided in `88db72d` — this story removes text from ONE generation path; it does not change how the client decides what to do with the result.
- Trace the actual runtime call chain before editing (per `runtime-first-implementation` skill) — this epic has a documented history (EPIC.md 2026-08-13 log) of code that looked wired but wasn't.
