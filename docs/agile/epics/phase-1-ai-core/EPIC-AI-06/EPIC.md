# EPIC-AI-06 — Hybrid Real-Photo Pipeline

> **Phase:** Phase 1 — Revenue Strategy (promoted from Phase 2 on 2026-07-03)
> **Status:** 🔲 Not Started
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
| [M-AI-17-real-photo-background](milestones/M-AI-17-real-photo-background.md) | Uploaded listing photo becomes the generation background (Ideogram image-reference / edit path) | TBD | 🔲 |
| [M-AI-18-editable-text-overlay](milestones/M-AI-18-editable-text-overlay.md) | Hybrid render: text-free AI background + exact text as editable canvas slot elements | TBD | 🔲 |

---

## Stories in this Epic

| Story ID | Title | Milestone | Size | Status | PR |
|----------|-------|-----------|------|--------|----|
| [US-AI-031](stories/US-AI-031/STORY.md) | Real property photo as composition source | M-AI-17 | L | 🟡 AC2–AC7 done; AC1 gated on credit | — |
| [US-AI-031b](stories/US-AI-031b/STORY.md) | Layer extraction and canonical text rendering | M-AI-17 | L | 🟡 AC2–AC9 done; AC1 gated on credit | — |
| [US-AI-032](stories/US-AI-032/STORY.md) | Editable listing canvas | M-AI-18 | L | 🟡 T1/T6 done; T2–T5 open | — |
| [US-AI-043](stories/US-AI-043/STORY.md) | Layout engine (templates + flow renderer) | M-AI-18 | L | 🟡 Implementation complete (pre-PR) | — |
| [US-AI-048](stories/US-AI-048/STORY.md) | Cache ComposedDesign per (generation, variation) | M-AI-18 | M | 🟡 Implementation complete (pre-PR) | — |
| [US-AI-049](stories/US-AI-049/STORY.md) | Map extracted fonts to real editor typography | M-AI-18 | S | 🔲 Not Started | — |
| [US-AI-050](stories/US-AI-050/STORY.md) | Progress affordance for the editable compose wait | M-AI-18 | S | 🟡 Implementation complete (pre-PR) | — |
| [US-AI-051](stories/US-AI-051/STORY.md) | Text-free background for real-photo + editable | M-AI-18 | M | 🔲 Not Started | — |

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
