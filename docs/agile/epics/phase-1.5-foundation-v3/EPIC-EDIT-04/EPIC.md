---
title: EPIC-EDIT-04 — V3 Editor Simplification
type: epic
tags: [orion, epic, edit, phase-1.5]
updated: 2026-10-29
---

# EPIC-EDIT-04 — V3 Editor Simplification

> **Phase:** Phase 1.5 — Property Foundation & V3 Editor
> **Status:** 🟡 In Progress — 1/11. M-EDIT-03 (moved in from EPIC-EDIT-03) ✅ closed 2026-10-29 — US-EDIT-009 done after BL-26; the rest drafted (US-EDIT-024–027 added 2026-10-29) 2026-10-29
> **Owner:** Dinesh
> **Decision:** [ADR-003](../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md) · **Design source:** V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Goal

**Outcome:** The editor shows that the listing facts are connected: the agent sees which fact each text shows and can detach or
reconnect it, the Design tab answers "which look, which colour, which photo", AI lives in one Assistant panel with two clear
tasks, and Export checks the design before it downloads.

**Why now:** M-EDIT-05 and EPIC-PROP-01 make the facts trustworthy underneath; this epic makes that visible. The current Design
tab's Brand Styles mixes a colour theme with the canvas background (the source of the P-25/P-26 regressions), Quick Styles is an
"add text" tool in the wrong place, and AI is split between the sidebar's Quick Generate and a floating chat that never writes
facts back to the Property.

**Success metric:** On production, an agent can see and change what every text element is linked to, switch look without losing
facts, generate a background without touching the text, and is stopped at Export if the price or contact is missing.

---

## Milestones

| Milestone | Scope | Status |
|-----------|-------|:------:|
| [M-EDIT-03-single-editable-path](milestones/M-EDIT-03-single-editable-path.md) | One way to get editable text, on the canvas — *moved from EPIC-EDIT-03* | ✅ 2026-10-29 |
| [M-EDIT-06-linked-editing](milestones/M-EDIT-06-linked-editing.md) | Linked-element inspector + Manage links · export review dialog + out-of-date image guard | 🔲 |
| [M-EDIT-07-design-tab](milestones/M-EDIT-07-design-tab.md) | Design tab: Look · Accent · Property photo · Format & logo; Design/Property/Contact tabs | 🔲 |
| [M-EDIT-08-ai-assistant](milestones/M-EDIT-08-ai-assistant.md) | AI Assistant (Create design / Generate Background) · refine chips · quota badge | 🔲 |
| [M-EDIT-09-v3-shell](milestones/M-EDIT-09-v3-shell.md) | V3 shell (top bar · guide bar · canvas header · tool rail), Property and Contact tabs, autosave — light and dark | 🔲 |
| [M-EDIT-10-extraction-review](milestones/M-EDIT-10-extraction-review.md) | Edit Elements review — confirm links before a poster becomes editable | 🔲 |

---

## Stories in this Epic

| # | Story | Title | Milestone | Size | Status |
|:-:|-------|-------|-----------|:----:|:------:|
| 1 | [US-EDIT-009](stories/US-EDIT-009/STORY.md) | Remove the pre-placement Flat/Editable toggle — *moved from EPIC-EDIT-03* | M-EDIT-03 | M | ✅ |
| 2 | [US-EDIT-020](stories/US-EDIT-020/STORY.md) | Linked-element inspector and Manage links | M-EDIT-06 | M | 🔲 |
| 3 | [US-EDIT-021](stories/US-EDIT-021/STORY.md) | Export review dialog and out-of-date image guard | M-EDIT-06 | M | 🔲 |
| 4 | [US-EDIT-022](stories/US-EDIT-022/STORY.md) | Design tab simplification | M-EDIT-07 | M | 🔲 |
| 5 | [US-EDIT-023](stories/US-EDIT-023/STORY.md) | AI Assistant — Create design or Generate Background | M-EDIT-08 | L | 🔲 |
| 6 | [US-AI-015](stories/US-AI-015/STORY.md) | Quick Refine chips — *moved from EPIC-AI-03, re-scope before implementing* | M-EDIT-08 | M | 🔲 |
| 7 | [US-EDIT-008](stories/US-EDIT-008/STORY.md) | Editable quota badge + charge confirmation — *moved from EPIC-EDIT-03* | M-EDIT-08 | M | 🔲 |
| 8 | [US-EDIT-024](stories/US-EDIT-024/STORY.md) | Editor shell in the V3 layout, light and dark | M-EDIT-09 | L | 🔲 |
| 9 | [US-EDIT-027](stories/US-EDIT-027/STORY.md) | Autosave and save status | M-EDIT-09 | M | 🔲 |
| 10 | [US-EDIT-025](stories/US-EDIT-025/STORY.md) | Property and Contact tabs in the V3 layout | M-EDIT-09 | M | 🔲 |
| 11 | [US-EDIT-026](stories/US-EDIT-026/STORY.md) | Edit Elements review — confirm links before a poster becomes editable | M-EDIT-10 | L | 🔲 |

---

## Out of Scope (this epic)

- The phone layout (V3 has one; not asked for yet). *Amended 2026-10-29:* the V3 shell **is** in scope (US-EDIT-024), in both light and dark themes.
- Removing the free-form design tools (shapes, fonts, crop, adjustments) — they stay; V3 drops them, we do not.
- SVG export and export history. *(Autosave moved into scope as US-EDIT-027; the Projects breadcrumb is part of US-EDIT-024.)*
- Conversational AI (EPIC-AI-01, moved to the backlog).

---

*Epic created: 2026-10-29*
