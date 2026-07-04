# EPIC-KIT-01 — Listing Marketing Kits

> **Phase:** Phase 1 — Revenue Strategy (promoted from Phase 2 on 2026-07-03)
> **Status:** 🔲 Not Started
> **Depends on:** EPIC-GEN-01 (V4 pipeline), US-AI-011 (format selector, EPIC-AI-02 — pull forward first)
> **Linear Project:** LIN-EPIC-KIT-01
> **Target date:** TBD
> **Owner:** Dinesh

---

## Goal

**Outcome:** One listing in → a complete marketing kit out: Instagram post (1:1), Instagram story (9:16), A4 flyer (print-ready), WhatsApp card, and email header — from one extraction, one brand profile, with exact text verified on every asset.

**Why now:** This reframes the SOLO plan's unit of value from "image" (loses to Ideogram Basic at ₹680/mo) to "listing kit" (₹2,999 ÷ 10 kits = ₹300/listing against a commission worth lakhs). Same price, same COGS, different mental math — and it's a product neither Canva (manual per-asset work) nor Ideogram (no listing concept) structurally offers. Full analysis: [docs/research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md](../../../../research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md).

**Success metric:** From a single chat prompt or property form entry, a user receives ≥4 format-correct assets in under 3 minutes, each with verified exact text and applied brand profile; kit COGS ≤ $0.40 via the preview/finalize flow.

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|--------|
| [M-KIT-01-kit-engine](milestones/M-KIT-01-kit-engine.md) | Multi-format batch orchestration + preview/finalize cost flow + kit UI | TBD | 🔲 |
| [M-KIT-02-retention-content](milestones/M-KIT-02-retention-content.md) | Listing lifecycle assets + recurring market-update content + compliance layer | TBD | 🔲 |

---

## Stories in this Epic

| Story ID | Title | Milestone | Size | Status | PR |
|----------|-------|-----------|------|--------|----|
| [US-KIT-001](stories/US-KIT-001/STORY.md) | Kit orchestration — one extraction → multi-format asset batch | M-KIT-01 | L | 🔲 | — |
| [US-KIT-002](stories/US-KIT-002/STORY.md) | Kit UI — kit view, per-asset regenerate, download all | M-KIT-01 | M | 🔲 | — |
| [US-KIT-003](stories/US-KIT-003/STORY.md) | Preview/finalize cost flow — Turbo previews, Quality final | M-KIT-01 | M | 🔲 | — |
| [US-KIT-004](stories/US-KIT-004/STORY.md) | Listing lifecycle assets — Just Listed → Open House → Price Improved → Sold | M-KIT-02 | M | 🔲 | — |
| [US-KIT-005](stories/US-KIT-005/STORY.md) | Recurring content engine — monthly market updates, proactive delivery | M-KIT-02 | L | 🔲 | — |
| [US-KIT-006](stories/US-KIT-006/STORY.md) | Compliance layer — license #, RERA/MLS text, disclaimers auto-inserted | M-KIT-02 | M | 🔲 | — |

---

## Features in this Epic

| Feature ID | Scope | Stories |
|------------|-------|---------|
| F-KIT-01 | Kit engine (batch orchestration + cost flow) | US-KIT-001, US-KIT-003 |
| F-KIT-02 | Kit experience (UI, downloads, regenerate) | US-KIT-002 |
| F-KIT-03 | Lifecycle & recurring content | US-KIT-004, US-KIT-005 |
| F-KIT-04 | Compliance & profile enforcement | US-KIT-006 |

---

## Out of Scope (Epic Level)

- Pricing/plan changes — kits reframe value at existing price points
- Social media scheduling/auto-posting (integration surface, later)
- Video/Reels formats
- Brokerage multi-seat admin — ORG domain

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
- api/src/modules/ai-generation/services/ai-orchestrator.service.ts   (kit = N orchestrated generations)
- api/src/modules/ai-generation/services/infographic-prompt.builder.ts (per-format prompt variants)
- api/src/modules/infographics/services/generations.service.ts        (kit record + usage accounting)
- api/prisma/schema.prisma                                             (Kit / KitAsset models)
- client/src/pages (new KitPage)                                       (kit view UI)
```

---

*Epic created: 2026-07-03 | Last updated: 2026-07-03*
