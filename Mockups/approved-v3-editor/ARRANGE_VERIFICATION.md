# V3 Arrange — contract and verification

Branch `codex/v3-arrange-opus`, based on protected checkpoint `b69074b`. Source handoff: [OPUS_ARRANGE_HANDOFF.md](./OPUS_ARRANGE_HANDOFF.md).

## Authorization and process deviation (2026-11-07)

User decisions in this session:

- **Scope:** Core **and** Advanced Arrange are both implemented on this branch.
- **No new story cards.** The user explicitly said not to write a US-EDIT-044/045 card. The ORION `/new-story` → `harden` lock → `implement-story` chain therefore was **not** run, and no story counter was consumed. This document carries the acceptance contract instead; it is not an ORION harden lock.
- **Sidebar:** sibling `Arrange` / `Layers` tabs inside the existing sidebar. The header title follows the active tab.
- **Model:** this session runs on Opus 5.5 (`claude-opus-5-5`). Every ORION role agent in `.orion/agents/` and `.claude/agents/` is pinned to `claude-sonnet-4-6`, so none of them were used for implementation. Contract, tests and code were written in this Opus session. The independent review used a same-model fork, which inherits this session's model.

## Contract

Every clause is binary and covered by at least one test listed in the evidence section.

### A. Sidebar integration

- A1. The footer `Layers` button stays the only sidebar entry. No element toolbar gains Arrange, Position or Layers shortcuts.
- A2. The sidebar shows a tablist `Sidebar views` with tabs `Arrange` and `Layers`. The footer opens it on the Layers tab.
- A3. On the Layers tab, the heading is `Layers` and the panel is named `Layers panel`. Layers content and behavior are unchanged: All/Overlapping, previews, row menus, drag, background row. No Arrange controls appear on the Layers tab.
- A4. On the Arrange tab, the heading is `Arrange` and the panel is named `Arrange panel`.
- A5. The footer button's `aria-expanded` is true only while the Layers tab is visible. Clicking it while Layers is showing closes the sidebar. Clicking it while Arrange is showing switches to Layers.
- A6. The close button, Escape (outside inputs and menus), and the footer toggle all close the sidebar and restore the previous panel. Switching tabs does not change which panel is restored. Canvas selection keeps the sidebar open.

### B. Eligibility

- B1. The Arrange targets are the current selection. An action is enabled only if every selected ID exists, is visible, is unlocked, and has valid geometry. Otherwise the whole action is disabled. A partial selection is never silently moved.
- B2. A status line explains why: no selection, locked or hidden selection.
- B3. The page background is never a target.

### C. Stacking (core)

- C1. `Forward`, `Backward`, `To front`, `To back` reuse `moveV3Layer` (stable unique ranks). They require exactly one eligible selected element. Each is disabled at its stack boundary.
- C2. One completed move adds one Undo entry. A disabled or boundary click adds none.

### D. Align to page (core)

- D1. Six actions: `Align left`, `Align center`, `Align right`, `Align top`, `Align middle`, `Align bottom`.
- D2. Alignment uses the rotation-aware visual bounds from `getV3ElementBounds`. For lines, this includes stroke width and end decorations. For text, it is the text frame, not the glyph extents.
- D3. A multi-selection aligns the union of its bounds as one unit. Every target moves by the same offset, so relative spacing is preserved.
- D4. Only `x`/`y` change. Size, rotation, paints, metadata, icon identity, image fit and line geometry stay the same, and so does the selection.
- D5. One completed alignment adds exactly one Undo entry, applied as one atomic batch. Undo and Redo restore the whole batch. An already-aligned selection (offset < 1e-6) adds no history.

### E. Size and position (advanced)

- E1. Fields `Width`, `Height`, `X position`, `Y position`, `Rotation`, plus a `Lock aspect ratio` toggle. They require exactly one eligible selected element. Otherwise they are disabled with an explanation. Multi-selection numeric transforms are out of scope.
- E2. X/Y are the stored frame origin, not the rotated visual bounds. Width/Height are the local, unrotated dimensions. Fields show values rounded to one decimal.
- E3. Valid ranges: X/Y from −10000 to 10000 (off-page negative values allowed); Width/Height from 1 to 10000; Rotation is any finite number, stored normalized to [0, 360). Blank, non-numeric or out-of-range input is rejected with an inline message, adds no history and reverts the field.
- E4. Enter or blur commits one Undo entry through `commitElementPatch`. An unchanged value adds none. Escape reverts the field, adds no history and does not close the sidebar. The next Escape closes it as usual.
- E5. With the ratio lock on, a Width or Height change scales the other dimension by the same factor. If the derived value falls outside 1–10000, the edit is rejected. The ratio lock is view state only: it is not persisted and resets when the selection changes.
- E6. Text, shapes and images resize their frame from the fixed stored origin. Text font size is unchanged.
- E7. Lines scale their local start, end, control and elbow geometry by the same factor, then pass through `normalizeLineElement`. A line with zero span on an axis (horizontal or vertical) has that dimension field disabled.
- E8. The fields show live canvas drag/resize/rotation presentation while a gesture is in progress, and committed values after it.

### F. Regression and non-goals

- F1. Footer-only Layers entry, the Layers drag/menu/overlap behavior, shared More menus, direct Lock/Duplicate/Delete, and all type-specific toolbar controls are preserved.
- F2. No distribute or tidy-up, align-to-selection, grouping, crop, backend, schema, auth, or default-editor change. No new dependencies.

## Files

| File | Role |
|---|---|
| `client/src/lib/v3Arrange.ts` | New: eligibility, page alignment, numeric geometry commits |
| `client/src/lib/__tests__/v3Arrange.spec.ts` | New: exact geometry and history unit tests |
| `client/src/components/editor/v3/V3ArrangePanel.tsx` | New: Arrange view and sidebar tabs |
| `client/src/components/editor/v3/v3-arrange-panel.css` | New: compact Navy/Teal styles |
| `client/src/components/editor/v3/__tests__/V3ArrangePanel.spec.tsx` | New: UI contract tests |
| `client/src/components/editor/v3/V3LayersPanel.tsx` | Optional `tabs` slot only |
| `client/src/components/editor/v3/V3Editor.tsx` | Tab state and footer semantics |
| `e2e/v3-arrange.spec.ts` | New: browser contract tests, PNG and both themes |
| `e2e/v3-layers-panel.spec.ts` | Replaces the "no Arrange tab" assertion with "no Arrange controls on the Layers tab" (A3) |
| `e2e/v3-slice.config.ts` | Registers the new spec |

## Evidence

_Filled in after the gates run._
