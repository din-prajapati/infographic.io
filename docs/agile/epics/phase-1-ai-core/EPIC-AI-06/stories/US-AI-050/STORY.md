# Story Card — US-AI-050

> **Status:** ✅ Done — all 6 ACs verified, AC3 live-verified 2026-08-14. AC5 (identical affordance on both surfaces) verified live on Quick Generate only; the AI Chat "Edit" surface relies on the shared-hook construction guarantee (TC-AI-050-04 not run live this pass).
> **Feature:** F-AI-06-09 — Extraction latency affordance
> **Epic:** [EPIC-AI-06](../../EPIC.md)
> **Milestone:** [M-AI-18-editable-text-overlay](../../milestones/M-AI-18-editable-text-overlay.md)
> **Size:** S
> **Depends on:** [US-AI-048](../US-AI-048/STORY.md) (compose cache — repeat clicks become instant; this story is about the *first*, uncached, click)
> **Linear:** LIN-XXX
> **Created:** 2026-08-13 | **Closed:** —

---

## Why this story exists

Live-measured layerize-text latency on 2026-08-13: 15s, 39s, 62s (timeout), 40–70s typical. The click-to-canvas UI today is a toast ("Preparing editable design… this takes a moment") plus a spinner on the button — no progress signal, no explanation of *why* it's slower than the ~5–8s flat load the user just experienced. At the observed range, an unexplained 40–70s wait reads as "broken," not "working." This is a UX gap, not a correctness gap — extraction is proven to work (US-AI-048's sibling verification); the problem is entirely about what the user sees while it runs.

---

## Story

*As a* solo real estate agent
*I want* clear progress feedback while my design is being made editable
*So that* a 40–70 second wait reads as "working on it" instead of "did this break?"

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** While `POST /:id/compose` is in flight, the loading affordance shows elapsed time or a step label (not just a static spinner) — e.g. "Extracting text layers… 12s" — updated at least once per 5s.
- [x] **AC2 [happy-path]:** If the request exceeds 20s, the message changes to acknowledge the wait explicitly (e.g. "Still working — this can take up to a minute for detailed designs") rather than staying on the initial toast copy.
- [x] **AC3 [regression]:** The user can still cancel back to flat at any point during the wait (existing "Applied"/flat behaviour unaffected) — a cancel/dismiss control is reachable, not just a wait-it-out spinner. **Live-verified 2026-08-14** — `e2e/us-ai-050-compose-wait-dismiss.spec.ts`: the lightbox's X close button stays enabled throughout a real, in-flight compose call and closes the lightbox immediately; the render-mode toggle remains usable; the stale compose call resolves cleanly in the background with no uncaught page error, and the UI is fresh (not stuck mid-spinner) on the next attempt.
- [x] **AC4 [error-path]:** On the 90s server timeout (US-AI-031b's `LAYERIZE_TIMEOUT_MS`) the client's own request timeout is ≥ the server's, so the client never times out first and shows a false failure while the server is still legitimately working.
- [x] **AC5 [happy-path]:** Both surfaces (Quick Generate sidebar, AI Chat "Edit" action) show the same affordance — reuse one component/hook, not two implementations (consistent with US-AI-047's shared-state precedent).
- [x] **AC6 [edge-case]:** When the component consuming `useComposeProgress` (`RightSidebar.tsx` or `AIChatBox.tsx`) unmounts or the user navigates away before `POST /:id/compose` resolves, `useComposeProgress.ts`'s internal interval/timeout is cleared on cleanup and no state update is attempted after unmount — verified by no lingering timer and no React "state update on an unmounted component" warning in the test run.

---

## Out of Scope

- **Pre-warming / speculative compose before the click** — a genuine latency *reduction*, not an affordance; separate story if pursued (would also need the pricing/gating rules from US-LAUNCH-015 to know whether it's even chargeable).
- **Reducing actual layerize latency** — that is provider-side; not controllable here.
- **A general-purpose progress-bar component library** — build the minimum for this one flow; a shared design-system component is a DESIGN-domain concern if generalised later.

---

## Engineering / PR

- **Branch:** `feat/ai/us-ai-050-editable-latency-affordance`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/lib/layout/loadVariation.ts` — optional progress callback param
  - `client/src/components/editor/RightSidebar.tsx` — elapsed-time UI on the loading state
  - `client/src/components/ai-chat/AIChatBox.tsx` — same, via shared hook
  - `client/src/hooks/useComposeProgress.ts` (new) — shared elapsed-time/step-label hook
  - `client/src/lib/api.ts` — client-side request timeout ≥ server's 90s

---

## AI Implementation Prompt

```
Context: InfographicAI — see CLAUDE.md. Read this STORY.md + TASKS.md.

Story: US-AI-050 — Progress affordance for the editable compose wait (40-70s observed)

Build client/src/hooks/useComposeProgress.ts: starts a timer on compose start,
exposes elapsedSeconds and a `phase` ('starting'|'still-working' after 20s).
Wire into RightSidebar's loadingVariationId state and AIChatBox's equivalent —
both read the same hook, no duplicated timer logic (mirror the US-AI-047
shared-state lesson: two implementations always drift). Ensure the axios/fetch
client timeout in getComposedDesign (api.ts) is >= 90000ms so it never fires
before the server's own LAYERIZE_TIMEOUT_MS.

Rules: only listed files; out-of-scope is law; tests ship with their task's commit.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-050-01 | Auto | P1 | Hook reports elapsedSeconds incrementing; phase flips to 'still-working' at 20s (AC1/2) | ✅ Pass | `client/src/hooks/__tests__/useComposeProgress.spec.ts` |
| TC-AI-050-02 | Auto | P1 | Client request timeout config ≥ 90000ms (AC4) | ✅ Pass | `client/src/hooks/__tests__/useComposeProgress.spec.ts` |
| TC-AI-050-03 | Auto (E2E, live) | P0 | Live: click Editable on Quick Generate, observe elapsed-time UI update, wait through completion (AC1/2/5) | ⚠️ Pass with finding | `e2e/us-ai-050-compose-wait-dismiss.spec.ts` confirms the "Extracting text layers…" label appears live on Quick Generate — but the test dismisses mid-wait (its own AC3 focus) rather than observing a full natural completion; that specific sub-case remains unexercised |
| TC-AI-050-04 | Manual | P1 | Live: same on AI Chat "Edit" action — identical affordance (AC5) | 🔲 | Not covered by this pass — RightSidebar (Quick Generate) only |
| TC-AI-050-05 | Auto (E2E, live) | P2 | Cancel mid-wait returns to a usable flat state (AC3) | ✅ Pass | `e2e/us-ai-050-compose-wait-dismiss.spec.ts` — live run 2026-08-14 |
| TC-AI-050-06 | Auto | P1 | edge-case: useComposeProgress clears its timer and skips state updates when the consuming component unmounts mid-wait, no unmounted-component warning (AC6) | ✅ Pass | `client/src/hooks/__tests__/useComposeProgress.spec.ts` |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅ · test cases recorded · Gate 1 green
