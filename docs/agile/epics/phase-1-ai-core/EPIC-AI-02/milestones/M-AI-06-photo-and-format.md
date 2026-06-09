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
| [US-AI-010](../stories/US-AI-010/STORY.md) | Property photo upload + reference in generation | 🔲 | — |
| [US-AI-011](../stories/US-AI-011/STORY.md) | Output format selector: Instagram/Facebook/Story/Print | 🔲 | — |

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

---

*Milestone created: 2026-04-28*
