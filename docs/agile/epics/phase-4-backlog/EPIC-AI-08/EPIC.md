# EPIC-AI-08 — Deferred AI Generation Work (Phase 4 Backlog)

> Quality tiers, Campaign Mode UI, and the Ideogram→Nano Banana image-model swap.
> All revenue-gated or priority-deferred; none technically blocked.

> **Phase:** Phase 4 Backlog — promote once the product has real revenue
> **Status:** 🔲 Not Started — M-AI-07 deferred from EPIC-AI-02 (2026-07-30); M-AI-02 deferred from EPIC-AI-00 (2026-08-04)
> **Depends on:** M-LAUNCH-02 closed (revenue-on flip) — not a hard technical dependency, a deliberate business-priority gate
> **Owner:** Dinesh
> **Backlog ref:** [Phase 4 Backlog B-16](../../phase-4-backlog/README.md#b-16--m-ai-07--quality-tiers--campaign-mode-ui)

---

## Goal

**Outcome:** Agents choose use case ("Social" or "Print Quality") without seeing model names; luxury listings auto-route to the premium model; a Campaign Mode UI toggle exists (backend generation itself is separate, EPIC-AI-04).

**Why deferred:** This is refinement on top of the core generation flow (photo upload, format picker, save-as-template — EPIC-AI-02's other stories), not something agents need before the product can charge them. Explicit decision: do not build this until there is real revenue to justify the investment.

---

## Milestones

| Milestone | Scope | Status |
|-----------|-------|--------|
| [M-AI-07-quality-campaign](milestones/M-AI-07-quality-campaign.md) | Quality tiers + property routing + Campaign Mode UI | 🔲 Not Started |
| [M-AI-02-model-swap](milestones/M-AI-02-model-swap.md) | Ideogram → Nano Banana image-model swap (moved from EPIC-AI-00, 2026-08-04) | 🔲 Not Started |

---

## Stories

| Story ID | Title | Milestone | Status |
|----------|-------|-----------|--------|
| [US-AI-012](stories/US-AI-012/STORY.md) | Generation quality tiers: Social vs Print (CAP-08) | M-AI-07 | 🔲 |
| [US-AI-013](stories/US-AI-013/STORY.md) | Property type → quality routing (CAP-09, hidden internal logic) | M-AI-07 | 🔲 |
| [US-AI-014](stories/US-AI-014/STORY.md) | Campaign Mode UI toggle (CAP-10, backend deferred) | M-AI-07 | 🔲 |
| [US-AI-003](stories/US-AI-003/STORY.md) | Replace Ideogram Turbo with Nano Banana Flash (FREE/SOLO) — **image half only; LLM half shipped** | M-AI-02 | 🔲 |
| [US-AI-004](stories/US-AI-004/STORY.md) | Replace Ideogram V2 with Nano Banana Pro (TEAM/BROKERAGE) — **image half only** | M-AI-02 | 🔲 |
| [US-AI-033](stories/US-AI-033/STORY.md) | Synthetic-content guard — no fake faces/buildings on real listings (moved from EPIC-AI-06 / M-AI-17, 2026-08-11) | — | 🔲 ⚠️ **scope under review** — do not implement as written |

---

## Known Story Staleness (carried over from EPIC-AI-02)

- US-AI-012's file list still references `image-generation.service.ts`, which no longer exists (real files: `ai-orchestrator.service.ts` / `ideogram.service.ts`), and its AC text assumes "Flash"/"Pro" model names that don't match the real catalog in `ai-models.config.ts`. Needs a `harden` pass before implementation, whenever this is pulled off the backlog.

---

## Definition of Done

- [ ] Quality selector shows "Social" and "Print Quality" (not resolution numbers or model names)
- [ ] Selecting "Print Quality" triggers higher-resolution generation parameters
- [ ] Luxury / BROKERAGE property type auto-selects Print Quality without user action
- [ ] Campaign Mode toggle exists in the UI, shows "Coming Soon" for backend (EPIC-AI-04)
- [ ] All stories above have status ✅ Done
- [ ] AGILE_INDEX.md epic row updated to ✅ Done

---

*Epic created: 2026-07-30 — deferred from EPIC-AI-02 M-AI-07 (2026-07-30 decision: revenue-gated)*
