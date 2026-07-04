# Phase 1 — Revenue Strategy

> **Timing:** Starts after MVP launch (Phase 0 gate) + Phase 0.5 foundation fixes done
> **Outcome:** The product earns its price against Canva/Ideogram-direct: real listing photos (not synthetic), one listing → complete multi-format marketing kit, retention content between listings — built on the verified exact-text pipeline (EPIC-GEN-01).
> **Reprioritized 2026-07-03:** Conversational AI polish (EPIC-AI-01) moved to Phase 2; revenue-strategy epics promoted. Rationale: [docs/research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md](../../../research/2026-07-03-V4-PIPELINE-FIX-AND-PRODUCT-STRATEGY.md)

## Epics in this Phase (priority order)

| # | Epic | Focus | Status | Effort |
|---|------|-------|--------|--------|
| 1 | [EPIC-AI-02](EPIC-AI-02/EPIC.md) — dependency stories first | US-AI-010 photo upload + US-AI-011 format selector (rest deprioritized to Phase 2) | 🔲 Not Started | ~10h |
| 2 | [EPIC-AI-06](EPIC-AI-06/EPIC.md) | Hybrid Real-Photo Pipeline (real photo background · editable overlay · synthetic guard) | 🔲 Not Started | ~15–25h |
| 3 | [EPIC-KIT-01](EPIC-KIT-01/EPIC.md) | Listing Marketing Kits (multi-format batch · lifecycle · recurring content · compliance) | 🔲 Not Started | ~21–31h |
| — | [EPIC-OBS-00](EPIC-OBS-00/EPIC.md) | Structured Observability (Sentry) — runs parallel, protects the above | 🔲 Not Started | ~12h |

## Phase Gate (Phase 1 → Phase 2)
- [ ] A generation with an uploaded listing photo uses that real photo as background (no synthetic property imagery)
- [ ] One listing produces a ≥4-asset kit in < 3 minutes, exact text verified on every asset
- [ ] Recurring monthly content generated for active SOLO users
- [ ] Kit COGS ≤ $0.40 via preview/finalize flow
- [ ] Sentry receives generation failures within 60s

## Moved to Phase 2 (2026-07-03)
- EPIC-AI-01 Conversational AI Core (intent · pre-plan · chips)
- EPIC-AI-02 remainder: quality tiers UI, property-type routing, Campaign Mode UI
- Usage & payments polish (usage charts, payment method UI — old PHASE_TRACKER Phase 1 scope)

> Full AI roadmap: [AGILE_INDEX.md](../../AGILE_INDEX.md#ai-capability-epics)
