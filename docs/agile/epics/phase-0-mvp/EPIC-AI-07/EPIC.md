# EPIC-AI-07 — Generation Progress Delivery Fix

> **Phase:** Phase 0 — MVP Launch (staging QA regression — blocks Task 2 sign-off → Task 3 production go-live)
> **Status:** 🔲 Not Started
> **Depends on:** None (fixes a regression in already-shipped EPIC-AI-00 US-AI-001 scope)
> **Linear Project:** LIN-EPIC-XXX
> **Target date:** 2026-07-11 (before Task 2 sign-off)
> **Owner:** Dinesh

---

## Goal

**Outcome:** A user who submits a generation on staging or production sees their result the moment it's ready — never stuck watching a frozen progress indicator after the infographic has actually finished generating.

**Why now:** Discovered 2026-07-09 during Phase 0 Task 2 staging QA (§2C live pass, `docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md`). Three real, unmocked generations were run against staging: **all three completed successfully server-side** (Railway logs confirm `gen:complete` at 22–27s each, `costUsd: 0.184` each, and `GenerationProgressGateway` logged `Emitted progress ... completed - Step 5` for every one) — but the browser UI never reflected it. It stayed frozen on "Analyzing your prompt / 20%" for 90+ seconds *after* the backend had already finished, in all 3 attempts (100% reproduction). This is exactly the failure mode anticipated by the Task 2 checklist's own note on Socket.io wiring — except EPIC-AI-00 US-AI-001 (Socket.io Gateway wiring) is already recorded ✅ Done, meaning this is either a regression or an environment-specific issue (e.g. Railway's WS proxying, or a frontend socket/state bug) that the existing test suite cannot catch — `e2e/us-design-003-generation-ux.spec.ts` explicitly **mocks Socket.io away** (`page.route` abort + `routeWebSocket` close) and relies on REST polling fallback only, so it structurally cannot exercise the code path that broke.

**Success metric:** Three consecutive real generations against staging each render their result cards in the browser within 30 seconds of the backend's own `gen:complete` timestamp — verified by repeating the exact live-pass methodology used to find this bug (see `docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md` §2C, 2026-07-09 QA Session Log entry).

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|--------|
| [M-AI-19-generation-progress-delivery](milestones/M-AI-19-generation-progress-delivery.md) | Root-cause + fix the delivery gap; add a client-side self-healing fallback | 2026-07-11 | 🔲 |

---

## Stories in this Epic

| Story ID | Title | Milestone | Status | PR |
|----------|-------|-----------|--------|----|
| [US-AI-034](stories/US-AI-034/STORY.md) | Diagnose and fix generation-progress delivery on staging | M-AI-19 | 🟡 Fix implemented + locally verified; AC3 staging re-test pending deploy | — |
| [US-AI-035](stories/US-AI-035/STORY.md) | Client-side fallback re-sync for stalled progress UI | M-AI-19 | ⏭️ Superseded by US-AI-034 (its fix already covers this scope) | — |

---

## Features in this Epic

| Feature ID | Scope | Stories |
|------------|-------|---------|
| F-AI-34 | Real-time progress delivery reliability | US-AI-034, US-AI-035 |

---

## Out of Scope (Epic Level)

- A live-Ideogram (non-mocked) automated regression test running in CI — same reason `us-design-003-generation-ux.spec.ts` mocks the pipeline today: real Ideogram calls cost money and can't run in CI. A staging-only synthetic monitor is a reasonable future follow-up, not this epic.
- Any change to the generation pipeline itself (prompt building, image model selection, V4 magic-prompt flow) — the backend already completes correctly and fast (22–27s); this epic is scoped to *delivery of that result to the browser*, not generation quality.
- Redesigning the progress UI's visual design — this is a functional-correctness fix, not a UX polish pass.

---

## Definition of Done (Epic)

- [ ] All milestones closed
- [ ] All stories have PR merged and STORY.md status = ✅ Done
- [ ] Re-verified on staging via a live (non-mocked) 3-generation pass — same methodology as the 2026-07-09 discovery session
- [ ] `npm run check` + `npm run test:unit` passing
- [ ] `docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md` §2C I-05/I-06 rows updated to reflect the fix, with a note pointing back to this epic
- [ ] AGILE_INDEX.md epic row updated to ✅ Done

---

## Architecture Notes

See [ARCHITECTURE.mmd](./ARCHITECTURE.mmd).

Key files relevant to this epic:
```
- api/src/modules/infographics/gateways/generation-progress.gateway.ts   (server-side Socket.io emitter — confirmed emitting correctly via Railway logs)
- client/src/hooks/useGenerationWebSocket.ts                             (client-side socket connection — PRIME SUSPECT, see below)
- client/src/components/ai-chat/AIChatBox.tsx                            (renders progress state from the hook's output)
- api/src/modules/infographics/controllers/infographics.controller.ts   (REST status/variations endpoints — the fallback path US-AI-035 will lean on)
- e2e/us-design-003-generation-ux.spec.ts                                (existing mocked test — cannot catch this class of bug; reference for the REST contract shape)
- docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md                             (§2C — original discovery evidence, screenshots, Railway log excerpts)
```

**Update 2026-07-09 (live verification, superseded the original hypothesis below):** a real (non-headless) browser pass via claude-in-chrome, with console + network logs cross-referenced against `railway logs` for the exact `generationId`, showed the socket **does** connect to the correct host and subscribe successfully — ruling out the original wrong-host theory. The real, confirmed anomaly: the socket **disconnects ~7 seconds after subscribing, within about 1 second of the backend's actual `gen:complete`**. A REST-polling fallback (location not yet identified in the codebase) caught the miss ~2-3s later and rendered results correctly in that run. The original headless-script pass (3/3 stuck, no self-heal within 2 minutes) may be explained by Chrome's aggressive JS-timer throttling on backgrounded/headless tabs suppressing that same fallback — which would mean real users who tab-switch away while waiting hit the identical failure. Full timeline and open questions: [US-AI-034](stories/US-AI-034/STORY.md) "Root Cause Findings".

<details>
<summary>Original hypothesis (2026-07-09, pre-live-verification — not the current lead, kept for reference)</summary>

`useGenerationWebSocket.ts:5-6` builds the socket URL from `VITE_API_URL` (`const WS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/^http/, 'ws')`). `VITE_API_URL` is absent from Railway staging's variables (confirmed via `railway variables` audit). Since Vite env vars are baked in at build time, the concern was that the deployed bundle ships with `ws://localhost:3001` hardcoded. **Live evidence shows the socket connects fine**, so this was not the primary cause — though the unusually slow ~21s time-to-connect is still unexplained and worth a quick look.

</details>

---

*Epic created: 2026-07-09 | Last updated: 2026-07-09*
