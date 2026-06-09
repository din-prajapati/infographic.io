# M-AI-07-quality-campaign — Quality Tiers + Property Routing + Campaign Mode UI

> **Epic:** [EPIC-AI-02](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** 2026-07-31

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

## Notes / Blockers

- Quality labels must be user-friendly: "Quick Generate" (Flash) / "Campaign Quality" (Pro) are internal — show "Social" / "Print Quality" to users
- Property type → quality routing uses the `propertyTier` field (luxury → pro model, residential → flash model)

---

*Milestone created: 2026-04-28*
