# M-AI-06-photo-and-format — Property Photo Upload + Output Format Selector

> **Epic:** [EPIC-AI-02](../EPIC.md)
> **Status:** ✅ Done — closed 2026-08-05. All 8 implemented stories Done (US-AI-010/036/037/038/039/040/042, US-PANEL-01), 2 superseded (US-AI-011/041)
> **Target date:** 2026-06-30 (missed; work completed 2026-08-05)
> **Landed via:** direct commits (010/036/037/038), PR #19 (039/040/042), PR #20 (test-case closure + browse-layer geometry removal), PR #26 (US-PANEL-01)

---

## Goal

Agents can upload their own listing photos and choose the output format (Instagram Square, Facebook Cover, Story, or Print) before generation.

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-AI-010](../stories/US-AI-010/STORY.md) | Property photo upload + reference in generation | ✅ Done | direct `cce587e` |
| [US-AI-011](../stories/US-AI-011/STORY.md) | ~~Output format selector~~ | ⏭️ Superseded | — |
| [US-AI-036](../stories/US-AI-036/STORY.md) | Canvas-aware generation orientation | ✅ Done | direct `ea12368` |
| [US-AI-037](../stories/US-AI-037/STORY.md) | Save as Template — personal library | ✅ Done | direct `216c3ef` |
| [US-AI-038](../stories/US-AI-038/STORY.md) | Format Picker — New Design / New Template | ✅ Done | direct `42c3c72` |
| [US-AI-039](../stories/US-AI-039/STORY.md) | Format Picker — Canva-style single-modal reorg | ✅ Done | #19 |
| [US-AI-040](../stories/US-AI-040/STORY.md) | Template Gallery — preview modal + tag-based filters | ✅ Done | #19 |
| [US-AI-041](../stories/US-AI-041/STORY.md) | ~~Format Picker — device-mockup preview for social formats~~ | ⏭️ Superseded | — |
| [US-AI-042](../stories/US-AI-042/STORY.md) | Real canvas thumbnails on save | ✅ Done | #19 |
| [US-PANEL-01](../stories/US-PANEL-01/STORY.md) | Right Panel: brand indicator + honest no-brand default | ✅ Done | #26 |

---

## Acceptance (Milestone Done When…)

- [x] Agent can upload a JPG/PNG property photo in the chat panel — US-AI-010
- [x] Uploaded photo appears as a reference image in the generated infographic — US-AI-010
- [x] ~~Format selector shows 4 options: Instagram Square, Facebook Cover, Story (9:16), Print (4:3)~~
      **Superseded.** US-AI-011 was dropped; the Format Picker shipped instead (US-AI-038/039) with a
      richer taxonomy — For you · Instagram · Facebook · WhatsApp · Printables · Email · Other ·
      Custom size. The "4 options" wording describes a design that was never built.
- [x] Selecting a format changes the generated image aspect ratio — US-AI-036 (canvas-aware orientation)
- [ ] ~~Format selection is persisted per conversation (not reset on page change)~~
      **Not delivered as written.** US-AI-039 persists the *last-used format* per browser
      (localStorage) and pre-selects its category on reopen — not per-conversation. Per-conversation
      persistence was never built and no open story covers it. Closing the milestone without it:
      the Format Picker now precedes canvas creation, so a format is chosen per design rather than
      carried across a conversation, which makes the original criterion obsolete rather than missed.
- [x] All stories above have status ✅ Done

---

## Notes / Blockers

- Photo upload requires a backend endpoint — check if multer is already configured in NestJS
- Photos are stored temporarily (local disk or in-memory) in P1; R2 persistent storage is EPIC-AI-03
- Format maps to aspect ratios internally: Instagram=1:1, Facebook=1.91:1, Story=9:16, Print=4:3
- **Implementation order (2026-07-29):** US-AI-036 → US-AI-037 (can run parallel to 036, file-disjoint) → US-AI-038 (needs 037 merged first). US-AI-010 is independent, runs in the sibling "Track A" alongside US-AI-012 (M-AI-07) — see [EPIC.md § Implementation Sequencing](../EPIC.md#implementation-sequencing-2026-07-29) for the full two-track plan and a real file collision (`AIChatBox.tsx`) between US-AI-036 (this milestone) and US-AI-012 (M-AI-07).

---

*Milestone created: 2026-04-28*
