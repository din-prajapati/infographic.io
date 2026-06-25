# M-AI-11-media-tools — Background Removal + Upscale to Print Quality

> **Epic:** [EPIC-AI-03](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** 2026-10-31

---

## Goal

Agents can remove the background from uploaded property photos (isolating the building), and upscale any generated infographic to 4K for print-ready output (yard signs, brochures).

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-AI-021](../stories/US-AI-021/STORY.md) | Property photo background removal (CAP-16) | 🔲 | — |
| [US-AI-022](../stories/US-AI-022/STORY.md) | Upscale to Print Quality — 4K output (CAP-17) | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] "Remove background" button appears on uploaded property photos
- [ ] Background removal completes in <10 seconds
- [ ] Removed-background photo can be used in the next generation (property on transparent/white bg)
- [ ] "Upscale to Print" button appears on generated infographics
- [ ] Upscaled image is ≥3840px on the long side (4K equivalent)
- [ ] All stories above have status ✅ Done

---

## Notes / Blockers

- Background removal: use a third-party API (remove.bg or similar) — not AI-generated
- Upscale: use Nano Banana Pro's upscale capability or a dedicated upscaling service
- Both outputs should be stored in R2 (M-AI-10 must be complete first)

---

*Milestone created: 2026-04-28*
