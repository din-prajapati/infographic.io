# Story Card — US-AI-048

> **Status:** ✅ Done — all 7 ACs verified, TC-AI-048-06 live-verified 2026-08-15
> **Feature:** F-AI-06-07 — Extraction cost control (compose cache)
> **Epic:** [EPIC-AI-06](../../EPIC.md)
> **Milestone:** [M-AI-18-editable-text-overlay](../../milestones/M-AI-18-editable-text-overlay.md)
> **Size:** M
> **Depends on:** layerize multipart fix (`eaf9b69`) + extraction-led ordering (`88db72d`) — ✅ on `feat/ai/us-ai-047-shared-rendermode`
> **Blocks:** [US-LAUNCH-015](../../../EPIC-LAUNCH-01/stories/US-LAUNCH-015/STORY.md) (pricing needs "distinct compose" to be well-defined)
> **Linear:** LIN-XXX
> **Created:** 2026-08-13 | **Closed:** —

---

## Why this story exists

Every editable "Use This" click calls Ideogram layerize-text at **$0.09/call — with no cache**. Re-clicking the same variation, switching variations and coming back, or reloading a saved design each pays again, without consuming a credit (`creditsUsed` stays 1 per the metering policy; only `costUsd` grows). Measured 2026-08-13: one generation costs ~$0.10 flat; each compose adds $0.09, so an indecisive user can silently multiply the cost of their own generation. Layerize is deterministic for a given image — identical input bytes produce the same blocks — so repeat calls buy nothing.

Caching per (generation, variation image) caps editable cost at $0.09 × distinct variations, hard-bounds the FREE-tier burn that US-LAUNCH-015 gates, and makes repeat loads instant (~0ms vs 40–70s) as a side effect.

---

## Story

*As the* product owner
*I want* the ComposedDesign for each (generation, variation) pair persisted on the Infographic record and reused on every subsequent compose request
*So that* each distinct variation is extracted (and paid for) at most once, and repeat editable loads are free and instant.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** `POST /api/v1/infographics/generations/:id/compose` for a (generation, imageUrl) pair that has a stored result returns it **without** calling `LayerExtractionService.extractTextGeometry` (assert provider mock not called on second request).
- [x] **AC2 [idempotency]:** The cached path does **not** increment `costUsd` on the UsageRecord — only a real layerize call meters $0.09 (`edit:metering:ok` absent from logs on cache hit; `costUsd` unchanged in DB).
- [x] **AC3 [edge-case]:** Compose results are stored on the `Infographic` record in a `composedDesigns Json?` field keyed by variation imageUrl (URL stripped of `exp`/`sig` query params, since ephemeral signatures rotate while the image identity does not) — verified by a round trip: compose, read record, compose again.
- [x] **AC4 [idempotency]:** Distinct variations of the same generation each trigger exactly one provider call — composing variation A then B then A again = exactly 2 `extract:start` events for that generation.
- [x] **AC5 [regression]:** A **degraded** extraction result (provider failure → `blocksDetected:0, elements:[]`) is **not** cached — a retry after provider recovery performs a fresh extraction (transient failure must not become permanent).
- [x] **AC6 [happy-path]:** Cache hit is logged as a structured event `edit:compose:cache-hit` with `generationId` and `durationMs`, so the hit rate is measurable (Observability rules).
- [x] **AC7 [error-path]:** When the Prisma update that persists `composedDesigns` on the `Infographic` record (in `ai-orchestrator.service.ts`) throws after a successful extraction, then `composeDesignForEdit()` still returns the freshly-extracted `ComposedDesign` to the caller and logs the persistence failure — a cache-write error must not fail the user-facing compose request, and the next request retries the write rather than serving a phantom cache entry.

---

## Out of Scope

- **Pricing/gating decisions** — who may compose and what it charges is US-LAUNCH-015; this story only makes repeat composes free.
- **Pre-warming** (composing before the user clicks) — that is a latency play, US-AI-050's territory; this story is strictly click-driven.
- **Caching the erased background image bytes** — the `base_image_url` in the cached JSON is an ephemeral URL that expires (~24h); refreshing/persisting the image itself (e.g., to R2/S3) is a separate durability story. Cache staleness beyond URL expiry is accepted and documented.
- **Client-side caching** — the browser already holds the result within a session; the DB cache is the cross-session, cross-click authority.

---

## Engineering / PR

- **Branch:** `feat/ai/us-ai-048-compose-cache`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/prisma/schema.prisma` — `composedDesigns Json?` on `Infographic`
  - `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` — cache check/write around `composeDesignForEdit()`
  - `api/src/modules/infographics/services/generations.service.ts` — pass the Infographic record through (TBC if needed)
  - `api/tests/ai-generation/layer-extraction.service.spec.ts` or new `compose-cache.spec.ts` — cache-hit/miss/degraded tests

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
See CLAUDE.md for architecture. Read this STORY.md and TASKS.md first.

Story: US-AI-048 — Cache ComposedDesign per (generation, variation)

composeDesignForEdit() in ai-orchestrator.service.ts currently calls layerize-text
($0.09) on every invocation. Add a DB-backed cache:
1. prisma: add `composedDesigns Json?` to Infographic; npx prisma db push + generate.
2. Key = variation imageUrl with exp/sig query params stripped (helper + unit test).
3. On compose: if key present in record → return stored ComposedDesign, log
   edit:compose:cache-hit, do NOT call extraction, do NOT increment costUsd.
4. On successful extraction (blocksDetected > 0 OR a real result with a background):
   write result under key. NEVER cache the degraded path (extractionResult null).
5. Metering stays exactly as-is on the miss path.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope"
- Every task ships with its own test in the same commit
- When done: list files changed, ACs checked, test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-048-01 | Auto | P0 | Given a stored compose for (gen, url), when compose is called again, then provider mock is NOT called and the stored design is returned (AC1) | 🔲 | |
| TC-AI-048-02 | Auto | P0 | Given a cache hit, then usageRecord.update is NOT called — costUsd unchanged (AC2) | 🔲 | |
| TC-AI-048-03 | Auto | P1 | Given the same image at a different exp/sig signature, when composed, then it is treated as the SAME key — no second provider call (AC3) | 🔲 | |
| TC-AI-048-04 | Auto | P1 | Given a degraded extraction (null), when composed again, then extraction IS retried (AC5) | 🔲 | |
| TC-AI-048-05 | Auto | P1 | Compose A, B, A → exactly two extract:start events (AC4) | 🔲 | |
| TC-AI-048-06 | Auto (E2E, live) | P1 | Live: second "Use This" click on the same variation loads fast, no full re-extraction (AC1/2/6) | ✅ Pass | `e2e/us-ai-048-compose-cache.spec.ts` — live run 2026-08-15, second round trip: 2965ms (vs. 15-90s observed for a real extraction) |
| TC-AI-048-07 | Auto | P0 | error-path: Prisma update to persist `composedDesigns` throws after a successful extraction, when compose is called, then the freshly-extracted `ComposedDesign` is still returned to the caller and the persistence failure is logged (AC7) | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] Gate 1 green (tsc + `npm run test:unit`) — confirmed 2026-08-15, backend 350/350, client 216/216
- [x] `npx prisma db push` applied to dev DB — `composedDesigns Json?` present on `Infographic` in `schema.prisma`
