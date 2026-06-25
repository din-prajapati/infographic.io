# Story Card — US-AI-005

> **Status:** 🔲 Not Started
> **Feature:** F-AI-00-03 — Durable data persistence (extraction + conversations)
> **Epic:** [EPIC-AI-00](../../EPIC.md)
> **Milestone:** [M-AI-03-data-persistence](../../milestones/M-AI-03-data-persistence.md)
> **Linear:** LIN-US-AI-005
> **Created:** 2026-04-28 | **Closed:** —

---

## Story

*As a* real estate agent who wants to regenerate or refine an infographic
*I want* my extracted property data to be saved after initial generation
*So that* the regeneration flow works without a 404 error

---

## Acceptance Criteria

- [ ] **AC1:** After a generation run, a new row exists in the `Extraction` table in the database containing `conversationId`, `propertyAddress`, and the full `extractedData` JSON
- [ ] **AC2:** Calling the regeneration endpoint with the same conversation ID returns the saved extraction (no 404)
- [ ] **AC3:** The extraction is saved atomically — if the image generation fails, the extraction row should still be saved (extraction happens before image generation)
- [ ] **AC4:** `npm run check` passes

---

## Out of Scope

- UI changes
- Changing the extraction logic or GPT prompts
- Changing the Extraction Prisma schema (use existing schema)
- Conversation frontend wiring (US-AI-006)

---

## Engineering / PR

- **Branch:** `fix/ai-us-ai-005-persist-extraction`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/infographics/services/prompt-extractor.service.ts`

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001).
See CLAUDE.md for architecture.

Story: US-AI-005 — Persist Extraction data to database

Problem: prompt-extractor.service.ts calls GPT to extract property data but NEVER calls
prisma.extraction.create() to save the result. The Extraction table exists in schema but stays empty.
This causes regeneration flows to always 404.

Fix:
1. Read api/src/modules/infographics/services/prompt-extractor.service.ts
2. After successful GPT extraction, call prisma.extraction.create({
     data: {
       conversationId: <from params>,
       propertyAddress: extractedData.address,
       extractedData: extractedData (as JSON),
     }
   })
3. Use the singleton prisma import pattern: import { prisma } from '../../../database/prisma.client'
4. Do NOT change the extraction logic, GPT prompts, or response shape

Acceptance:
- AC1: Extraction table has new row after generation (verify in Prisma Studio)
- AC2: Regeneration endpoint returns 200 (not 404) for same conversation
- AC4: npm run check passes

IMPORTANT: Only touch prompt-extractor.service.ts. Do not refactor surrounding code.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-005-01 | Manual | P0 | Run a generation → open Prisma Studio → verify Extraction table has new row | 🔲 | |
| TC-AI-005-02 | Manual | P0 | Call regeneration endpoint with same conversationId → returns 200 not 404 | 🔲 | |
| TC-AI-005-03 | Manual | P1 | If image generation fails (bad API key), extraction row still exists in DB | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified via Prisma Studio
- [ ] PR merged (PR #{number})
- [ ] No console errors for the changed flow
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-04-28*
