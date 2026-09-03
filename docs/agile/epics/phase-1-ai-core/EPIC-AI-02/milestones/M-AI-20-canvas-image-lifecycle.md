---
title: Milestone — Canvas Image Lifecycle
type: milestone
domain: AI
created: 2026-09-03
---

# M-AI-20-canvas-image-lifecycle — Canvas Image Lifecycle

> **Epic:** [EPIC-AI-02](../EPIC.md)
> **Status:** 🔲 Not Started
> **Target date:** TBD
> **Branch:** `feat/ai/m-20-canvas-image-lifecycle`

---

## Why this milestone exists

`M-AI-06` closed 2026-08-05 having fixed the destructive half of the problem: generating over a
template no longer wipes the canvas (`US-AI-036` AC3 inserts the AI image as a layer behind
existing content instead).

It did not settle what the *second* generation does. Backgrounds now accumulate. This milestone
owns the lifecycle of the AI image on the canvas — how many there are, what replaces what, and
whether any of it can be undone.

`M-AI-06` is closed and must not be reopened; this is its follow-on, not its continuation.

> **Numbering note:** `M-AI-19` is used twice already (`M-AI-19-generation-progress-delivery` and
> `M-AI-19-format-expansion`, both 🔲 Not Started, different epics). This milestone took `M-AI-20`
> to avoid extending that collision. The existing duplicate is untouched and unresolved.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-AI-053](../stories/US-AI-053/STORY.md) | One AI background per canvas, with undo | S–M | — | 🔲 | — |

---

## Acceptance (Milestone Done When…)

- [ ] Generating N times onto one template leaves exactly one AI background element
- [ ] The toolbar Undo restores the previously replaced background — the canvas load path
      participates in undo history, which it does not today
- [ ] Template and user elements, and canvas dimensions, are never touched by a replacement
- [ ] The blank-canvas path (`US-AI-036` AC4) is unchanged

---

## Notes / Blockers

- **No blockers.** Nothing external gates this.
- **Gate 2 route:** verify via **Quick Generate**, not AI Chat. `BL-22` — AI Chat's backend
  validation intermittently refuses valid prompts — blocked five E2E attempts on 2026-09-03.
  Quick Generate uses structured form fields and bypasses that gate entirely.
