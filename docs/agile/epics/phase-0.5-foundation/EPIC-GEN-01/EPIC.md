# EPIC-GEN-01 — Generation Quality: V4 Magic-Prompt Pipeline

> **Phase:** Phase 0.5 — Foundation Repair
> **Status:** 🟡 In Progress (US-GEN-001 implemented on branch, PR pending)
> **Linear Project:** LIN-EPIC-GEN-01
> **Target date:** 2026-07-05
> **Owner:** Dinesh

---

## Goal

**Outcome:** Every AI generation renders exact, garble-free text at web-UI quality, on every Ideogram model family (V2/V3/V4), with every AI-cost point explicitly marked in code.

**Why now:** V4 generations produced garbled text — a 4-image isolation experiment (2026-07-03) proved the cause was our hand-built sparse `json_prompt` (the model invented filler panels of pseudo-text), NOT rendering speed. The fix adopts Ideogram's own reference flow (text prompt → `magic-prompt-v4` conversion → verified generation) and restructures the pipeline into a modular, cost-transparent architecture. Evidence: [docs/testing/reports/ideogram-v4-experiment-2026-07-03/](../../../../testing/reports/ideogram-v4-experiment-2026-07-03/SUMMARY.md) · Session log: [docs/research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md](../../../../research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md).

**Success metric:** E2E app generation produces exact strings with zero invented text panels (✅ verified 2026-07-03, generation `cmr515lmh0006gp10cg3sphwi`: 34.3s, $0.064, zero repairs needed); `verifyAndRepairV4JsonPrompt` covered by unit tests; PR merged.

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|--------|
| [M-GEN-01-v4-magic-prompt-pipeline](milestones/M-GEN-01-v4-magic-prompt-pipeline.md) | Pipeline restructure + verify/repair layer + E2E verification + tests + PR | 2026-07-05 | 🟡 |

---

## Stories in this Epic

| Story ID | Title | Milestone | Size | Status | PR |
|----------|-------|-----------|------|--------|----|
| [US-GEN-001](stories/US-GEN-001/STORY.md) | V4 magic-prompt pipeline — modular restructure with verified exact text | M-GEN-01 | L | 🟡 Implemented — PR pending | — |
| [US-GEN-002](stories/US-GEN-002/STORY.md) | Unit tests for prompt builder + verify/repair | M-GEN-01 | S | 🔲 | — |

---

## Features in this Epic

| Feature ID | Scope | Stories |
|------------|-------|---------|
| F-GEN-01 | V4 reference-flow pipeline (convert → verify → generate) | US-GEN-001 |
| F-GEN-02 | Prompt-builder module test coverage | US-GEN-002 |

---

## Out of Scope (Epic Level)

- Real listing photos as background — EPIC-AI-06
- Multi-format kits — EPIC-KIT-01
- Preview/finalize variation cost flow — US-KIT-003
- Frontend model-picker changes

---

## Definition of Done (Epic)

- [ ] All stories have PR merged and STORY.md status = ✅ Done
- [x] E2E verified on localhost (2026-07-03)
- [ ] Verified on staging environment
- [x] `npm run check` + `npm run test:unit` passing (41/41)
- [ ] AGILE_INDEX.md epic row updated to ✅ Done
- [ ] `V4_MAGIC_PROMPT_COST` verified against first Ideogram invoice

---

## Architecture Notes

See [ARCHITECTURE.mmd](./ARCHITECTURE.mmd).

Key files relevant to this epic:
```
- api/src/modules/ai-generation/services/infographic-prompt.builder.ts (NEW — pure functions, single prompt source)
- api/src/modules/ai-generation/services/ideogram.service.ts           (magic-prompt call + model-mapped speed)
- api/src/modules/ai-generation/services/ai-orchestrator.service.ts    (numbered pipeline steps, 💰 markers)
- api/src/modules/ai-generation/services/openai.service.ts             (LLM-only after cleanup)
- api/src/config/ai-models.config.ts                                   (V4_MAGIC_PROMPT_COST)
```

---

*Epic created: 2026-07-03 | Last updated: 2026-07-03*
