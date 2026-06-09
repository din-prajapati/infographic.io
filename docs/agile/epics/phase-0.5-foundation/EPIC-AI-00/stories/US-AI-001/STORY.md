# Story Card — US-AI-001

> **Status:** 🔲 Not Started
> **Feature:** F-AI-00-01 — Real-time generation progress via Socket.io
> **Epic:** [EPIC-AI-00](../../EPIC.md)
> **Milestone:** [M-AI-01-critical-fixes](../../milestones/M-AI-01-critical-fixes.md)
> **Linear:** LIN-US-AI-001
> **Created:** 2026-04-28 | **Closed:** —

---

## Story

*As a* real estate agent generating an infographic
*I want* to see live progress updates while my infographic is being created
*So that* I know the system is working and roughly how long to wait

---

## Acceptance Criteria

- [ ] **AC1:** `GenerationProgressGateway` is registered in the NestJS module providers so it is instantiated and accepts WebSocket connections
- [ ] **AC2:** During a generation run, the browser receives `generation:progress` events over Socket.io (visible in browser network → WS tab)
- [ ] **AC3:** The existing `useGenerationWebSocket` hook in the frontend receives and displays these events (progress steps appear in the chat panel)
- [ ] **AC4:** `npm run check` passes after changes

---

## Out of Scope

- Any changes to the progress event payload structure
- Frontend UI redesign of the progress display
- New event types beyond what `GenerationProgressGateway` already emits

---

## Engineering / PR

- **Branch:** `fix/ai-us-ai-001-socket-gateway`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `api/src/modules/infographics/infographics.module.ts` (add gateway to providers)
  - `api/src/app.module.ts` (verify module import if needed)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — NestJS API (port 3001) + React frontend (port 5000 via Express proxy).
See CLAUDE.md for architecture. Socket.io is @nestjs/websockets.

Story: US-AI-001 — Wire Socket.io Gateway to AppModule

Problem: GenerationProgressGateway exists but is NOT registered in any NestJS module providers.
All Socket.io progress events emitted during image generation are silently dropped.

Fix:
1. Find GenerationProgressGateway (search for @WebSocketGateway in api/src/)
2. Add it to the providers array of the module that owns it (likely InfographicsModule)
3. Verify the module is imported in AppModule
4. Do NOT change the gateway logic, payload structure, or event names

Acceptance:
- AC1: Gateway registered in providers
- AC2: Browser WS tab shows generation:progress events during generation
- AC4: npm run check passes

Files to touch: infographics.module.ts (and app.module.ts only if needed)
Do NOT implement anything in Out of scope above.
When done: list files changed, ACs checked, command to verify.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-001-01 | Manual | P0 | Start a generation → open browser network WS tab → verify `generation:progress` frames appear | 🔲 | |
| TC-AI-001-02 | Manual | P0 | Progress steps appear in the AI chat panel during generation (not blank) | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

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
