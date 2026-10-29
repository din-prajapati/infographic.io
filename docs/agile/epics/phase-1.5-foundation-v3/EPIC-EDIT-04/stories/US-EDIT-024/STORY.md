---
title: Story Card — US-EDIT-024
type: story
tags: [orion, story, phase-1.5]
updated: 2026-10-29
---

# Story Card — US-EDIT-024 — Editor shell in the V3 layout, light and dark

> **Status:** 🔲 Not Started — drafted 2026-10-29. Harden with `/new-story` (test cases, Four-Pillars pre-flight, TASKS.md) before implementing.
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-09-v3-shell](../../milestones/M-EDIT-09-v3-shell.md)
> **Size:** L
> **Depends on:** — (the For sale / For rent badge appears once US-PROP-002 lands)
> **Created:** 2026-10-29 | **Closed:** —
> **Source:** Phase 1.5 restructure — [ADR-003](../../../../../decisions/ADR-003-phase-1-close-and-phase-1.5.md); V3 canvas mockup (`Mockups/buildographic-canvas-simplification-v3/`, untracked)

---

## Story

*As* an agent opening the editor
*I want* the V3 layout — a clear top bar, a guide through the four steps, a canvas header that says what I am looking at, and a tidy tool rail — in whichever theme I use
*So that* I always know the next step and whether my design is connected to my listing

---

## Acceptance Criteria

> Drafted from the 2026-10-29 V3 gap analysis. File paths are the expected touch points, to be confirmed by `/new-story`.

- [ ] **AC1 [happy-path]:** **Top bar:** home, **Projects** breadcrumb (to My Designs / My Properties) with the editable design name, a save-status slot (filled by US-EDIT-027), Undo / Redo, **AI Assistant**, Save and Export.
- [ ] **AC2 [happy-path]:** **Guide bar:** 1 Choose a look → 2 Add details → 3 Refine → 4 Review & export. Each step opens its place (Look picker, Property tab, AI Assistant, export review); the current step is highlighted from editor state; the bar can be collapsed and stays collapsed for that user.
- [ ] **AC3 [happy-path]:** **Canvas header:** page and format (e.g. "Instagram portrait · 1080 × 1350"), a **For sale / For rent** badge (US-PROP-002), a **Sample listing** badge when the design uses sample data, Preview, and a mode bar — "Linked elements · double-click text to edit · Manage links" or "Generated image · Edit Elements".
- [ ] **AC4 [happy-path]:** **Left rail:** Select · Templates · Text (now holding Quick Styles) · Elements (shapes) · Uploads · Layers. Every existing tool stays reachable — nothing is removed.
- [ ] **AC5 [theme]:** The new layout works in **both light and dark themes**, as the editor does today: every new surface uses the existing theme tokens (no hard-coded hex — the Pricing and Landing pages are light-only because of exactly that), the theme toggle re-renders all of it, and text contrast is at least 4.5:1 in both themes.
- [ ] **AC6 [regression]:** Canvas rendering, export output and the existing editor unit and E2E tests are unchanged.

---

## Out of Scope

- Phone layout
- SVG export
- Dark mode for the marketing pages (Pricing, Landing — separate item)
- Changes to the canvas renderer

---

## Engineering / PR

- **Branch:** milestone branch (see PROJECT_CONTEXT.yaml `git.branch_format`)
- **PR:** #_____
- **Expected files:**
  - `client/src/components/editor/EditorLayout.tsx` — shell: top bar, guide bar, canvas header
  - `client/src/components/editor/EditorToolbar.tsx` — top-bar actions
  - `client/src/components/editor/EditorGuideBar.tsx` — new
  - `client/src/components/editor/LeftSidebar.tsx` — rail order
  - `client/src/components/editor/sidebar/ToolsTab.tsx` — Text tool gets Quick Styles
  - `client/src/components/editor/CenterCanvas.tsx` — canvas header + mode bar
  - `client/src/index.css` — only existing theme tokens; add tokens in both themes if needed

---

## Notes

Touches the same files as US-EDIT-022/025 (EditorLayout, RightSidebar neighbours) — merge 024 first, then 022, then 025.

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] Test cases written by `/new-story`, run and recorded
- [ ] Gate 1 passes · Gate 2 (frontend) · Gate 4 (backend) as applicable
- [ ] PR merged
- [ ] STORY.md status updated to ✅ Done

---

*Story drafted: 2026-10-29*
