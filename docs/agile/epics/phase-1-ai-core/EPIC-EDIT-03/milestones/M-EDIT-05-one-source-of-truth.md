---
title: M-EDIT-05-one-source-of-truth — One Source of Truth for Listing Facts
type: milestone
domain: EDIT
created: 2026-10-25
---

# M-EDIT-05-one-source-of-truth — One Source of Truth for Listing Facts

> **Epic:** [EPIC-EDIT-03](../EPIC.md)
> **Status:** ✅ Done — merged in [#73](https://github.com/din-prajapati/infographic.io/pull/73) (rebase-and-merge, `main` @ `56c7a46`) and deployed to staging and production 2026-10-26
> **Target date:** TBD | **Closed:** 2026-10-26
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
| 1 | [US-EDIT-014](../stories/US-EDIT-014/STORY.md) | Foundation: one binding contract for listing facts | M | — | ✅ | [#73](https://github.com/din-prajapati/infographic.io/pull/73) |
| 2 | [US-EDIT-015](../stories/US-EDIT-015/STORY.md) | Lane A: one form per fact in the sidebar | M | US-EDIT-014 **merged** | ✅ | [#73](https://github.com/din-prajapati/infographic.io/pull/73) |
| 2 | [US-EDIT-016](../stories/US-EDIT-016/STORY.md) | Lane B: canvas edits reach the field | M | US-EDIT-014 **merged** | ✅ | [#73](https://github.com/din-prajapati/infographic.io/pull/73) |
| 1 | [US-EDIT-017](../stories/US-EDIT-017/STORY.md) | Lane C: delete the orphaned CustomizePanel | S | — | ✅ | [#73](https://github.com/din-prajapati/infographic.io/pull/73) |
| 3 | [US-EDIT-018](../stories/US-EDIT-018/STORY.md) | Listing facts persist with the design | M | US-EDIT-014 | ✅ | [#73](https://github.com/din-prajapati/infographic.io/pull/73) |
| 3 | [US-EDIT-019](../stories/US-EDIT-019/STORY.md) | One fact per template element | M | US-EDIT-014 | ✅ | [#73](https://github.com/din-prajapati/infographic.io/pull/73) |

---

## Decisions — approved 2026-10-25

| ID | Decision |
|----|----------|
| D1 | The stores (`usePropertyStore`, `useAgentStore`) own listing facts; slot-tagged canvas text is a projection of them |
| D2 | Template Content fields that duplicate the property/agent forms are removed; `openHouse.*` and `report.*` stay (no other editor); brand logo and accent colour stay in the Design tab |
| D3 | Editing slot-tagged text on the canvas writes back to the field |
| D4 | No migration: on load, the stores are filled from the canvas's slot values; bracketed placeholders fill as empty; a canvas with no slot tags leaves the stores alone |
| D5 | One map. `stats` → `property.specs`, and also writes/reads `property.facts` (the Story template uses `facts`, MLS uses `specs`) |
| Q1 | *(2026-10-26)* The specs line is store→canvas only; a canvas edit to it is not parsed back into beds/baths/sqft |
| Q2 | *(2026-10-26)* The agency name is owned by the Agent tab's **Brokerage** field; the Design tab keeps canvas-design controls only (logo, accent colour, styles) |
| Q3 | *(2026-10-26, Gate 2 findings)* Placing an AI poster fills the fields from what it printed; listing facts are saved with the design; template lines hold one fact each (US-EDIT-018, US-EDIT-019) |

---

## Acceptance (Milestone Done When…)

- [x] The Property tab renders one price input and the Agent tab one agent-name input.
- [x] Typing a price in the Property tab changes the price on the canvas, in one Undo step.
- [x] Editing the headline on the canvas updates the Headline field, and one Undo reverts both.
- [x] A design saved before this milestone reopens with its own values in the sidebar — not blanks, not `[Price]`.
- [x] A fresh template shows empty fields, and no fabricated value anywhere.
- [x] The Open House date and Market Report fields are still editable.
- [x] `CustomizePanel.tsx` is gone and nothing changed for the user.
- [x] All stories above have status ✅ Done.
- [x] Gate 1 passes; Gate 2 is the Chrome verification in the runbook (MV-05-01 … 05), including opening the exported file.
      > **Exception:** MV-05-05 *with a photo* was not run — this milestone touched no photo path; the no-photo run passed. Recorded in PR #73.

---

## Notes / Risks

- **D4 is where data can be lost.** `restoreCanvasData` serves both template load and saved-design restore; hydration must read, never reset. A canvas with no slot tags (for example after a poster placement, which discards slot layers since M-EDIT-04) must leave the stores untouched.
- **Out of scope** (runbook §"What this milestone deliberately does NOT do"): AI-assistant redesign (§8), tab renames (§9.1), export preflight (§11, blocked on BL-09), verified registration data (§5.5).

---

## Closeout (2026-10-26)

- Lanes A, B and C ran in parallel in separate worktrees and were squash-merged into the milestone branch; Foundation fixes made at integration became US-EDIT-014 AC10/AC11.
- Gate 2 found the poster/sidebar disagreement and the mixed template lines → US-EDIT-018 and US-EDIT-019 (Q3), shipped in the same PR.
- Template refresh (`seed-premium-templates.ts --refresh`) run on dev/staging and, after deploy, production (`ep-aged-king`): 5 rows, 7 split elements, 7 `slotFormat`s, verified at the data layer.
- Known limit: after Undo of a poster placement, beds/baths/sq ft keep the poster's values (Q1 — the specs line never hydrates).

---

*Milestone created: 2026-10-25*
