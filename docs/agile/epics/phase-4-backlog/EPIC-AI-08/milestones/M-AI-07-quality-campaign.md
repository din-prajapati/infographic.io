# M-AI-07-quality-campaign — Quality Tiers + Property Routing + Campaign Mode UI

> **Epic:** [EPIC-AI-08](../EPIC.md) (moved from EPIC-AI-02, 2026-07-30)
> **Status:** 🔲 Not Started — Deferred to Phase 4 Backlog (revenue-gated)
> **Target date:** Revenue-gated — see EPIC-AI-08 trigger condition

---

## Goal

Agents choose use case ("Social" or "Print Quality") without seeing model names. Luxury listings are automatically routed to the premium model. Campaign Mode UI toggle exists (backend generates in EPIC-AI-04).

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-AI-012](../stories/US-AI-012/STORY.md) | Generation quality tiers: Social vs Print | 🔲 | — |
| [US-AI-013](../stories/US-AI-013/STORY.md) | Property type → quality routing (hidden internal logic) | 🔲 | — |
| [US-AI-014](../stories/US-AI-014/STORY.md) | Campaign Mode UI toggle | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] Quality selector shows "Social" and "Print Quality" (not "1K", "4K", or any model name)
- [ ] Selecting "Print Quality" triggers higher-resolution generation parameters
- [ ] Luxury / BROKERAGE property type auto-selects Print Quality without user action
- [ ] Campaign Mode toggle exists in the UI and shows "Coming Soon" tooltip for backend
- [ ] All stories above have status ✅ Done

---

## Deferral Note (2026-07-30)

Moved from EPIC-AI-02 (Phase 1 — AI Core) to this new Phase 4 Backlog epic, EPIC-AI-08. Decision: do not build quality tiers or Campaign Mode UI until the product has revenue — these are refinement/monetization-adjacent features, not launch blockers. See [EPIC-AI-08](../EPIC.md) for the trigger condition.

## Notes / Blockers

- Quality labels must be user-friendly: "Quick Generate" (Flash) / "Campaign Quality" (Pro) are internal — show "Social" / "Print Quality" to users
- Property type → quality routing uses the `propertyTier` field (luxury → pro model, residential → flash model)
- **Stale story, confirmed 2026-07-29:** US-AI-012's file list still references `image-generation.service.ts`, which no longer exists (real files: `ai-orchestrator.service.ts` / `ideogram.service.ts`), and its AC text assumes "Flash"/"Pro" model names that don't match the real catalog in `ai-models.config.ts`. Needs a `harden` pass before implementation.
- **Implementation order (2026-07-29):** US-AI-012 is Track A alongside US-AI-010 (independent of each other, run serially). **Do not start US-AI-012 implementation until US-AI-036 (M-AI-06) has merged** — both touch `AIChatBox.tsx` for unrelated reasons; landing the smaller US-AI-036 first avoids a manual merge. See [EPIC.md § Implementation Sequencing](../EPIC.md#implementation-sequencing-2026-07-29).

---

*Milestone created: 2026-04-28*
