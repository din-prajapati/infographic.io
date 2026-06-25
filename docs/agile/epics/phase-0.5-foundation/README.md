# Phase 0.5 — AI Foundation Fixes

> **Timing:** Runs in parallel with the final 3 MVP human tasks (Phase 0 close)
> **Outcome:** 6 critical defects fixed — Socket.io progress visible, correct AI models used, data persists, conversation history survives refresh.

## Epics in this Phase

| Epic | Focus | Status | Effort |
|------|-------|--------|--------|
| [EPIC-AI-00](EPIC-AI-00/EPIC.md) | Foundation Fixes (Socket.io · GPT model · Nano Banana · Persistence) | 🔲 Not Started | 22h |

## Why this phase exists
These are pre-conditions, not features. Without them, every downstream AI capability (Phase 1+) is built on a broken foundation.

## Phase Gate (0.5 → Phase 1 AI)
- [ ] Socket.io progress events visible in browser network tab
- [ ] `gpt-4o` appears in OpenAI dashboard logs (not `gpt-5`)
- [ ] Conversations load from backend after hard refresh
- [ ] Extraction records visible in Prisma Studio after generation
- [ ] Image generation cost reduced ≥70% on SOLO/FREE tier

> Full AI roadmap: [AGILE_INDEX.md](../../AGILE_INDEX.md#ai-capability-epics)
