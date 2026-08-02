# M-AI-06-photo-and-format — Property Photo Upload + Output Format Selector

> **Epic:** [EPIC-AI-02](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** 2026-06-30

---

## Goal

Agents can upload their own listing photos and choose the output format (Instagram Square, Facebook Cover, Story, or Print) before generation.

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-AI-010](../stories/US-AI-010/STORY.md) | Property photo upload + reference in generation | 🟡 Implementation Complete (pre-PR) | — |
| [US-AI-011](../stories/US-AI-011/STORY.md) | ~~Output format selector~~ | ⏭️ Superseded | — |
| [US-AI-036](../stories/US-AI-036/STORY.md) | Canvas-aware generation orientation | 🟡 Implementation Complete (pre-PR) | — |
| [US-AI-037](../stories/US-AI-037/STORY.md) | Save as Template — personal library | 🟡 Implementation Complete (pre-PR) | — |
| [US-AI-038](../stories/US-AI-038/STORY.md) | Format Picker — New Design / New Template | 🟡 Implementation Complete (pre-PR) | — |
| [US-AI-039](../stories/US-AI-039/STORY.md) | Format Picker — Canva-style single-modal reorg | 🟡 Implementation Complete (pre-PR) | — |
| [US-AI-040](../stories/US-AI-040/STORY.md) | Template Gallery — preview modal + tag-based filters | 🟡 Implementation Complete (pre-PR) | — |
| [US-AI-041](../stories/US-AI-041/STORY.md) | ~~Format Picker — device-mockup preview for social formats~~ | ⏭️ Superseded | — |
| [US-AI-042](../stories/US-AI-042/STORY.md) | Real canvas thumbnails on save | 🔲 Not Started | — |

---

## Acceptance (Milestone Done When…)

- [ ] Agent can upload a JPG/PNG property photo in the chat panel
- [ ] Uploaded photo appears as a reference image in the generated infographic
- [ ] Format selector shows 4 options: Instagram Square, Facebook Cover, Story (9:16), Print (4:3)
- [ ] Selecting a format changes the generated image aspect ratio
- [ ] Format selection is persisted per conversation (not reset on page change)
- [ ] All stories above have status ✅ Done

---

## Notes / Blockers

- Photo upload requires a backend endpoint — check if multer is already configured in NestJS
- Photos are stored temporarily (local disk or in-memory) in P1; R2 persistent storage is EPIC-AI-03
- Format maps to aspect ratios internally: Instagram=1:1, Facebook=1.91:1, Story=9:16, Print=4:3
- **Implementation order (2026-07-29):** US-AI-036 → US-AI-037 (can run parallel to 036, file-disjoint) → US-AI-038 (needs 037 merged first). US-AI-010 is independent, runs in the sibling "Track A" alongside US-AI-012 (M-AI-07) — see [EPIC.md § Implementation Sequencing](../EPIC.md#implementation-sequencing-2026-07-29) for the full two-track plan and a real file collision (`AIChatBox.tsx`) between US-AI-036 (this milestone) and US-AI-012 (M-AI-07).

---

*Milestone created: 2026-04-28*
