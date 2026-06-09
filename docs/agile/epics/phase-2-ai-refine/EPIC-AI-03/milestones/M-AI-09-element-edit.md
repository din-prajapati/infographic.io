# M-AI-09-element-edit — Element Edit Mode + Edit Listing Details in Image

> **Epic:** [EPIC-AI-03](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** 2026-09-30

---

## Goal

Agents can click a specific area of the infographic (price block, headline, agent name) and describe what to change — the AI modifies just that element without regenerating the entire image.

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-AI-017](../stories/US-AI-017/STORY.md) | Element Edit Mode — targeted modifications (CAP-13) | 🔲 | — |
| [US-AI-018](../stories/US-AI-018/STORY.md) | Edit listing details in image — text-in-image (CAP-14) | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] Clicking on the price area of the infographic activates Element Edit Mode
- [ ] Agent types "Change to $950k" → AI modifies just the price element
- [ ] Agent name / brokerage text can be changed without full regeneration
- [ ] Element Edit sends only a crop/mask of the targeted area to the AI, not the full image
- [ ] All stories above have status ✅ Done

---

## Notes / Blockers

- This is the most complex milestone in Phase 2 (~36h combined)
- Requires canvas hit-testing to identify which element was clicked
- The `SemanticLayerService` (US-AI-019) helps by providing element boundaries — consider doing M-AI-10 first or in parallel
- Text-in-image editing (US-AI-018) is a 20h story — plan for 2+ AI sessions

---

*Milestone created: 2026-04-28*
