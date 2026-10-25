---
title: M-EDIT-05-one-source-of-truth — One Source of Truth for Listing Facts
type: milestone
domain: EDIT
created: 2026-10-25
---

# M-EDIT-05-one-source-of-truth — One Source of Truth for Listing Facts

> **Epic:** [EPIC-EDIT-03](../EPIC.md)
> **Status:** 🔲 Not Started — scaffolded 2026-10-25, D1–D5 approved
> **Target date:** TBD
> **Branch:** `feat/edit/m-05-one-source-of-truth` (shared by all four stories)
> **Runbook:** [M-EDIT-05-RUNBOOK.md](M-EDIT-05-RUNBOOK.md) — prompts, decisions, verification procedure
> **Source spec:** [buildographic-canvas-bl27-ux-implementation-spec.md](buildographic-canvas-bl27-ux-implementation-spec.md) §5, §9, §10.1

---

## Goal

Every listing fact has exactly one editor and one stored value: the Property and Agent tabs show one
input per fact, and the number in the sidebar is the number on the canvas.

---

## Why this milestone exists

The Property tab renders two forms stacked in the same panel, wired to two different stores:
*Template Content* (`TemplateSection`, writes canvas elements through `templateSlots.ts`) and
`PropertyDetailsForm` (writes `usePropertyStore`, which no canvas element reads). The Agent tab does
the same. So the sidebar can say `₹85,00,000` while the canvas says something else. Nothing is
broken; nobody decided which form owns a fact. D1 decides: the stores do.

The write path already exists — `updateSlot()` (`templateSlots.ts:52`) fans a value out to every
element carrying a slot in one history entry. What is missing is a caller, and one agreed map.

---

## Stories in this Milestone

> **Order** = implementation sequence. Foundation merges before Lanes A and B fork; Lane C is
> independent and can start at once.

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-EDIT-014](../stories/US-EDIT-014/STORY.md) | Foundation: one binding contract for listing facts | M | — | 🔲 | — |
| 2 | [US-EDIT-015](../stories/US-EDIT-015/STORY.md) | Lane A: one form per fact in the sidebar | M | US-EDIT-014 **merged** | 🔲 | — |
| 2 | [US-EDIT-016](../stories/US-EDIT-016/STORY.md) | Lane B: canvas edits reach the field | M | US-EDIT-014 **merged** | 🔲 | — |
| 1 | [US-EDIT-017](../stories/US-EDIT-017/STORY.md) | Lane C: delete the orphaned CustomizePanel | S | — | 🔲 | — |

---

## Decisions — approved 2026-10-25

| ID | Decision |
|----|----------|
| D1 | The stores (`usePropertyStore`, `useAgentStore`) own listing facts; slot-tagged canvas text is a projection of them |
| D2 | Template Content fields that duplicate the property/agent forms are removed; `openHouse.*` and `report.*` stay (no other editor); brand fields stay in the Design tab |
| D3 | Editing slot-tagged text on the canvas writes back to the field |
| D4 | No migration: on load, the stores are filled from the canvas's slot values; bracketed placeholders fill as empty; a canvas with no slot tags leaves the stores alone |
| D5 | One map. `stats` → `property.specs`, and also writes/reads `property.facts` (the Story template uses `facts`, MLS uses `specs`) |

---

## Acceptance (Milestone Done When…)

- [ ] The Property tab renders one price input and the Agent tab one agent-name input.
- [ ] Typing a price in the Property tab changes the price on the canvas, in one Undo step.
- [ ] Editing the headline on the canvas updates the Headline field, and one Undo reverts both.
- [ ] A design saved before this milestone reopens with its own values in the sidebar — not blanks, not `[Price]`.
- [ ] A fresh template shows empty fields, and no fabricated value anywhere.
- [ ] The Open House date and Market Report fields are still editable.
- [ ] `CustomizePanel.tsx` is gone and nothing changed for the user.
- [ ] All stories above have status ✅ Done.
- [ ] Gate 1 passes; Gate 2 is the Chrome verification in the runbook (MV-05-01 … 05), including opening the exported file.

---

## Notes / Risks

- **D4 is where data can be lost.** `restoreCanvasData` serves both template load and saved-design restore; hydration must read, never reset. A canvas with no slot tags (for example after a poster placement, which discards slot layers since M-EDIT-04) must leave the stores untouched.
- **Out of scope** (runbook §"What this milestone deliberately does NOT do"): AI-assistant redesign (§8), tab renames (§9.1), export preflight (§11, blocked on BL-09), verified registration data (§5.5).

---

*Milestone created: 2026-10-25*
