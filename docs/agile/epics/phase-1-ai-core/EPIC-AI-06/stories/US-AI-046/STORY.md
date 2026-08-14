# Story Card — US-AI-046

> **Status:** ✅ Done — implemented, live-verified, superseded-in-part by a same-week finding (see Notes)
> **Feature:** F-AI-06-06 — Connect the layout engine to the editable canvas
> **Epic:** [EPIC-AI-06](../../EPIC.md)
> **Milestone:** [M-AI-18-editable-text-overlay](../../milestones/M-AI-18-editable-text-overlay.md)
> **Size:** M
> **Depends on:** [US-AI-043](../US-AI-043/STORY.md) (layout engine) — ✅ Done
> **Linear:** LIN-XXX
> **Created (retroactively, from commit history):** 2026-08-14 | **Shipped:** 2026-08-13 | **Closed:** 2026-08-14

---

## Why this story exists

**Retroactive card.** This story was implemented and merged straight from commits on 2026-08-13, without a STORY.md/TASKS.md contract-first pass — a documented gap (see `docs/agile/epics/phase-1-ai-core/EPIC-AI-06/EPIC.md`'s 2026-08-13 log and the standup that flagged it). Written now, after the fact, so the shipped capability has a real AC record instead of only a commit message.

US-AI-043 shipped the layout engine with 154 passing tests and zero callers. The "Edit" action on a generated variation still routed exclusively to layer extraction (US-AI-031b), which could not work at the time: OQ-2 (2026-08-12) established that the composition step produces backgrounds with no baked-in text, so extraction found nothing and every field fell back to inferred placement — editable mode returned a bare photo with no text.

This story connects `layoutDesign()` to the canvas loader and establishes it as the primary path, keeping extraction as a real fallback rather than deleting it.

---

## Story

*As a* solo real estate agent
*I want* the Edit action on a generated design to actually place my listing's text on the canvas
*So that* editable mode produces a usable design instead of a bare photo.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** `composeDesignForEdit()` (server) returns the canonical listing values (`canonicalValues`) alongside whatever layer extraction found, on both the success and the degraded-extraction path — verified: `composed-design.types.ts` gains the field; server tests pass.
- [x] **AC2 [happy-path]:** `connectLayout.ts` (client, new) composes a `ComposedDesign` from those canonical values using the layout engine, with a text measurer backed by a real 2D canvas context — verified: `connectLayout.spec.ts`, 11 new tests.
- [x] **AC3 [edge-case]:** The measurer falls back to a proportional estimate (`0.52 × fontSize × length`) when no 2D context is obtainable (jsdom / headless) rather than throwing — verified: `connectLayout.spec.ts` fallback-path test.
- [x] **AC4 [edge-case]:** `composeFromCanonicalValues` returns `null` (not an empty design) whenever there is nothing to lay out — no values, all blank, or an unknown template id — so the caller falls through to whatever extraction produced instead of rendering a blank canvas — verified: dedicated null-return test cases in `connectLayout.spec.ts`.
- [x] **AC5 [regression]:** The layout-engine path leads (tried first); layer extraction remains the fallback for a background that genuinely carries text (e.g. an imported flat design) — extraction is not deleted or bypassed entirely — verified: `AIChatBox.tsx`'s `handleEditVariation` ordering; extraction's own test suite (US-AI-031b) unaffected.
- [x] **AC6 [happy-path]:** In-canvas placement is correct — the specific x=0,y=0 defect (elements collapsing to the canvas origin) that motivated this connection does not reproduce — verified: `connectLayout.spec.ts` placement tests; confirmed live 2026-08-13 (canvas received populated coordinates, not the origin defect).
- [x] **AC7 [error-path]:** If neither the layout engine nor extraction produces usable output, the caller degrades to a flat load rather than showing a broken/empty canvas — verified: `planVariationLoad` (US-AI-047) inherits this contract; live-tested end to end this session.

---

## Out of Scope

- **Reachability from the UI** — this story only connects the engine to the loader function; whether either generation surface's UI actually calls it correctly was a *separate* bug, found and fixed the next day (see US-AI-047 and the Notes below).
- **Font typography mapping** — US-AI-049.
- **Compose result caching** — US-AI-048.
- **Choosing between layout-engine-first and extraction-first** — the ordering decided here was *revised the next day* (2026-08-13, commit `88db72d`) once the true root cause of extraction "not working" was found. See Notes.

---

## Engineering / PR

- **Branch:** `feat/ai/us-ai-046-layout-connector` (deleted post-merge, 2026-08-14 housekeeping)
- **PR:** — (merged directly to `main` via `b8601eb`, no PR opened — consistent with this repo's precedent for fast-moving same-day fixes)
- **Primary files touched:**
  - `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` — surface `canonicalValues` on both response paths
  - `api/src/modules/ai-generation/types/composed-design.types.ts` — add the field
  - `client/src/lib/api.ts` — thread the type through
  - `client/src/lib/layout/connectLayout.ts` (new) — the engine-to-canvas bridge
  - `client/src/lib/layout/__tests__/connectLayout.spec.ts` (new) — 11 tests
  - `client/src/components/ai-chat/AIChatBox.tsx` — route Edit through the new composer

---

## Notes (written retroactively, with the benefit of what was learned the following day)

1. **This story's central architectural call — layout-engine-first, extraction-fallback — was correct for the state of the world on 2026-08-13, and was *revised* on 2026-08-13 later the same day** once a second investigation found that extraction's 0% success rate was not a property of the endpoint but a bug: `layer-extraction.service.ts` sent JSON to an endpoint that only accepts `multipart/form-data`, 415-ing on every call since US-AI-031b shipped, silently swallowed into "no text detected." Once fixed (commit `eaf9b69`), extraction started working, and the ordering flipped to extraction-first (commit `88db72d`) because it reproduces the exact design the user chose rather than re-laying it out. `connectLayout.ts` from this story remains the correct fallback path for genuinely text-free backgrounds (the real-photo flow, US-AI-051).
2. **This story alone did not make editable mode usable.** It fixed *what* the Edit action would produce once reached — but a same-family reachability bug (generation id nulled before the Edit click could read it) meant the fixed code was still unreachable from either generation surface until US-AI-047 (Quick Generate) and a follow-up fix to the AI Chat conversation view (2026-08-14, commit `878c80c`) closed the loop. Three separate, independently-necessary fixes for one feature to actually work — see `EPIC-AI-06/EPIC.md`'s 2026-08-13/14 log entries for the full arc.
3. Gate 1 at ship time: 254 backend + 165 client, tsc clean.

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-046-01 | Auto | P0 | happy-path: canonicalValues present in composeDesignForEdit response, both success and degraded paths (AC1) | ✅ Pass | `composed-design.types.ts` + server tests |
| TC-AI-046-02 | Auto | P0 | happy-path: connectLayout composes a design from canonical values with a real-context measurer (AC2) | ✅ Pass | `connectLayout.spec.ts` |
| TC-AI-046-03 | Auto | P1 | edge-case: no 2D context available → proportional fallback, no throw (AC3) | ✅ Pass | `connectLayout.spec.ts` |
| TC-AI-046-04 | Auto | P1 | edge-case: nothing to lay out → returns null, not an empty design (AC4) | ✅ Pass | `connectLayout.spec.ts` |
| TC-AI-046-05 | Auto | P1 | regression: extraction path still reachable and unaffected when a background does carry text (AC5) | ✅ Pass | US-AI-031b suite unchanged |
| TC-AI-046-06 | Auto | P0 | happy-path: placed elements have real coordinates, not x=0,y=0 (AC6) | ✅ Pass | `connectLayout.spec.ts` + live 2026-08-13 |
| TC-AI-046-07 | Manual | P1 | error-path: no usable output from either path → flat degrade, not a broken canvas (AC7) | ✅ Pass | Live end-to-end run, 2026-08-14 (US-AI-051 E2E harness) |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] Gate 1 green at ship time (254 backend + 165 client)
- [x] Superseding decision (ordering flip) documented rather than silently overwritten — see Notes
