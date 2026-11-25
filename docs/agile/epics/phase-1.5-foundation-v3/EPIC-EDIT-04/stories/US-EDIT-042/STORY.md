# Story Card — US-EDIT-042

> **Status:** 🟡 In Progress — locally implemented and verified; milestone merge pending
> **Feature:** N/A — approved Layers-only M-EDIT-11 extension
> **Epic:** [EPIC-EDIT-04](../../EPIC.md)
> **Milestone:** [M-EDIT-11-v3-editor-slice](../../milestones/M-EDIT-11-v3-editor-slice.md)
> **Linear:** Unassigned
> **Size:** M
> **Created:** 2026-11-07 | **Closed:** —

---

## Story

*As a* solo real estate agent refining a property listing
*I want* to inspect overlapping layers and reorder the exact chosen layer
*So that* I can control visual stacking without changing design geometry.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** When a solo real estate agent reorders or operates on a layer, v3LayerActions.ts produces the stable unique order and atomic clicked-row mutations in Foundation clauses 1–5, while v3LayerGeometry.ts returns rotation/stroke-aware per-selection-union overlaps in global order; Undo/Redo, save/reload and PNG reflect the specified final stack.
- [x] **AC2 [error-path]:** When a target is missing, locked, stale or at a stack boundary, a drop is cancelled/no-op, or selection is empty/hidden, v3LayerActions.ts and v3LayerGeometry.ts enforce Foundation clauses 1–5 without unintended geometry, selection or history changes and return the required prompt/selected-only/background eligibility state.

## Approved scope and prerequisites

User authorization on 2026-11-07 is **Layers only**. The full Layers ASCII, Actual previews, Reordering, Overlapping and Layers-relevant Delivery acceptance sections of [POSITION_LAYERS_PLAN.md](../../../../../../../Mockups/approved-v3-editor/POSITION_LAYERS_PLAN.md) are normative. The proposal's combined Position/Arrange entry is superseded: title Layers, entry accessible name `Open Layers sidebar`, All/Overlapping only; Arrange is future work explicitly excluded. Every clause below belongs to AC1/AC2 and is individually testable.

Prerequisites: Existing locally verified US-EDIT-031–041 checkpoint; pure APIs can be verified independently. UI consumes the helpers in US-EDIT-042.

### Foundation Contract

1. `v3LayerActions.ts` defines stable total stacking order: visual frontmost first in lists, ties broken deterministically by original document order, never random IDs. Bring forward/backward/front/back and a single-layer insertion move produce unique normalized zIndex values without geometry/style/selection-ID changes. The resulting canvas and PNG stacking order must match the list even when input zIndex values are equal, negative or gapped.
2. A completed nontrivial reorder is exactly one Undo step for the entire document; Undo/Redo restores previous/final order, and save/reload preserves final order. Boundary, invalid-ID, Escape/cancel and no-op operations create no history. Locked targets cannot be reordered; moving another unlocked item past a locked layer may change its relative visual position. Hidden layers remain in global order. No persistent grouping or multi-layer block drag.
3. `v3LayerGeometry.ts` returns conservative rotation-aware transformed frame bounds. Lines use their shared straight/curved/elbow path bounds plus stroke width/endings, including horizontal/vertical or zero-width local frames; a visible crossing line must not be omitted. Frame bounds are geometric, not alpha/pixel masks.
4. Overlapping keeps eligible selected visible items and visible items intersecting ANY individual selected bounds, deduplicated in global order. Never use the large enclosing rectangle between separate selections. Hidden elements are excluded and locked visible elements included. Page background appears only when at least one selected visible item intersects page bounds. No selection returns a distinct prompt state; no additional overlap returns selected-only state. Position, size, rotation, stroke, hide/remove and selection changes recompute from current state.
5. Row Copy/Paste/Duplicate/Delete delegate existing atomic V3 common actions against the clicked row, independent of an unrelated earlier selection. Opening the menu selects its row first. Lock/Unlock and Hide/Show target that row. Common disabled conditions and mutation guards remain; unlock/show stay available as appropriate. Background is not a CanvasElement and is excluded from element selection, deletion, duplication and reorder.

---

## Out of Scope

- Does not implement any Arrange tab, page-alignment action, dimension/ratio/X/Y/rotation fields, distribute/tidy-up or future placeholder.
- Does not change approved Navy/Teal shell, old default route, backend/schema/auth, plan tiers or paid services.
- Does not add pixel-alpha collision, persistent grouping, multi-layer block dragging, new export formats or unrelated optimization.

---

## Engineering / PR

- **Branch:** `codex/v3-editor-checkpoint-2026-11-05`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
- `client/src/lib/v3LayerGeometry.ts`
- `client/src/lib/v3LayerActions.ts`
- `client/src/lib/__tests__/v3LayerGeometry.spec.ts`
- `client/src/lib/__tests__/v3LayerActions.spec.ts`
- `client/src/lib/v3EditorActions.ts`
- `client/src/lib/__tests__/v3EditorActions.spec.ts`
- `client/src/lib/canvasUtils.ts`
- `client/src/lib/lineGeometry.ts`
- `client/src/lib/paint.ts`
- `client/src/hooks/useCanvasStore.ts`
- `client/src/lib/canvasTypes.ts`
- `Mockups/approved-v3-editor/LAYERS_VERIFICATION.md`

Shared helper paths are allowed only when needed for these clauses; no opportunistic refactors. Catalog and existing uncommitted editor changes must be preserved.

---

## AI Implementation Prompt

> Paste this block into Codex to implement the story.

```text
Context: InfographicAI SaaS — React18/Vite/Wouter/Zustand frontend through Express5000, NestJS11 API3001, Prisma6. Read AGENTS.md and PROJECT_CONTEXT.yaml.
Story: US-EDIT-042 — Stable layer ordering, overlap geometry and row actions
As a solo real estate agent refining a property listing, I want to inspect overlapping layers and reorder the exact chosen layer so that I can control visual stacking without changing design geometry.
Acceptance Criteria:
AC1: When a solo real estate agent reorders or operates on a layer, v3LayerActions.ts produces the stable unique order and atomic clicked-row mutations in Foundation clauses 1–5, while v3LayerGeometry.ts returns rotation/stroke-aware per-selection-union overlaps in global order; Undo/Redo, save/reload and PNG reflect the specified final stack.
AC2: When a target is missing, locked, stale or at a stack boundary, a drop is cancelled/no-op, or selection is empty/hidden, v3LayerActions.ts and v3LayerGeometry.ts enforce Foundation clauses 1–5 without unintended geometry, selection or history changes and return the required prompt/selected-only/background eligibility state.
Read every Foundation Contract clause in STORY.md and approved Layers-only scope. POSITION_LAYERS_PLAN.md Arrange sections are expressly excluded by the user's later authorization.
Out of Scope:
- Does not implement any Arrange tab, page-alignment action, dimension/ratio/X/Y/rotation fields, distribute/tidy-up or future placeholder.
- Does not change approved Navy/Teal shell, old default route, backend/schema/auth, plan tiers or paid services.
- Does not add pixel-alpha collision, persistent grouping, multi-layer block dragging, new export formats or unrelated optimization.
Primary files to touch (do NOT touch other files):
client/src/lib/v3LayerGeometry.ts
client/src/lib/v3LayerActions.ts
client/src/lib/__tests__/v3LayerGeometry.spec.ts
client/src/lib/__tests__/v3LayerActions.spec.ts
client/src/lib/v3EditorActions.ts
client/src/lib/__tests__/v3EditorActions.spec.ts
client/src/lib/canvasUtils.ts
client/src/lib/lineGeometry.ts
client/src/lib/paint.ts
client/src/hooks/useCanvasStore.ts
client/src/lib/canvasTypes.ts
Mockups/approved-v3-editor/LAYERS_VERIFICATION.md
Rules:
- Touch ONLY listed files plus this card/TASKS/scaffold and official locks/replay governance.
- Read exact helper/runtime interfaces first; root owns V3Editor/V3Canvas/toolbar integration.
- Obtain official harden lock and acceptance-derived failing tests before runtime code.
- Other agents are working in the same checkout; preserve peer changes and coordinate shared files.
- Run npm run check and npm run test:unit; run scoped V3 browser suite for integration.
- Record changed files, ACs and actual outputs; distinguish mocked persistence from real authenticated save/reload.
- No commit, push, merge, deploy or formal Done without applicable permission and gates.
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-EDIT-042-01 | Unit | P0 | happy-path: When a solo real estate agent reorders or operates on a l… | ✅ | Unit + browser evidence in LAYERS_VERIFICATION.md |
| TC-EDIT-042-02 | Unit | P0 | error-path: When a target is missing, locked, stale or at a stack bou… | ✅ | Unit + browser evidence in LAYERS_VERIFICATION.md |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded in table above
- [x] `npm run check` passes (0 new TypeScript errors)
- [x] `npm run test:unit` passes (no regressions)
- [x] Manual flow verified on `localhost:5000` or documented isolated equivalent
- [x] Scoped browser and light/dark desktop visual gates pass
- [ ] PR merged (PR #_____)
- [ ] No console errors in changed flow
- [x] [TASKS.md](./TASKS.md) task list fully checked ✅
- [ ] STORY.md status updated to `✅ Done`

## Local gate results — 2026-11-07

Gate 1: type checks; 811 API + 695 client unit tests pass, one existing skip. Gate 2: desktop light/dark visual inspection with retained screenshots. Gate 3: 122 regression browser cases + 1 live-overlap case pass. Gate 4: not applicable (frontend-only). API-mocked save/reload does not certify authenticated database persistence. Formal merge remains pending; no new commit/push/merge. Full evidence: `Mockups/approved-v3-editor/LAYERS_VERIFICATION.md`.
