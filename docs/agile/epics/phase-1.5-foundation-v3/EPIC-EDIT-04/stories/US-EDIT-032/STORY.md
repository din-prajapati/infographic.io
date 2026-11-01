# Story Card — US-EDIT-032

> **Status:** Implemented and verified locally — milestone merge pending
> **Feature:** N/A — approved V3 editing capabilities
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-11-v3-editor-slice](../../milestones/M-EDIT-11-v3-editor-slice.md)
> **Linear:** Unassigned
> **Size:** M
> **Created:** 2026-11-01 | **Closed:** —
> **Prerequisites:** US-EDIT-031 foundation; shared type edits coordinated with US-EDIT-034

---

## Story

*As a* solo real estate agent editing a saved listing design
*I want* to draw and edit standalone lines
*So that* I can annotate listing artwork without leaving the approved editor.

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When an authenticated agent chooses Straight, Curved or Elbow in `client/src/components/editor/v3/V3Tools.tsx` and draws on V3Canvas, the selected line supports every Drawing contract below, appears in Layers, and survives save, reload, recovery, duplicate and PNG export with its geometry and styling preserved; the existing legacy canvas displays the saved line.
- [x] **AC2 [error-path]:** When Escape cancels an in-progress line, a gesture is shorter than four screen pixels, a line is locked, or saved line geometry contains non-finite coordinates, no invalid draw or edit is committed; cancellation leaves history and autosave revision unchanged, locked edits are refused, and invalid load/template data uses the existing visible load error or template failure state without replacing the current canvas.

### Drawing contract

- Straight, curved and elbow are standalone elements, not attached connectors. Pointer drag previews locally; release commits once, selects the result and returns to Select. Insert line is keyboard-accessible and creates a 200-design-pixel line at the artboard centre.
- Lines default to navy #153B5B, 2px, solid, 100% opacity and no end decorations. Shift snaps straight drawing/endpoint editing to 45-degree increments.
- Selected lines support whole-line movement, local endpoint editing, curved bend control, elbow middle segment control and arrow-key movement. Elbows retain right angles. Type switching preserves endpoints/style.
- Model: type line; lineType straight/curved/elbow; local start/end/control points; elbowAxis horizontal/vertical and elbowOffset; stroke/strokeWidth/strokeStyle; independent startDecoration/endDecoration none/arrow/circle/bar. Shared geometry supplies SVG display, hit testing, bounds and Canvas export.
- Existing visibility, locking, universal Duplicate/Delete, clipboard, Layers and design-coordinate readout apply. Horizontal, vertical and reversed endpoints cannot create NaN or zero-size interaction failures.
- Each completed gesture adds exactly one undo entry; Escape restores the prior state. Save/autosave receives completed data only. Legacy text/image/shape records remain loadable without migration.
- Desktop-only scope: verify 1191x668 and 1440px width, light/dark/system; no new phone layout. No theme switch changes artwork colours.

## Out of Scope

- Does not implement Crop, attached connectors, line labels, Animate, Position or Style.
- Does not implement AI image modifications, BG remover, eraser, Magic tools, upscale, generation or paid-provider calls.
- Does not change approved shell layout, default editor route, authentication, plan limits or backend schema.
- Does not add performance optimizations, SVG/PDF export, collaboration or unrelated V3 roadmap features.

## Engineering / PR

- **Branch:** `feat/edit/m-11-v3-editor-slice`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/editor/ContextualToolbar.tsx`
  - `client/src/lib/canvasTypes.ts`
  - `client/src/lib/lineGeometry.ts`
  - `client/src/components/canvas/LineElement.tsx`
  - `client/src/components/editor/v3/V3Canvas.tsx`
  - `client/src/components/editor/v3/V3Tools.tsx`
  - `client/src/hooks/useV3DesignSession.ts`
  - `client/src/components/editor/v3/V3Panels.tsx`
  - `client/src/lib/canvasState.ts`
  - `client/src/components/editor/CenterCanvas.tsx`
  - `client/src/components/editor/sidebar/LayersTab.tsx`
  - `client/src/components/editor/sidebar/LayerItem.tsx`
  - `client/src/lib/__tests__/lineGeometry.spec.ts`
  - `client/src/components/editor/v3/__tests__/V3Lines.spec.tsx`

## AI Implementation Prompt

```text
Context: InfographicAI SaaS — React18/Vite, NestJS11 API3001, Prisma6, Tailwind3/shadcn, Wouter, Zustand/React Query. Read AGENTS.md.
Story: US-EDIT-032 — Standalone straight, curved and elbow drawing
Read this STORY.md including its normative contracts and TASKS.md. Implement AC1 and AC2 exactly; preserve approved Navy/Teal shell and old documents. Touch ONLY Primary files touched above. Do not implement Out of Scope. Obtain current Orion harden lock before coding. You are not alone: root owns shared canvasTypes.ts; coordinate interfaces and do not revert another agent's edits.
Run npm run check, npm run test:unit, npm run test:unit:client and applicable browser gates. Report files changed, each AC result and actual test evidence. Do not mark Done before PR merge.
```

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-EDIT-032-01 | Unit | P0 | happy-path: When an authenticated agent chooses Straight, Curved or E… | ✅ | |
| TC-EDIT-032-02 | Unit | P0 | error-path: When Escape cancels an in-progress line, a gesture is sho… | ✅ | |
| TC-EDIT-032-03 | Auto (unit) | P1 | Shift draws 45-degree straight line; Undo/Redo restores one complete gesture. | ✅ | |
| TC-EDIT-032-04 | Manual | P1 | Horizontal/vertical/reversed lines, zoom/pan, locked lines and legacy reopening preserve data. | ✅ | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] npm run check passes without new TypeScript errors
- [x] npm run test:unit and npm run test:unit:client pass without regressions
- [x] Approved desktop flow manually verified on localhost:5000 or documented equivalent dev port
- [ ] PR merged (PR #_____)
- [x] No console errors in changed flow
- [x] [TASKS.md](./TASKS.md) fully checked
- [ ] STORY.md status updated to ✅ Done



## Implementation evidence — 2026-11-01

[Toolbar verification](../../../../../../../Mockups/approved-v3-editor/TOOLBAR_VERIFICATION.md): 811 backend +465 client tests pass, one existing skip; 48 browser regressions pass, plus final sidebar/theme and legacy-line compatibility subsets. Real authenticated API/database save/reload/export smoke passes with cleanup. All independent code-review findings corrected. Formal Done and PR merge remain pending.
