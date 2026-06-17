# Story Card — US-AI-002

> **Status:** ✅ Done
> **Feature:** F-AI-00-02 — Correct LLM model routing
> **Epic:** [EPIC-AI-00](../../EPIC.md)
> **Milestone:** [M-AI-01-critical-fixes](../../milestones/M-AI-01-critical-fixes.md)
> **Linear:** LIN-US-AI-002
> **Created:** 2026-04-28 | **Closed:** 2026-06-17

---

## Story

*As a* product owner
*I want* the AI orchestration to use `gpt-4o` instead of the non-existent `gpt-5` model ID
*So that* OpenAI API calls succeed reliably and cost tracking is accurate

---

## Acceptance Criteria

- [ ] **AC1:** `api/src/modules/ai-generation/services/openai.service.ts` uses `model: 'gpt-4o'` — the string `gpt-5` does not appear anywhere in the codebase
- [ ] **AC2:** `api/src/config/ai-models.config.ts` is updated — `gpt5PerRequest` renamed to `gpt4oPerRequest` with accurate cost ($0.004/request)
- [ ] **AC3:** A test generation run succeeds and the OpenAI dashboard shows a `gpt-4o` call (manual verification)
- [ ] **AC4:** `npm run check` passes

---

## Out of Scope

- Switching to a different LLM provider
- Changing prompt content or the `analyzeProperty` / `generateImagePrompt` logic
- Updating pricing tiers (separate story)

---

## Engineering / PR

- **Branch:** `fix/ai-us-ai-002-gpt-model-id`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/ai-generation/services/openai.service.ts`
  - `api/src/config/ai-models.config.ts`

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001).
See CLAUDE.md for architecture.

Story: US-AI-002 — Fix GPT model ID: gpt-5 → gpt-4o

Problem: openai.service.ts uses model: 'gpt-5' which does not exist as of April 2026.
All OpenAI calls silently fail or fall back to an unknown model.

Fix:
1. In api/src/modules/ai-generation/services/openai.service.ts: replace 'gpt-5' with 'gpt-4o'
2. In api/src/config/ai-models.config.ts: rename gpt5PerRequest to gpt4oPerRequest

Search for any other gpt-5 occurrences: grep -r "gpt-5" api/src/ --include="*.ts"
Replace ALL occurrences.

Do NOT change prompt content, response parsing, or any other logic.
Do NOT change pricing values (only the key name).

Acceptance:
- AC1: 'gpt-5' string absent from entire codebase
- AC2: ai-models.config.ts has gpt4oPerRequest
- AC4: npm run check passes
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-002-01 | Manual | P0 | Run a test generation → verify OpenAI dashboard shows gpt-4o model in usage | 🔲 | |
| TC-AI-002-02 | Auto | P0 | `grep -r "gpt-5" api/src/ --include="*.ts"` returns zero results | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified on `localhost:5000`
- [ ] PR merged (PR #{number})
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-04-28*
