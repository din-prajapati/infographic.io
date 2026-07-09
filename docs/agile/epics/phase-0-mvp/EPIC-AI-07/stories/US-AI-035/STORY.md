# Story Card — US-AI-035

> **Status:** ⏭️ Superseded by US-AI-034 (2026-07-09) — the US-AI-034 fix already implemented this story's entire scope
> **Feature:** F-AI-34 — Real-time progress delivery reliability
> **Epic:** [EPIC-AI-07](../../EPIC.md)
> **Milestone:** [M-AI-19-generation-progress-delivery](../../milestones/M-AI-19-generation-progress-delivery.md)
> **Size:** M
> **Depends on:** US-AI-034 should land first (fixing the actual root cause) — this story is defense-in-depth, not a substitute for it.
> **Linear:** LIN-XXX
> **Created:** 2026-07-09 | **Closed:** —

---

> **⏭️ SUPERSEDED — no separate work needed.** When US-AI-034's root cause turned out to be *the fallback itself being unreliable* (gated behind `onError`, and timer-throttled in background tabs), the fix necessarily became exactly what this story describes: an always-on REST re-sync poll, independent of socket health, with a `visibilitychange` catch-up for background throttling and a completion guard against double-processing. All of AC1–AC5 below were satisfied by the US-AI-034 change in `client/src/components/ai-chat/AIChatBox.tsx`. Keeping this card as a record; do not implement it separately. Close alongside US-AI-034 once staging re-verification (US-AI-034 AC3) passes.

---

## Story

*As a* real estate agent whose generation's live-progress event fails to arrive for any reason (WebSocket blip, proxy hiccup, a future regression nobody's found yet)
*I want* the app to notice my progress UI has stalled and quietly check on my behalf
*So that* no single delivery-mechanism failure can strand me on a frozen screen again — the way US-AI-034's bug did.

---

## Acceptance Criteria

- [ ] **AC1:** If no `progress` socket event has been received for a generation within **15 seconds** of the last update (or since subscribing, if none yet), `useGenerationWebSocket` (or a wrapping hook) issues a one-off `GET /api/v1/infographics/generations/:id/status` REST call to check real status directly — reusing the existing endpoint the mocked E2E test already exercises
- [ ] **AC2:** If that REST check reports `status: "completed"`, the UI transitions to the results view exactly as it would from a socket `progress` event — same code path, no separate rendering logic to maintain
- [ ] **AC3:** If the REST check reports `status: "processing"`, the fallback backs off and re-checks again after another 15s (bounded — stop after 8 attempts / 2 minutes total, then show a "taking longer than usual" state rather than polling forever)
- [ ] **AC4:** This fallback runs alongside the socket connection, not instead of it — when sockets work normally (the common case), the fallback never fires because `progress` events keep arriving on schedule
- [ ] **AC5:** Existing mocked E2E test (`e2e/us-design-003-generation-ux.spec.ts`) still passes — its REST route mocks (`**/generations/*/status`) already match this fallback's request shape, so no test changes should be needed unless timing assumptions conflict

---

## Out of Scope

- Fixing the actual root cause of the original socket delivery failure — that's US-AI-034; this story is a safety net, not the fix
- Replacing Socket.io with pure polling — sockets remain the primary mechanism; this is a bounded fallback only
- Any change to the backend `GenerationProgressGateway` or the REST status endpoint's response shape
- Retry/backoff tuning beyond the fixed 15s/8-attempt bound specified in AC3 — ship the simple version, revisit only if real usage shows it's wrong

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-035-progress-fallback-resync`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/hooks/useGenerationWebSocket.ts`
  - `api/src/modules/infographics/controllers/infographics.controller.ts` (read-only reference — confirm the status endpoint's exact response shape, do not modify)
  - `e2e/us-design-003-generation-ux.spec.ts` (verify only — should not need edits per AC5)

---

## AI Implementation Prompt

> Copy this block into Claude Code / Cursor to implement the story.

```
Context: InfographicAI SaaS — React frontend. See CLAUDE.md. This story follows US-AI-034
(which should fix the root cause of a generation-progress delivery bug found 2026-07-09 —
see docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md §2C and EPIC-AI-07/EPIC.md for full context).

Story: US-AI-035 — Client-side fallback re-sync for stalled progress UI

Add a bounded, self-healing fallback to client/src/hooks/useGenerationWebSocket.ts: if no
'progress' socket event arrives within 15s of subscribing or the last event, issue a single
GET /api/v1/infographics/generations/:id/status REST call (same endpoint already mocked in
e2e/us-design-003-generation-ux.spec.ts at **/generations/*/status). If status is
"completed", route through the exact same completion handling the socket path would use —
do not duplicate rendering logic. If "processing", wait another 15s and check again, capped
at 8 attempts (~2 minutes total), after which show a "taking longer than usual" state. This
fallback must be inert when sockets are working normally — it should never fire in the
common case.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT modify the backend status endpoint or its response shape
- Do NOT replace the socket connection — this is additive, not a replacement
- When done: list files changed, ACs checked, test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-035-01 | Auto (unit) | P0 | Given no progress event for 15s, when the fallback fires, then it calls the status endpoint exactly once | 🔲 | |
| TC-AI-035-02 | Auto (unit) | P0 | Given the fallback's status check returns "completed", then the UI transitions to results via the same handler as a socket event would | 🔲 | |
| TC-AI-035-03 | Auto (unit) | P1 | Given 8 consecutive "processing" responses, then polling stops and a "taking longer" state shows, not an infinite loop | 🔲 | |
| TC-AI-035-04 | Auto (E2E) | P0 | `e2e/us-design-003-generation-ux.spec.ts` still passes unmodified | 🔲 | |
| TC-AI-035-05 | Manual | P1 | Given a normal working socket connection, the fallback never fires (no extra status calls in the network tab) | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified on `localhost:5000` and re-confirmed on staging
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-09*
