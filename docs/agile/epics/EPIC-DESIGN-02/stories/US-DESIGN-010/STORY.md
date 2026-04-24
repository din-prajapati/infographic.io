# Story Card — US-DESIGN-010

> **Status:** 🔲 Not Started  
> **Feature:** F-DESIGN-10 — Component Visual Polish  
> **Epic:** [EPIC-DESIGN-02](../../EPIC.md)  
> **Milestone:** [M-DESIGN-05 — Component Visual Polish](../../milestones/M-DESIGN-05-component-polish.md)  
> **Linear:** LIN-XXX  
> **Created:** 2026-04-17 | **Closed:** —

---

## Story

*As a* real estate agent editing an infographic in the canvas editor  
*I want* the editor UI to feel like a premium creative tool (inspired by Lovart.ai)  
*So that* the floating toolbar, layer sidebar, and canvas area match a professional design-tool aesthetic

---

## Acceptance Criteria

- [ ] **AC1:** Floating toolbar uses `--toolbar-floating-bg` (`#2c2c2c`) dark pill background with white icon tints
- [ ] **AC2:** Floating toolbar has `--toolbar-floating-radius` pill shape (`9999px`) and `--toolbar-floating-shadow` lift shadow
- [ ] **AC3:** Layer sidebar panel uses `--sidebar-panel-bg` (white) with `--sidebar-panel-border` subtle right border
- [ ] **AC4:** Active layer item uses `--sidebar-panel-item-bg-active` blue tint background
- [ ] **AC5:** Canvas outer area uses `--canvas-bg` (`#f5f5f5`) as its background
- [ ] **AC6:** Canvas selection ring uses `--canvas-selection-stroke` (`#3b82f6`) blue
- [ ] **AC7:** No logic, routing, canvas rendering, or state changes — only visual CSS/class updates
- [ ] **AC8:** Changes work in both Light and Dark modes
- [ ] **AC9:** `npm run check` passes — zero TypeScript errors
- [ ] **AC10:** `npm run test:unit` passes — no regressions

---

## Visual Reference

**Target:** `design-preview-canvas.html` (project root) — open in browser for exact visual target.

Key visual elements to match:
- Floating toolbar: dark charcoal pill centered below canvas, icon buttons with hover states
- Layer sidebar: white panel on left, subtle shadow, layer items with thumbnail + name
- Active layer: light blue tint background on the active item row
- Canvas area: light grey (`#f5f5f5`) dot-grid background
- Selection handles: blue `#3b82f6` corner handles on selected elements

---

## Token References

| Element | Token | Value |
|---------|-------|-------|
| Floating toolbar bg | `--toolbar-floating-bg` | `#2c2c2c` |
| Floating toolbar radius | `--toolbar-floating-radius` | `9999px` |
| Floating toolbar shadow | `--toolbar-floating-shadow` | `0 8px 32px rgba(0,0,0,0.35)` |
| Sidebar panel bg | `--sidebar-panel-bg` | `#ffffff` |
| Sidebar panel border | `--sidebar-panel-border` | `#e5e7eb` |
| Active layer item bg | `--sidebar-panel-item-bg-active` | `#EFF6FF` |
| Canvas outer bg | `--canvas-bg` | `#f5f5f5` |
| Canvas selection stroke | `--canvas-selection-stroke` | `#3b82f6` |

---

## Out of Scope

- Canvas rendering logic (`canvasUtils.ts`, `shapeRenderers.ts`) — no touch
- Drag-resize behaviour (`react-rnd`) — no touch
- AI Chat panel (US-DESIGN-011)
- Adding new toolbar tools or sidebar panels
- Changing keyboard shortcuts or canvas zoom/pan

---

## Engineering / PR

- **Branch:** `feat/design-us-design-010-editor-visual`
- **PR:** #_____
- **Primary files touched** (read first, then assess scope):
  - `client/src/components/editor/` — floating toolbar component
  - `client/src/components/editor/` — layer sidebar component
  - `client/src/components/editor/` — canvas wrapper/container component

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: InfographicAI SaaS — React frontend (Tailwind v4 + shadcn/ui).
See CLAUDE.md for architecture. Token reference: client/src/design-tokens.css
Visual target: design-preview-canvas.html (open in browser for reference)

Story: US-DESIGN-010 — Editor component visual refinement

Read client/src/components/editor/ to find:
1. The floating toolbar component — apply dark pill style:
   style={{ backgroundColor: 'var(--toolbar-floating-bg)', borderRadius: 'var(--toolbar-floating-radius)', boxShadow: 'var(--toolbar-floating-shadow)' }}
   Icon buttons inside: text-white/70 hover:text-white

2. The layer sidebar panel — apply white panel style:
   style={{ backgroundColor: 'var(--sidebar-panel-bg)', borderRight: '1px solid var(--sidebar-panel-border)' }}
   Active layer item: style={{ backgroundColor: 'var(--sidebar-panel-item-bg-active)' }}

3. The canvas outer container (the grey area around the white canvas) — verify or apply:
   style={{ backgroundColor: 'var(--canvas-bg)' }}

4. Canvas selection handles — verify or apply:
   The selection stroke color should use --canvas-selection-stroke (#3b82f6)
   Look in canvasUtils.ts or shapeRenderers.ts for strokeStyle and check if it's hardcoded

Rules:
- Do NOT change canvas rendering math, event handlers, or state
- Do NOT change the layout structure (panels, split-pane ratios)
- Only update background colors, border colors, and shadow values
- When done: confirm npm run check passes
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-DS-010-01 | Manual | P0 | Floating toolbar renders as dark pill (not card or box) | 🔲 | |
| TC-DS-010-02 | Manual | P0 | Layer sidebar panel is white with subtle right border | 🔲 | |
| TC-DS-010-03 | Manual | P1 | Active layer item has blue tint background | 🔲 | |
| TC-DS-010-04 | Manual | P1 | Canvas outer area is light grey `#f5f5f5` | 🔲 | |
| TC-DS-010-05 | Manual | P1 | Selection handles are blue `#3b82f6` | 🔲 | |
| TC-DS-010-06 | Manual | P0 | Canvas editing still works: drag, resize, add elements | 🔲 | |
| TC-DS-010-07 | Manual | P1 | Dark mode: toolbar/sidebar tokens remain coherent | 🔲 | |
| TC-DS-010-08 | Auto | P0 | `npm run check` — zero TypeScript errors | 🔲 | |
| TC-DS-010-09 | Auto | P0 | `npm run test:unit` — all unit tests pass | 🔲 | |

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual smoke: Editor in Light + Dark — toolbar dark pill, sidebar white panel, canvas editing functional
- [ ] Visual match to `design-preview-canvas.html` confirmed
- [ ] PR merged (PR #_____)
- [ ] TASKS.md task list fully checked

---

*Story created: 2026-04-17*
