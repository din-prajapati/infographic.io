# M-DESIGN-02 — Editor Design Token Fix

> **Epic:** [EPIC-DESIGN-01](../EPIC.md)  
> **Status:** 🔲 Not Started  
> **Target date:** 2026-04-30

---

## Goal

Replace all hardcoded gray Tailwind classes in editor and AI chat components with CSS design token classes, so the editor responds to Light/Dark/System theme exactly like the rest of the app.

---

## Stories in this Milestone

| Story | Title | Status | PR |
|-------|-------|--------|----|
| [US-DESIGN-002](../stories/US-DESIGN-002/STORY.md) | Editor adopts design token colors | 🔲 Not Started | — |
| [US-DESIGN-003](../stories/US-DESIGN-003/STORY.md) | AI Generation flow consistent UX states | 🟡 Partial (AC1 ✅, AC2–6 🔲 human) | — |

---

## Acceptance (Milestone Done When…)

- [ ] US-DESIGN-002 PR merged (editor token replacement complete)
- [ ] US-DESIGN-003 human TCs run and recorded (live API required)
- [ ] Editor opens in Light mode: toolbar is light, not dark bar
- [ ] Editor opens in Dark mode: matches dark theme of rest of app
- [ ] `npm run check` passes after all changes
- [ ] Manual smoke: add text, shape, image, drag-resize — no regression

---

## Notes

- US-DESIGN-002 is the core code-change story — target one AI session (~2 h)
- US-DESIGN-003 TCs 03–06/08 require live Ideogram API — run on staging after US-DESIGN-002 is merged
- 201 hardcoded references + 4 AI chat files found in M-DESIGN-01 QA — see [EPIC.md](../EPIC.md) for full list

---

*Milestone created: 2026-04-15*
