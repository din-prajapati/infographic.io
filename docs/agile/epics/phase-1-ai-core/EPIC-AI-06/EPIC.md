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
| [US-AI-031](stories/US-AI-031/STORY.md) | Real listing photo as generation background | M-AI-17 | L | 🔲 | — |
| [US-AI-032](stories/US-AI-032/STORY.md) | Hybrid render — text-free background + editable canvas text overlay | M-AI-18 | L | 🔲 | — |
| [US-AI-033](stories/US-AI-033/STORY.md) | Synthetic-content guard — no fake faces/buildings on real listings | M-AI-17 | M | 🔲 | — |

---

## Features in this Epic

| Feature ID | Scope | Stories |
|------------|-------|---------|
| F-AI-31 | Real-photo background generation | US-AI-031 |
| F-AI-32 | Hybrid editable output (AI background + canvas slots) | US-AI-032 |
| F-AI-33 | Synthetic-content policy enforcement | US-AI-033 |

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
