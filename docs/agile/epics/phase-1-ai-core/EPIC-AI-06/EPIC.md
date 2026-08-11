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
