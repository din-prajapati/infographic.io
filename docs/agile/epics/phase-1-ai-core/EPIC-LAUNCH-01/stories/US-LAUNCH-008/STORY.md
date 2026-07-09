# Story Card — US-LAUNCH-008

> **Status:** 🔲 Not Started
> **Feature:** F-LAUNCH-05 — Metering Policy
> **Epic:** [EPIC-LAUNCH-01](../../EPIC.md)
> **Milestone:** [M-LAUNCH-02-revenue-on](../../milestones/M-LAUNCH-02-revenue-on.md)
> **Size:** S
> **Linear:** LIN-XXX
> **Created:** 2026-07-07 | **Closed:** —

---

## Story

*As the* product operator turning revenue on
*I want* the metering policy — **1 generation = 1 credit, regardless of how many internal image calls it costs** — decided, documented, and guarded by tests
*So that* the unit customers pay for is a conscious pricing decision, not an accident of implementation (one V4 generation can cost ~3× image spend while decrementing `creditsUsed: 1`).

---

## Acceptance Criteria

- [ ] **AC1:** Policy documented in `docs/agile/PROJECT_CONTEXT.md` (Plan Tiers section) and CLAUDE.md plan-tier line: plan limits count **generations** (user-facing unit), `creditsUsed = 1` per generation; `costUsd` records true provider spend for margin analytics — the two are intentionally different numbers
- [ ] **AC2:** Unit test asserts both `UsageRecord` creation sites (`ai-orchestrator.service.ts` and `infographic.processor.ts`) write `creditsUsed: 1` per generation — a future multi-image pipeline change that silently writes 3 fails the test
- [ ] **AC3:** Unit test asserts `costUsd` still receives the actual per-call provider cost (not zeroed or averaged) at the same sites
- [ ] **AC4:** Usage-limit enforcement (`usage-limit.service.ts`) demonstrated by test to count credits, so FREE=3/mo means 3 generations even if each generation makes multiple image calls

---

## Out of Scope

- Changing plan prices, limits, or tiers
- Per-image or cost-based billing models
- Usage dashboard UI changes (Phase 2, EPIC-USAGE-01)
- Cost alerting (EPIC-OBS-00 M-OBS-02)

---

## Engineering / PR

- **Branch:** `test/launch-us-launch-008-metering-guard`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/tests/ai/metering-policy.spec.ts` (new)
  - `docs/agile/PROJECT_CONTEXT.md`
  - `CLAUDE.md` (one line in plan tiers)
  - `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` (comment only, if needed)

---

## AI Implementation Prompt

> Copy this block into Claude Code / Cursor to implement the story.

```
Context: InfographicAI SaaS — NestJS API. See CLAUDE.md. UsageRecord rows are created in
api/src/modules/ai-generation/services/ai-orchestrator.service.ts (~line 241) and
infographic.processor.ts (~line 93), both with creditsUsed: 1. usage-limit.service.ts
sums creditsUsed for plan enforcement.

Story: US-LAUNCH-008 — Metering policy guard (1 generation = 1 credit)

Write api/tests/ai/metering-policy.spec.ts (mock Prisma) asserting: (a) each generation
path creates exactly one UsageRecord with creditsUsed: 1; (b) costUsd on that record is
the actual provider cost passed in, unmodified; (c) usage-limit counting sums credits so
FREE=3 means 3 generations. Document the policy in PROJECT_CONTEXT.md Plan Tiers section
and one line in CLAUDE.md.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- No production logic changes — this story pins existing behavior as policy
- When done: list files changed, ACs checked, test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-LAUNCH-008-01 | Auto (unit) | P0 | Given a completed generation (orchestrator path), then exactly one UsageRecord with creditsUsed: 1 | 🔲 | |
| TC-LAUNCH-008-02 | Auto (unit) | P0 | Given a completed generation (processor path), then creditsUsed: 1 and costUsd = actual provider cost | 🔲 | |
| TC-LAUNCH-008-03 | Auto (unit) | P1 | Given 3 UsageRecords this month for a FREE org, then usage-limit reports the limit reached | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-07*
