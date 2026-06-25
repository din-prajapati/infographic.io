# M-AI-08-quick-refine — Quick Refine Chips + Refine with AI from Canvas

> **Epic:** [EPIC-AI-03](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** 2026-08-31

---

## Goal

After a generation is complete, agents can tap a chip ("More luxurious", "Darker background", "Just Sold version") to get a refined version in <15s. They can also click "Refine with AI" from the canvas to send the current infographic to chat for modifications.

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-AI-015](../stories/US-AI-015/STORY.md) | Quick Refine chips post-generation (CAP-11) | 🔲 | — |
| [US-AI-016](../stories/US-AI-016/STORY.md) | "Refine with AI" from canvas editor (CAP-12) | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] After generation: 3 Quick Refine chips appear (e.g., "More luxurious", "Darker background", "Create Sold version")
- [ ] Tapping a chip generates a modified version in <15 seconds
- [ ] "Refine with AI" button appears on the canvas when an infographic is selected
- [ ] Clicking it opens/focuses the chat panel with a pre-filled context message about the current infographic
- [ ] All stories above have status ✅ Done

---

## Notes / Blockers

- Quick Refine chips are distinct from suggestion chips (US-AI-009) — these appear POST-generation, not post-AI-reply
- The refine generation call should reuse the original conversation context + add the refinement instruction
- Canvas → Chat context injection requires the canvas component to have access to the infographic ID and a way to trigger the chat panel

---

*Milestone created: 2026-04-28*
