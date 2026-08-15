# Backlog — Phase-Assigned Non-Blocking Items

> **What this is:** A lightweight, phase-wise list of known follow-ups and deferrals that are **not blocking** their surrounding work. Each item is a one-line placeholder — **a full STORY.md is written later, only when the item is actually scheduled** into a milestone. Until then it lives here so it isn't forgotten.
>
> **How to use:** When starting a phase, scan its table. Promote an item by running `/new-story` (or `/new-epic` if it's large), then change its Status to the story ID and strike it here.
>
> **Not the same as** the [Phase 4 deferred backlog](epics/phase-4-backlog/README.md) (B-01…B-15) — those are large, business-trigger-gated epics. This file is the running catch-all for smaller, phase-assigned follow-ups discovered during delivery.
>
> **ID scheme:** `BL-NN`, sequential, assigned-phase shown in the table. **Last updated:** 2026-07-09.

---

## Phase 1 — Revenue Strategy (v1.1)

| ID | Item | Domain | Priority | Source / Notes | Status |
|----|------|--------|:--------:|----------------|--------|
| BL-01 | **Socket.io generation progress not delivered on staging.** The granular step-by-step progress bar was cosmetic — the socket connects + subscribes but could deliver **zero `progress` events**. Also observed: **socket reconnect churn at completion** (~4 rapid connect/disconnect cycles). | AI | P2 (non-blocking) | Discovered during PT-09 fix / [EPIC-AI-07](epics/phase-0-mvp/EPIC-AI-07/EPIC.md) staging verification, 2026-07-09. | ✅ **Fixed 2026-08-14.** Root cause confirmed, not just the two hinted-at hypotheses: `generations.service.ts` emits `step:0` synchronously right after creating the DB record — before the HTTP response carrying the generation id can possibly have reached the client, let alone before a fresh socket.io handshake completes. Socket.io rooms don't buffer; `.to(room).emit()` on an empty room drops the event. Server fix: `generation-progress.gateway.ts` now caches the last progress payload per generation and replays it directly to any client that subscribes, regardless of timing (30s TTL past a terminal state) — 6 new tests, `api/tests/infographics/generation-progress.gateway.spec.ts`. Client fix: `useGenerationWebSocket.ts` used to tear down and recreate the **entire socket** every time `generationId` changed — it's set to `null` from 3 separate completion-handling paths in the callers, which is the reconnect churn. Split into two effects: socket lifecycle now depends only on the user (connect once, not per-generation); subscribe/unsubscribe messages travel over the same already-open socket as `generationId` changes. **Live-verified**, not just unit-tested: a real generation showed the client subscribing 10.6s after connecting — the exact race — and the replay delivered `step:0` 2ms after the subscribe ack; all 7 steps arrived in order; 0 disconnects during or after the run. |
| BL-02 | **Model-opacity violation on `/usage`.** The Usage Analytics page shows the raw model id **`ideogram-4`** in the "Cost Breakdown by AI Model" table — user-visible, violating Critical Rule #5 (users should never see model names). | AI / DESIGN | P2 | Found 2026-07-09 during Task 2 §2C live QA (`docs/testing/PHASE_0_HUMAN_QA_CHECKLIST.md`). Map internal model ids → user-facing labels ("Quick Generate" / "Campaign Quality" etc.) on the usage/cost surfaces. | ✅ Fixed 2026-07-11 — PT-11, PR #15 (`client/src/lib/modelLabels.ts`) |
| BL-03 | **`SESSION_SECRET` is a dead variable** — read nowhere in the codebase (`grep` clean); `env.validation.ts` documents it as deliberately absent from the schema. Already pruned from `.env.example` (US-LAUNCH-009). | INFRA | P3 | Found 2026-07-12 during US-LAUNCH-009 env enumeration. | ⚠️ **Staging done** — removed 2026-08-14. **Production still has it** — confirmed present, not removed (out of this pass's scope; production var changes deserve an explicit call, not a housekeeping-sweep default) |
| BL-06 | **Property extraction is hardcoded to `gpt-4o` — the Gemini migration never covered it.** `prompt-extractor.service.ts:104` pins `model: 'gpt-4o'`, while `ai-orchestrator.service.ts:56-57` routes only the *headline* call to `gemini-2.5-flash` for `free/solo/team`. Extraction runs on **every** generation before the headline, so an OpenAI outage or credit exhaustion fails generation for **all** plan tiers — including the tiers believed to have been migrated off OpenAI by PRs #9/#10. Single point of failure that the LLM-routing work did not remove. | AI / INFRA | **P1** | Found 2026-08-06 while trying to verify BL-05 Follow-up B: the local dev key returned `429 You have no credits remaining` and extraction failed outright, no fallback. **Not confirmed for production** — Railway holds its own keys — but the architecture means one provider's billing state can take down all generation. Worth a Task 3 pre-go-live check of OpenAI credit + `GEMINI_API_KEY` on Railway, and a decision on whether extraction should route like the headline does. | ✅ **Fixed 2026-08-14.** Confirmed `GEMINI_API_KEY` is set on both Railway staging and production (the "not confirmed for production" note above is stale) — so this had real impact, not just theoretical. Added `OpenAiService.extractStructuredData(systemPrompt, userPrompt, planTier)`, routing identically to `analyzeProperty()`: Gemini 2.5 Flash for `free/solo/team`, GPT-4o for `brokerage`, GPT-4o fallback when Gemini isn't configured. `prompt-extractor.service.ts` no longer reaches past `OpenAiService` via `(this.openAiService as any).openai` — it resolves `planTier` via a new `resolvePlanTier(organizationId)` helper (mirrors the orchestrator's own lookup, degrades to `''` non-fatally) and calls the new method. 10 new tests: `api/tests/ai-generation/openai.service.extract.spec.ts` (6, routing) + `api/tests/infographics/prompt-extractor.plan-tier.spec.ts` (4, tier resolution). Full Gate 1 green (tsc clean, backend 350/350, client 216/216). |
| BL-05 | **Locale org-default is plumbed but not persisted.** `resolveLocale()` accepts `orgDefault` and its precedence is unit-tested, but nothing populates it — no `Organization.defaultLocale` column, no migration, no settings control. The live chain is override → typed symbol → timezone → passthrough, which works; what's missing is a *settable* default, and with it brokerage-wide consistency. | GEN / AI | P3 (non-blocking) | US-GEN-003 finding **F1**, 2026-08-06. Three options costed (persist on Organization ~3–4h · localStorage first ~1h · delete the rung ~15m) with a recommendation and the reasoning, in [docs/research/2026-08-06-LOCALE-ORG-DEFAULT-OPTIONS.md](../research/2026-08-06-LOCALE-ORG-DEFAULT-OPTIONS.md). **Deliberately not decided** — a Prisma migration is poorly timed while production is still un-deployed behind Task 3. Same doc also logs two adjacent open defects (DEMO_MODE price regex truncating Indian numbers; no sale/rent axis on `PropertyInfo`). | 🔲 Not scheduled |
| BL-08 | **Editable-canvas text boxes wrap when the mapped font falls back to Inter — the "₹1.9 / Cr" regression AC5 targeted is still live.** `canvasState.ts:551` sizes each text element's box width straight from the extraction's measured geometry (`safeW = geo.width * scale`) with no adjustment for the font actually applied. `mapExtractedFont()` and the width calculation are fully independent. Font-mapping itself works correctly (AC1/2/4/6 live-verified) and Inter is the *documented, correct* fallback when an identifier is unrecognized — but Inter's glyphs are wider than whatever provider font the box was originally measured for, so text that fit on one line in the source image wraps to two in the editor. | AI | P2 | Found 2026-08-14 running the new live E2E regression test for US-AI-049 AC5 (`e2e/us-ai-049-font-mapping.spec.ts`) — screenshot evidence in `docs/agile/epics/phase-1-ai-core/EPIC-AI-06/stories/US-AI-049/evidence/`. | ✅ **Fixed 2026-08-15.** Re-measures each text element's width against the font actually resolved by `mapExtractedFont()` (not the raw extraction geometry) using a real 2D canvas context, and widens the box (never narrows) when the measured render is wider than the extraction's original box. Reused `connectLayout.ts`'s existing `createMeasureText()` — generalized to accept an optional `family` override rather than duplicating a second measurer (one implementation, per the US-AI-047/US-AI-050 lesson). tsc clean, backend 350/350, client 216/216, zero regressions. **Live-verified**: `e2e/us-ai-049-font-mapping.spec.ts` re-run confirms `lineCount: 1` — the price renders on one line even while still falling back to Inter (a different generation's font identifier, same fallback path, box now correctly widened to fit it). |
| BL-07 | **Real-photo editable fallback always uses the default template — no photo-aware selection.** `connectLayout.ts`'s `composeFromCanonicalValues` picks `templateId ?? DEFAULT_TEMPLATE_ID` unconditionally. `LayoutPlannerService.planLayout()` (GPT-4o Vision → templateId/scrimSide/palette, built in US-AI-044, 49 tests, DI-registered) would make this photo-aware but is wired to nothing. | AI | P3 | Surfaced 2026-08-14 resolving the US-AI-045 re-scope question (EPIC-AI-06/EPIC.md 2026-08-13 log): US-AI-045 as originally written — planner as the *primary* step of every editable generation — is superseded by extraction-led composition (`88db72d`), confirmed the higher-fidelity default. The planner's only remaining real job is this narrower one: wire it into the real-photo fallback path only (US-AI-051), replacing the fixed default with photo-aware selection. **Deliberately deferred, not built** — user's call, revisit if the real-photo flow's usage/complaints justify it. | 🔲 Not scheduled |
| BL-04 | **Dead payment env read-sites** — `PADDLE_*`, `PAYPAL_*` had read-sites in `server/payments/providers/payment-provider.factory.ts` and `server/routes.ts`'s webhook signature switch (not `ensure-database-url.ts` as originally noted — its `PG*` handling is a real, working fallback, not dead, just currently a no-op since `DATABASE_URL` is always set in prod; left untouched). | INFRA | P3 | Found 2026-07-12 (US-LAUNCH-009). | ✅ **Fixed 2026-08-14** — worse than unused reads: `isProviderAvailable('PADDLE'/'PAYPAL')` could report `true` (env var present) while `getProviderByType()` would still throw (no provider class exists) — a latent "listed as available, throws when used" bug. Both now correctly `return false`, unreachable webhook case removed. 4 new regression tests, `api/tests/payments/payment-provider.factory.spec.ts`. |

---

## Phase 2 — Polish & Self-Serve (v1.2)

| ID | Item | Domain | Priority | Source / Notes | Status |
|----|------|--------|:--------:|----------------|--------|
| _(none yet)_ | | | | | |

---

## Phase 3 — Speed & Batch (v1.3)

| ID | Item | Domain | Priority | Source / Notes | Status |
|----|------|--------|:--------:|----------------|--------|
| _(none yet)_ | | | | | |

---

## Unassigned / Needs triage

| ID | Item | Domain | Priority | Source / Notes | Status |
|----|------|--------|:--------:|----------------|--------|
| _(none yet)_ | | | | | |

---

## Adding an item

1. Pick the next `BL-NN`.
2. Add a row under the phase you're assigning it to (or "Unassigned" if unsure).
3. One-liner in **Item**, real source in **Source / Notes**. Do **not** write a STORY.md yet.
4. When scheduled: run `/new-story`, set **Status** to the resulting `US-…` ID, and mark the row done.

*Backlog created: 2026-07-09*
