# M-AI-01-critical-fixes — Wire Socket.io + Fix GPT Model ID

> **Epic:** [EPIC-AI-00](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** 2026-05-05

---

## Goal

Socket.io generation progress events are visible in the browser and the AI system uses `gpt-4o` as confirmed by OpenAI dashboard logs.

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-AI-001](../stories/US-AI-001/STORY.md) | Wire Socket.io Gateway to AppModule | 🔲 | — |
| [US-AI-002](../stories/US-AI-002/STORY.md) | Fix GPT model ID: gpt-5 → gpt-4o | 🔲 | — |
| [US-AI-002a](../stories/US-AI-002a/STORY.md) | Brand color hex codes → descriptive names in image prompt | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] `GenerationProgressGateway` is listed in `InfographicsModule` providers (or `AppModule` imports)
- [ ] Browser WS tab shows `generation:progress` events during a generation run
- [ ] `api/src/modules/ai-generation/services/openai.service.ts` has `model: 'gpt-4o'` — no `gpt-5` anywhere in codebase
- [ ] Server log during generation shows color names (not hex codes) in the image prompt when a brand palette is selected
- [ ] When no brand palette is selected, the "Brand colors:" line is absent from the image prompt entirely
- [ ] `npm run check` passes after all changes
- [ ] All stories above have status ✅ Done

---

## Notes / Blockers

- US-AI-001 requires understanding how `@nestjs/websockets` gateways are registered — check `InfographicsModule` providers array in `api/src/modules/infographics/infographics.module.ts`
- US-AI-002 is a 1-line fix — do it first as it unblocks accurate cost tracking

---

*Milestone created: 2026-04-28*
