# M-AI-02-model-swap — Replace Ideogram with Nano Banana Flash + Pro

> **Epic:** [EPIC-AI-08](../EPIC.md) (moved from EPIC-AI-00, 2026-08-04)
> **Status:** 🔲 Not Started — **Deferred to Phase 4 Backlog 2026-08-04.** The **LLM/text** half of the routing shipped via PRs #9/#10 (2026-07-03) and is live. The **image**-model swap this milestone is named for was never built: `nano-banana-pro` resolves to `ideogram-4` (`api/src/config/image-generation.config.ts:34`) and `AiOrchestrator` still calls `IdeogramService`. Deferred by priority, not blocked.
> **Target date:** — (was 2026-05-08; deferred to Phase 4 Backlog 2026-08-04)

---

## Goal

Ideogram is completely replaced: FREE/SOLO tier uses Nano Banana Flash ($0.002–0.016/image), TEAM/BROKERAGE uses Nano Banana Pro ($0.03–0.10/image), cutting image generation cost by 70–92% while improving quality.

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-AI-003](../stories/US-AI-003/STORY.md) | Replace Ideogram Turbo with Nano Banana Flash (FREE/SOLO) | 🟡 partial | [#9](https://github.com/din-prajapati/infographic.io/pull/9) |
| [US-AI-004](../stories/US-AI-004/STORY.md) | Replace Ideogram V2 with Nano Banana Pro (TEAM/BROKERAGE) | 🟡 partial | [#10](https://github.com/din-prajapati/infographic.io/pull/10) |

---

## Acceptance (Milestone Done When…)

- [ ] No `ideogram` API calls made during generation for any plan tier
- [ ] FREE/SOLO generation calls Nano Banana Flash endpoint; image quality verified with a test generation
- [ ] TEAM/BROKERAGE generation calls Nano Banana Pro endpoint; image quality verified with a test generation
- [ ] `ai-models.config.ts` updated with Nano Banana pricing entries (no Ideogram entries remain)
- [ ] Cost per image logged correctly — Flash: ≤$0.016, Pro: ≤$0.10
- [ ] `npm run check` + `npm run test:unit` pass
- [ ] All stories above have status ✅ Done

---

## Notes / Blockers

- Nano Banana = Gemini 2.5 Flash Image (Flash tier) and Gemini 3 Pro Image (Pro tier) — model names NEVER exposed in UI
- The model abstraction layer in `ai-models.config.ts` maps plan tier → model internally
- US-AI-003 must be completed before US-AI-004 (share the abstraction layer changes)
- Requires `NANO_BANANA_API_KEY` env var added to `.env.example` and Railway config

---

*Milestone created: 2026-04-28*
