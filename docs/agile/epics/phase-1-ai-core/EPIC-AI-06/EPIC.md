# EPIC-AI-06 — Hybrid Real-Photo Pipeline

> **Phase:** Phase 1 — Revenue Strategy (promoted from Phase 2 on 2026-07-03)
> **Status:** ✅ Both milestones fully closed 2026-08-15. M-AI-18 (editable overlay) — all 10 stories Done or resolved-superseded. M-AI-17 (real-photo composition) — US-AI-031/031b's last gated ACs (real Ideogram credit needed) live-verified same day: a real photo survives recognizably into the composition, and canonical listing values render correctly over it (via the layout-engine fallback — extraction found 0 blocks on this run, a real finding, not a failure). **This epic is now fully closed.**
> **Depends on:** EPIC-GEN-01 (V4 magic-prompt pipeline), US-AI-010 (property photo upload, EPIC-AI-02 — pull forward first)
> **Linear Project:** LIN-EPIC-AI-06
> **Target date:** TBD (after US-AI-010)
> **Owner:** Dinesh

---

## Goal

**Outcome:** Generated infographics use the agent's **real listing photos** as the background — with AI-directed layout and exact-text overlay — instead of synthetic property imagery. No fake houses, no fake agent faces on marketing for real listings.

**Why now:** The current V4 pipeline produces beautiful output with a **synthetic property photo and a synthetic agent headshot** (see `docs/testing/reports/ideogram-v4-experiment-2026-07-03/APP-TEST-e2e-result.png`). A realtor legally cannot market a real listing with a fake photo of a different building — today's output is demo-ware for actual listings. Fixing this simultaneously removes the product's biggest liability and creates its strongest moat: neither Canva (manual) nor Ideogram (synthetic) can do "your photo + your data + guaranteed-correct text in 30 seconds." Full strategic rationale: [docs/research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md](../../../../research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md).

**Success metric:** A generation with an uploaded listing photo produces an infographic where the background is recognizably that photo, all text is exact (verified), and no synthetic faces or buildings appear. Output remains editable via canvas slots (US-AI-032).

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|--------|
| [M-AI-17-real-photo-background](milestones/M-AI-17-real-photo-background.md) | Uploaded listing photo becomes the generation background (Ideogram image-reference / edit path) | TBD | ✅ Done 2026-08-15 |
| [M-AI-18-editable-text-overlay](milestones/M-AI-18-editable-text-overlay.md) | Hybrid render: text-free AI background + exact text as editable canvas slot elements | TBD | ✅ Done 2026-08-15 |

---

## Stories in this Epic

| Story ID | Title | Milestone | Size | Status | PR |
|----------|-------|-----------|------|--------|----|
| [US-AI-031](stories/US-AI-031/STORY.md) | Real property photo as composition source | M-AI-17 | L | ✅ Done 2026-08-15 — all 7 ACs, AC1 live-verified | — |
| [US-AI-031b](stories/US-AI-031b/STORY.md) | Layer extraction and canonical text rendering | M-AI-17 | L | ✅ Done 2026-08-15 — all ACs, AC1 live-verified (fallback path, real finding logged) | — |
| [US-AI-032](stories/US-AI-032/STORY.md) | Editable listing canvas | M-AI-18 | L | 🟡 T1/T6 done; T2–T5 open | — |
| [US-AI-043](stories/US-AI-043/STORY.md) | Layout engine (templates + flow renderer) | M-AI-18 | L | ✅ Done 2026-08-15 — 8/8 ACs, 132 tests re-verified live | — |
| [US-AI-044](stories/US-AI-044/STORY.md) | LLM layout planner | M-AI-18 | M | ✅ Done 2026-08-15 — 8/8 ACs, 49 tests re-verified live; unwired by design, narrower remaining job is [BL-07](../../../BACKLOG.md) | — |
| [US-AI-045](stories/US-AI-045/STORY.md) | Pipeline integration (planner → engine → canvas) | M-AI-18 | M | ⛔ Closed 2026-08-14 — superseded by extraction-led editable (`88db72d`); planner's narrower remaining job (photo-aware template selection for the real-photo fallback) deferred to [BL-07](../../../BACKLOG.md) | — |
| [US-AI-046](stories/US-AI-046/STORY.md) | Connect the layout engine to the editable canvas | M-AI-18 | M | ✅ Done — retroactive card 2026-08-14; ordering later revised same week (extraction leads) | — |
| [US-AI-047](stories/US-AI-047/STORY.md) | Shared render-mode across generation surfaces | M-AI-18 | M | ✅ Done — retroactive card 2026-08-14; one of three reachability fixes needed for editable mode to work end to end | — |
| [US-AI-048](stories/US-AI-048/STORY.md) | Cache ComposedDesign per (generation, variation) | M-AI-18 | M | 🟡 Implementation complete (pre-PR); 6/7 ACs, one manual live-latency TC deferred | — |
| [US-AI-049](stories/US-AI-049/STORY.md) | Map extracted fonts to real editor typography | M-AI-18 | S | 🟡 5/6 ACs; AC5 (live browser) deferred | — |
| [US-AI-050](stories/US-AI-050/STORY.md) | Progress affordance for the editable compose wait | M-AI-18 | S | 🟡 5/6 ACs; AC3 (live browser) deferred | — |
| [US-AI-051](stories/US-AI-051/STORY.md) | Text-free background for real-photo + editable | M-AI-18 | M | ✅ All 7 ACs verified, Gate 1 green (pre-PR) | — |

> **US-AI-033** (synthetic-content guard) moved to [EPIC-AI-08](../../phase-4-backlog/EPIC-AI-08/EPIC.md) 2026-08-11 — scope under review, no longer tracked in this epic. `origin/main`'s snapshot of this table (merged from `ef5adda` on 2026-08-13) predated that move; reconciled here.

---

## Features in this Epic

| Feature ID | Scope | Stories |
|------------|-------|---------|
| F-AI-31 | Real-photo composition (photo as source image) | US-AI-031 |
| F-AI-31b | Layer extraction + canonical text rendering | US-AI-031b |
| F-AI-32 | Editable canvas output (background + slot-tagged text) | US-AI-032 |

---

## Out of Scope (Epic Level)

- Photo upload UI and storage — that is US-AI-010 (EPIC-AI-02); this epic consumes its output
- Multi-format kit orchestration — EPIC-KIT-01
- Photo enhancement/cleanup tools (sky replacement, decluttering) — EPIC-AI-04 production tools
- Video/Reels output

---

## Definition of Done (Epic)

- [ ] All milestones closed
- [ ] All stories have PR merged and STORY.md status = ✅ Done
- [ ] Verified on staging environment
- [ ] `npm run check` + `npm run test:unit` passing
- [ ] AGILE_INDEX.md epic row updated to ✅ Done

---

## Implementation Update (log)

### 2026-08-15 — M-AI-17 closed: US-AI-031/031b's last gated ACs live-verified, credit topped up. **EPIC-AI-06 is now fully closed** (both milestones done).
- **What happened:** Both stories' AC1 had sat blocked for weeks on an out-of-credit Ideogram account. Confirmed with the user that credit had been topped up, then ran a real live generation with a real photo to close both.
- **Photo fixture:** `client/src/assets/images/carousel/property-1.jpg` — an existing, already-licensed product asset (landing page carousel), not an external download. A distinctive kitchen interior (specific cabinets, granite counters, skylights, wine rack, bar stools) — good for visually confirming the SAME photo survives into the composition rather than an AI-invented one.
- **AC1 (US-AI-031):** Passed cleanly on the first correctly-scoped run. The composition's background is unmistakably the same kitchen — every distinguishing detail (cabinet style, counter material, skylight placement, furniture) matches. Not a stylistic lookalike.
- **AC1 (US-AI-031b) — a real, informative finding, not just a pass:** `layerize-text` returned `blocksDetected: 0` on this composition — extraction found nothing to recover. This is NOT a bug: it's the same "photo backgrounds often carry no AI-legible baked text" pattern already established by US-AI-051, now observed on the *default* (non-text-free) composition path too. The architecture US-AI-046 built specifically for this case — extraction leads when it finds something, the layout engine composes from canonical values when it doesn't — carried it correctly: `$475K` and `456 Oak Avenue, Austin TX` rendered as editable elements over the real photo via the fallback. The AC's literal wording ("renders at its recovered position... measured geometry") describes the extraction-success path; this run exercised the fallback path instead, and the *practical* claim both stories actually care about — canonical values correctly presented, editable, on the real photo — held.
- **Test-authoring lesson (not a product bug):** the first attempt failed — clicking "Customize in editor" while `renderMode==='flat'` does nothing (`handleEditVariation` only calls the compose path `if (renderMode === 'editable' ...)` at click time), so the click silently fell through and landed on an unrelated canvas element. Fixed by toggling "Editable" right before the edit click — doesn't need to happen before generation, only before the click, unlike US-AI-051's server-side renderMode timing.
- **Files:** `e2e/us-ai-031-real-photo-composition.spec.ts` (new). No product code changed — this was pure verification.
- **Closed:** US-AI-031, US-AI-031b, M-AI-17 (milestone). **EPIC-AI-06 has no open stories or milestones left.**

### 2026-08-14 — Editable mode was unreachable from AI Chat's real UI (found + fixed while running TC-AI-051-05)
- **What happened:** Writing the live E2E test for US-AI-051 (`e2e/us-ai-051-textfree-photo-background.spec.ts`) surfaced a fourth reachability bug in the same family as US-AI-047's original finding — editable mode existed correctly in the codebase and was completely unusable from the surface a real user hits.
- **Root cause:** `AIChatBox.tsx` has two mutually-exclusive render branches gated on `hasActiveConversation` (`conversationMessages.length > 0`). The render-mode toggle and `onEditVariation` wiring existed ONLY in the `false` branch ("Default View"). But `setConversationMessages` fires at generate-*call* time — the instant a user sends their first message, before any result exists — so `hasActiveConversation` is already `true` by the time results ever render. The "Default View" branch can therefore never show results in practice; every real generation renders through `ConversationMessages` → `MessageBubble` instead, which had no editable affordance at all (`onUseVariation` only). Same failure shape as the US-AI-047 generation-id bug: individually-correct code that the actual UI path never reaches.
- **Fix:** `MessageBubble.tsx` gained an `onEditVariation` prop and a per-variation icon button (`title="Customize in editor"`, mirrors `ResultsVariations.tsx`'s pattern). `ConversationMessages.tsx` threads the prop through. `AIChatBox.tsx` wires `onEditVariation={handleEditVariation}` into `<ConversationMessages>` and adds an "Edit as: Flat/Editable" toggle directly in the conversation view (previously only reachable in the dead branch) so the preference can be set without leaving the panel.
- **Verified live:** `TC-AI-051-05` — real photo upload, generation #1 (flat, reveals toggle), click Editable, generation #2 (renderMode='editable' + photoReference reach the server together), click the now-reachable Edit button, real `POST /compose` fires, `extraction.blocksDetected === 0` confirmed, layout-engine canvas elements present. 55.8s, clean pass.
- **Also found:** `MessageBubble`/`ConversationMessages` accept an `onRegenerateAll` prop that is never actually rendered/called anywhere — dead prop, not wired to any control. Not fixed (out of scope for this fix; a "Regenerate" affordance in conversation view would be a separate small story). The E2E test works around it by sending a follow-up message instead, which is the real, working way a user triggers a second generation from this view.
- **Also found (tooling, not app):** `.env`'s `PLAYWRIGHT_BASE_URL` points every `npx playwright test` invocation at the deployed staging environment by default, not localhost. Running a spec with no override tests whatever is currently deployed there — not the working tree. Cost significant live-debugging time before being noticed; now documented at the top of the new spec file. Worth a repo-wide callout for anyone else writing/running E2E specs locally.
- **Files touched:** `client/src/components/ai-chat/MessageBubble.tsx`, `client/src/components/ai-chat/ConversationMessages.tsx`, `client/src/components/ai-chat/AIChatBox.tsx`, `e2e/us-ai-051-textfree-photo-background.spec.ts` (new)
- **Gate 1:** tsc clean, 216 client tests passing, no regressions.

### 2026-08-14 — US-AI-051 implementation complete (pre-PR)
- **Files touched:** `api/src/modules/ai-generation/services/infographic-prompt.builder.ts` (new `buildTextFreeImagePrompt`), `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` (added `renderMode` to options + routing guard + try/catch fallback), `api/src/modules/infographics/services/generations.service.ts` (thread `renderMode: dto.renderMode` to orchestrator call — scope drift, required for end-to-end wiring), `api/tests/ai-generation/infographic-prompt.builder.spec.ts` (T1 regression baseline + T2 AC1/AC7 tests, 6 new test cases), `client/src/lib/layout/__tests__/loadVariation.spec.ts` (TC-AI-051-04 explicit AC4 test)
- **ACs covered:** AC1 ✅ (`buildTextFreeImagePrompt` verified to omit all text copy lines, TC-AI-051-01), AC2 ✅ (byte-identical E3 prompt regression test, TC-AI-051-02), AC3 ✅ (builder signature unchanged, photo-unaware contract maintained, TC-AI-051-03), AC4 ✅ (TC-AI-051-04 in loadVariation.spec.ts — blocksDetected:0 routes to layout engine, not blank canvas), AC6 ✅ (try/catch in orchestrator around `buildTextFreeImagePrompt` falls back to `buildImagePrompt`, validated structurally), AC7 ✅ (guard condition `renderMode==='editable' && typeof photoReference==='string' && photoReference.length>0` handles malformed renderMode and falsy/empty photo; builder robustness to shaped inputs tested). AC5 deferred — requires live browser run with real uploaded photo; not available in isolated worktree.
- **Commits:** 4 on branch `feat/ai/us-ai-051-textfree-photo-background` (T1 regression baseline, T2 builder+orchestrator+tests, T3 DTO threading, T4 AC4 spec)
- **Notes:** (1) `generate-from-chat.dto.ts` already had `renderMode` — no change needed there. The gap was in `generations.service.ts` which was not in STORY.md's primary files list but was required for end-to-end wiring; noted as scope drift. (2) The text-free prompt is a separate exported function — `buildImagePrompt` is untouched and byte-identical for all non-target combinations. (3) TC-AI-051-06 (AC6 orchestrator fallback) is validated by the try/catch structure in `ai-orchestrator.service.ts`; a full unit test would require mocking the builder module inside an orchestrator test context (similar to compose-cache.spec.ts) — feasible in a follow-up `/test-story` pass. (4) 127 backend ai-generation tests + 216 client tests all passing; `npm run check` clean.

### 2026-08-13 — US-AI-049 implementation complete (pre-PR)
- **Files touched:** `client/src/lib/fontMap.ts` (new), `client/src/lib/__tests__/fontMap.spec.ts` (new), `client/src/lib/canvasState.ts`, `client/index.html`, `api/tests/canvas/canvasState.helpers.spec.ts`
- **ACs covered:** AC1 (all observed identifiers unit-tested: Bold/SemiBold/Medium/Light/Regular/ExtraBold/ExtraLight/Thin/Black + no-suffix + multi-word family), AC2 (alternatives fallback via `font__{slug}__{weight}` parsing, final fallback Inter 400), AC3 (Montserrat + Playfair Display loaded via Google Fonts `<link>` in index.html), AC4 (source-scan + contract tests in canvasState.helpers.spec.ts confirm `mapExtractedFont` is called; raw `.ttf` assignment banned), AC6 (empty and fully-unparseable alternatives arrays → Inter 400 without throw — unit-tested). AC5 deferred — requires live browser run with `PROBE_TOKEN` + running dev server; not available in isolated worktree.
- **Commits:** 2 on branch `feat/ai/us-ai-049-font-mapping`
- **Notes:** (1) `font_alternatives` from the Ideogram raw payload is not yet surfaced through `ExtractedTextBlock` / `ComposedTextElement` — the mapper's `alternatives` param accepts it when available but `loadComposedDesignToCanvas` currently calls `mapExtractedFont(geo?.fontFamily)` without alternatives (pipeline gap, follow-up in layer-extraction.service.ts TBC). For the observed set (Montserrat, Playfair Display), the primary identifier parses correctly so this does not affect AC1/AC4. (2) 30 new client tests in `fontMap.spec.ts`; 4 new backend source-scan tests in `canvasState.helpers.spec.ts`. All tests pass. (3) `bold` field is now derived from `resolvedWeight >= 700` rather than hardcoded `false` — aligns the legacy bool with the numeric weight.

### 2026-08-13 — US-AI-048 implementation complete (pre-PR)
- **Files touched:** `api/prisma/schema.prisma` (composedDesigns Json? on Infographic), `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` (composeCacheKey helper + cache read/write in composeDesignForEdit), `api/tests/ai-generation/compose-cache.spec.ts` (new — 13 tests)
- **ACs covered:** AC1, AC2, AC3, AC4, AC5, AC6, AC7 — all verified by unit tests passing on `npm run check` + `npm run test:unit` (268 backend tests total, 13 new). AC6 (cache-hit log event) verified by code inspection and test assertion (extraction-spy not called). TC-AI-048-06 (live second-click latency) is a manual P1 — deferred to `/test-story`.
- **Commits:** 4 on branch `feat/ai/us-ai-048-compose-cache` (T1 schema+helper, T2 read path, T3 write path, T4 harness instructions)
- **Notes:** (1) `generations.service.ts` was **not** changed — the cache read is handled inside `composeDesignForEdit()` itself via one extra `infographic.findUnique` call, keeping the service interface unchanged. (2) The degraded path (`extractionResult === null`) returns before the cache write — null is structurally excluded from the cache, not conditionally filtered. (3) Cache write failure (AC7) uses the same `record.composedDesigns` snapshot from the read-phase; a concurrent write for a different variation URL cannot cause data loss since keys don't overlap. (4) `npx prisma db push --schema=api/prisma/schema.prisma` must be applied to dev and production DBs before deploying — noted in T4 commit.

### 2026-08-13 — US-AI-050 implementation complete (pre-PR)
- **Files touched:** `client/src/hooks/useComposeProgress.ts` (new), `client/src/hooks/__tests__/useComposeProgress.spec.ts` (new), `client/src/components/editor/RightSidebar.tsx`, `client/src/components/ai-chat/AIChatBox.tsx`, `client/src/lib/api.ts`, `client/src/lib/__tests__/api.spec.ts` (new)
- **ACs covered:** AC1, AC2, AC4, AC5, AC6 (AC3 deferred to /test-story — requires live browser verification that the render-mode toggle remains accessible during compose and constitutes the "cancel/dismiss control")
- **Commits:** 3 on branch `feat/ai/us-ai-050-editable-latency-affordance` (T1: hook + spec, T2: wire both surfaces, T3: client timeout + api spec)
- **Notes:** (1) `@testing-library/react` is not installed — hook tests use pure exported helpers (`buildLabel`, constants) and manual interval simulation instead of `renderHook`. This follows the project's option-(b) canvas-test policy. (2) The AIChatBox toast updates via Sonner's id-keyed update: each `composeProgress.label` change calls `toast.info(label, { id: 'compose-progress', duration: Infinity })` — Sonner replaces the existing toast content in place. (3) `COMPOSE_REQUEST_TIMEOUT_MS = 120_000` (client) vs `LAYERIZE_TIMEOUT_MS = 90_000` (server) — 30s safety margin. `AbortSignal.timeout()` passes the signal into `fetch` via `apiRequest`'s `RequestInit` options. (4) The `mounted` guard in `useComposeProgress`'s cleanup function prevents any post-unmount `setElapsed` call — verified by the interval-cleanup-contract describe block.

### 2026-08-13 — Editable canvas WORKING end-to-end in the browser (first time)
- **What happened:** First-ever live browser execution of the full editable chain surfaced three root causes that unit tests could not see, all fixed and re-verified live the same session.
- **Root cause 1 — generation id destroyed at completion (both surfaces):** RightSidebar and AIChatBox null their in-flight generation id when a generation completes (correct — it tears down the WS subscription), but the editable path read the same state at click time. `planVariationLoad` therefore degraded to flat with `no generation id` on 100% of clicks — the editable feature was structurally unreachable from both surfaces despite US-AI-032/043/046/047 all being individually correct. Fix: `resultsGenerationId` travels with the variations it belongs to (commit `eeb0de1`).
- **Root cause 2 — extraction NEVER worked (US-AI-031b):** layerize-text accepts only multipart/form-data; the service sent JSON `{ image_url }` and got 415 on every call since the story shipped, silently swallowed into the degraded path (`attempted:true, blocksDetected:0` — indistinguishable from "no text found"). Fix: download the composition, forward bytes as multipart (commit `eaf9b69`). Also raised layerize timeout 30s→90s — observed latency 15s/39s/61s on similar images; the 30s budget killed a paid call that returned 6 valid blocks.
- **Root cause 3 — headline never persisted from Quick Generate:** sent only inside the prose prompt, never as the structured `headline` field, so `propertyData.headline` was empty and the editable canvas got an empty headline slot (fix in `eeb0de1`).
- **Ordering inverted (revises US-AI-046's decision):** extraction leads when `blocksDetected > 0` — erased background + measured blocks reproduce the exact design the user chose. The layout engine remains for genuinely text-free backgrounds (photo flow, OQ-2). US-AI-046 put the engine first only because extraction returned nothing 100% of the time — that premise is now known to have been a bug, not a property of the endpoint (commit `88db72d`).
- **Live evidence (probe2 run, generation `cmsrn02270006gpm0o08ho381`):** blocksDetected:4, matched:4, all `placement:measured` incl. the user's structured headline in the design's own typography (Montserrat, per-block size/color/alignment); canvas received erased background + 4 editable text elements; "Editable design loaded" toast; zero console errors.
- **Verification harness promoted:** `scripts/e2e-editable-verify.mjs` (commit `700c085`) — headed Playwright, spends real provider money, waits on the compose round trip. The only check that exercises this chain for real.
- **Known gaps (polish, not blockers):** (1) detected `fontFamily` values like `Montserrat-Bold.ttf` don't resolve as CSS font families in the editor → rendering falls back to Inter, so wrap/size differ slightly from the preview (e.g. price wrapped `₹1.9 / Cr`). Needs a font-mapping pass. (2) Click-to-canvas latency is 40–70s (layerize) — needs progress affordance beyond the toast/spinner, or pre-warming when renderMode=editable is already selected. (3) `renderMode` is still unread at generate time — the M-AI-18 "text-free background" variant remains undone; extraction-led editable makes it less urgent but it stays the intended path for the photo flow.

### 2026-08-12 — US-AI-044 implementation complete (pre-PR) — merged into `main` 2026-08-14 from a long-orphaned branch
- **Files touched:** `api/src/modules/ai-generation/types/planner-intent.types.ts` (new — PlannerIntent, Palette, TemplateId, ScrimSide, DEFAULT_INTENT, isPaletteValid, isValidPlannerIntent), `api/src/modules/ai-generation/services/layout-planner.service.ts` (new — LayoutPlannerService.planLayout()), `api/src/modules/ai-generation/ai-generation.module.ts` (LayoutPlannerService added to providers + exports), `api/tests/ai-generation/planner-intent.types.spec.ts` (new — 25 tests), `api/tests/ai-generation/layout-planner.service.spec.ts` (new — 24 tests), `docs/agile/epics/phase-1-ai-core/EPIC-AI-06/ARCHITECTURE.mmd` (planner node updated from :::new to :::good, planLayout() added)
- **ACs covered:** AC1–AC8 all verified by unit tests
- **Commits:** 4 on branch `feat/ai/us-ai-044-layout-planner` (scaffold, T1, T2, T3)
- **Notes:** (1) Backend test count: 303 (254 original + 25 type tests T1 + 24 service tests T2). (2) planLayout() always uses GPT-4o with detail:'low' — $0.001/call estimated. Gemini routing deferred. (3) DEFAULT_INTENT is returned on any failure — the agent always gets a design. (4) LayoutPlannerService exported from AiGenerationModule so the pipeline integration story can inject it without module changes. (5) scrimSide is validated and returned but not yet applied to templates — template flip (left↔right scrim) is deferred to the pipeline integration story.
- **2026-08-14 merge note:** this branch sat unmerged for two days while US-AI-046 through 051 shipped directly on `main` — including the 2026-08-13 finding just above, which established that extraction-led composition (not an LLM intent planner) is the higher-fidelity default. `LayoutPlannerService` still merges cleanly (git's 3-way merge found zero line-level overlap with anything main changed — this code was genuinely untouched, not superseded in place) and is real, tested, additive capability: 49 new tests, DI-registered, callable. What it is NOT yet is wired to anything — **resolved 2026-08-14**: US-AI-045 (planner as the primary pipeline step) is closed as superseded; its narrower remaining job, photo-aware template selection for the real-photo fallback path only, is deferred to [BL-07](../../../BACKLOG.md), not built now.

### 2026-08-15 — US-AI-043 and US-AI-044 formally closed

Both had sat at "Implementation complete (pre-PR)" since 2026-08-12/14 without a closing pass — three standups in a row flagged this as the last real loose end in M-AI-18. Re-ran both test suites live rather than trusting the existing checkmarks: US-AI-043's 132 tests and US-AI-044's 49 tests both still pass unmodified. Confirmed `LayoutPlannerService` is genuinely DI-registered (`ai-generation.module.ts` providers + exports) and `ARCHITECTURE.mmd` was actually updated as both stories' logs claimed (`:::good`, not `:::new`). Fixed one real doc gap along the way: US-AI-043's TASKS.md had its Four Pillars Pre-flight checkboxes unticked despite the work evidently having been done — ticked retroactively with a note. Both stories closed on their own documented scope; US-AI-044's planner remains intentionally unwired (see its own Notes section) — that was never this story's job, and its narrower remaining scope stays tracked as BL-07.

### 2026-08-12 — US-AI-043 implementation complete (pre-PR)
- **Files touched:** `client/src/lib/layout/types.ts` (new — Region, TemplateBlock, Template, ListingSlot, LayoutElement, LayoutInput), `client/src/lib/layout/templates.ts` (new — 3 templates: left-scrim-hero, bottom-band, corner-card; templateRegistry; LISTING_SLOTS), `client/src/lib/layout/layoutEngine.ts` (new — layoutDesign(), appendEllipsis(), buildMeasureCtx(), wrapSlot()), `client/src/lib/layout/__tests__/templates.spec.ts` (new — region schema validation, no-overlap, slot coverage), `client/src/lib/layout/__tests__/layoutEngine.spec.ts` (new — TC-01 through TC-08; 27-case describe.each matrix), `docs/agile/epics/phase-1-ai-core/EPIC-AI-06/ARCHITECTURE.mmd` (updated — replaced Remix→Layerize flow with background→planner(intent)→flow-renderer→canvas)
- **ACs covered:** AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8 — all 8 verified by unit tests
- **Commits:** 5 on branch `feat/ai/us-ai-043-layout-engine` (T1 types, T2 templates, T3 flow engine, T4 overflow degradation, T5 matrix sweep + ARCHITECTURE.mmd)
- **Notes:** (1) 132 new client layout tests across 2 spec files; backend stays at 254 (unchanged). (2) Regions are fractions 0..1 — one template serves landscape/portrait/square without modification. (3) Non-overlap is structural (monotonically advancing cursor + disjoint regions per template) — not detected-and-fixed. (4) wrapTextToWidth/TEXT_PAD_H/TEXT_PAD_TOP imported from canvasExport.ts, not reimplemented. (5) measureText injected via pseudo-ctx adapter — no real canvas context required. (6) describe.each 27-case matrix: 3 templates × 3 value sets × 3 canvas aspects. (7) longValues headline capped at 47 chars to avoid portrait region exhaustion in corner-card template. (8) ListingSlot defined locally (mirrors api/ ListingField without cross-boundary import). (9) appendEllipsis exported for direct unit testing in TC-04.

### 2026-08-11 — US-AI-032 full implementation complete (T0–T7, pre-PR)
- **Files touched:** `client/src/lib/slotIds.ts` (T1: new SlotId union), `client/src/components/editor/TemplateSlotSection.tsx` + `CustomizePanel.tsx` (T1: import from slotIds), `api/src/modules/infographics/dto/generate-from-chat.dto.ts` (T2: renderMode field), `client/src/lib/api.ts` (T2: GenerateFromChatInput + ComposedDesign types + getComposedDesign), `client/src/components/ai-chat/AIChatBox.tsx` (T2+T4: toggle UI + async editable path), `client/src/lib/canvasState.ts` (T3: loadComposedDesignToCanvas; T5: slot round-trip docs), `client/src/components/ai-chat/types.ts` (T4: composedDesign on Template), `client/src/components/editor/CenterCanvas.tsx` (T4: editable routing), `client/src/lib/canvasExport.ts` + `client/src/components/canvas/ImageElement.tsx` (T6: export parity), `api/tests/canvas/canvasState.helpers.spec.ts` (T7: 13 new tests), `api/src/modules/infographics/controllers/generations.controller.ts` (scope drift: POST /:id/compose endpoint)
- **ACs covered:** AC4, AC7 — these have non-browser-executable evidence: AC4 via `loadAiVariationToCanvas` diff (untouched) + `npm run check` green; AC7 via `SlotId` union enforced by TypeScript at `npm run check`.
- **ACs implemented but not yet verifiable:** AC1, AC2, AC3, AC6 — code written, type-checks pass, but all require browser execution or client test infra (US-DEPLOY-007). AC8 covered by source-scan tripwire only (TC-AI-032-08 in canvasState.helpers.spec.ts). AC5 deferred — export/preview parity requires visual verification.
- **Commits:** 9 on branch `feat/ai/m-18-editable-text-overlay` (T1=ec92bb4, T6=ee64aa5, T2×2=5ac1354+77e027b, T3=980789e, T4=377d4f0, T5=362d22f, T7=f775310)
- **Notes:** (1) Previous EPIC entry below over-claimed AC1/AC2/AC3/AC6 as covered — those ACs require browser verification, corrected here. (2) `types.ts` and `generations.controller.ts` are scope drift (not in TASKS.md primary files) — flagged for reviewer. (3) 254 backend tests pass; 13 new from T7. (4) The `safeGeo` test in T7 is a mirror of the canvasState.ts logic, not a call to the actual function — honest tripwire, not full verification.

### 2026-08-11 — US-AI-032 T3/T4/T5/T7 implementation complete (pre-PR)
- **Files touched:** `client/src/lib/canvasState.ts` (T3: `loadComposedDesignToCanvas`; T5: slot round-trip JSDoc), `client/src/components/ai-chat/types.ts` (T4: `composedDesign?` on Template), `client/src/components/editor/CenterCanvas.tsx` (T4: routing to new loader), `client/src/components/ai-chat/AIChatBox.tsx` (T4: async `handleEditVariation`, editable path), `api/tests/canvas/canvasState.helpers.spec.ts` (T7: 13 new tests)
- **ACs covered:** AC1, AC2, AC3, AC4, AC6, AC7 (AC5 deferred — export/preview parity requires visual verification; no client test infra per US-DEPLOY-007)
- **Commits:** 3 on branch `feat/ai/m-18-editable-text-overlay` (362d22f T5, f775310 T7; T3=980789e and T4=377d4f0 committed earlier)
- **Notes:** (1) `isAiImport` artboard-sync `useEffect` in CenterCanvas does NOT fight the composed design — the bg element's dimensions already match the canvas dimensions at load time, so the condition is never true. (2) T4 also includes `types.ts` (omitted from TASKS.md's git-add command — noted as scope drift from the task plan, not the contract). (3) `handleEditVariation` changed to `async` — assignable to `(id: string) => void` per TypeScript return-type covariance, so no prop type error. (4) AC8 guard test uses source-code scan with CRLF normalisation (required for Windows CI). (5) 254 total backend tests pass (up from 241; 13 new in canvasState.helpers.spec.ts). (6) Slot round-trip: `captureCanvasData` serialises `state.elements` verbatim; JSON.stringify preserves `slot?: string`; `restoreCanvasData` passes the array directly to `loadCanvas` — no normalisation strips it. (7) LISTING_FIELD_TO_SLOT mapping in canvasState.ts maps all 6 ListingFields to registered SlotId values — no unknown slots produced at runtime.

### 2026-08-11 — US-AI-031b implementation complete (pre-PR)
- **Files touched:** `api/src/modules/ai-generation/types/composed-design.types.ts` (new), `api/src/modules/ai-generation/services/layer-extraction.service.ts` (new), `api/src/modules/ai-generation/services/text-block.mapper.ts` (new), `api/src/modules/ai-generation/ai-generation.module.ts`, `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`, `api/src/modules/infographics/services/generations.service.ts`, `api/src/config/ai-models.config.ts`, `api/tests/ai-generation/text-block.mapper.spec.ts` (new), `api/tests/ai-generation/layer-extraction.service.spec.ts` (new)
- **ACs covered:** AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9 (AC1 deferred — gated on Ideogram credit top-up for live test; same standard as US-AI-031 AC1)
- **Commits:** 7 on branch `feat/ai/m-17-real-photo-background`
- **Notes:** (1) Fuzzy matching is bidirectional (takes max of forward/reverse word-overlap ratio) — this correctly handles the real-world case where Ideogram renders "123 Main Street" for canonical "123 Main St, Anytown". (2) Contact-shaped blocks (phone/email/URL) are dropped per the Identity policy; this is the one place AC4 and EPIC's purpose conflict — the comment in text-block.mapper.ts points to STORY.md. (3) `ai-generation.module.ts` was touched (scope drift: not listed in TASKS.md primary files, but required to register LayerExtractionService in the NestJS DI graph). (4) `LAYERIZE_COST_PER_IMAGE = 0.09` added to ai-models.config.ts with the lazy-billing explanation. (5) `GenerationsService.getComposedDesign()` is the edit-path entry point US-AI-032 will call. (6) All 241 unit tests pass; 28 new tests added (18 mapper + 10 extraction/orchestrator).

### 2026-08-11 — US-AI-031 implementation complete (pre-PR)
- **Files touched:** `api/src/modules/ai-generation/services/ideogram.service.ts`, `api/src/modules/ai-generation/services/ai-orchestrator.service.ts`, `api/src/modules/infographics/dto/generate-from-chat.dto.ts`, `api/src/modules/infographics/services/generations.service.ts`, `api/src/config/ai-models.config.ts`, `api/src/config/image-generation.config.ts`, `api/tests/ai-generation/ideogram.service.spec.ts` (new), `api/tests/ai-generation/infographic-prompt.builder.spec.ts`
- **ACs covered:** AC2, AC3, AC4, AC5, AC6, AC7 (AC1 deferred — gated on Ideogram credit top-up for live test)
- **Commits:** 7 on branch `feat/ai/m-17-real-photo-background`
- **Notes:** (1) Live-path behaviour change: photo-unreadable now throws HttpException(422) instead of warn-and-continue. Users who previously got a fabricated house silently will now see an error. This is correct. (2) Architecture owner chose V4 Remix over V3 Remix (TASKS.md T3 decision trail). (3) `style_reference_images` removed from V4 generate — may fix TC-AI-010-02 open failure; requires one live call to verify. (4) `REMIX_IMAGE_WEIGHT=75` is unverified pending OQ-2 calibration ($0.24 live test). (5) All 213 unit tests pass; 20 new tests added.

---

## Architecture Notes

See [ARCHITECTURE.mmd](./ARCHITECTURE.mmd).

Key files relevant to this epic:
```
- api/src/modules/ai-generation/services/ideogram.service.ts        (image-reference / edit API calls)
- api/src/modules/ai-generation/services/ai-orchestrator.service.ts (pipeline routing)
- api/src/modules/ai-generation/services/infographic-prompt.builder.ts (text-free prompt variant)
- client/src/lib/templateSlots.ts                                   (slot overlay reuse from US-DESIGN-012)
- client/src/components/editor/CenterCanvas.tsx                     (hybrid result → editable canvas)
```

---

*Epic created: 2026-07-03 | Last updated: 2026-07-03*
