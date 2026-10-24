---
title: PR Task List — US-EDIT-012
type: tasks
updated: 2026-10-24
---

# PR Task List — US-EDIT-012 — Lane 1 · canvas

> **Story:** [STORY.md](./STORY.md)
> **Stage:** Lane 1 — parallel with US-EDIT-013, **after Foundation merges**
> **Branch:** `feat/edit/l1-canvas-layer-rule` off the milestone branch
> **Worktree:** `../bg-canvas`
> **Engine:** Claude (primary), **interactive — not headless**
> **depends_on:** US-EDIT-011

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled, 7 ACs, all file-specific
- [ ] **Muscle** — T0-T5 below
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd)
- [ ] **Env** — no environment changes

---

## Why this lane is interactive

It is the only task in the milestone that can destroy a customer's saved design — 8 on production,
173 on staging. Its pre-flight can conclude "stop and escalate", and that instruction is worthless
under an auto-approving headless run. A human reads this lane's output.

---

## Pre-flight checks (run before T1 — each can change the work)

```bash
# 1 · Did Foundation land? Nothing here compiles without it.
grep -n "AiComposition" client/src/lib/api.ts client/src/lib/canvasTypes.ts

# 2 · Is loadAiVariationToCanvas the only route an AI image takes to the canvas?
grep -rn "loadComposedDesignToCanvas\|loadAiVariationToCanvas" client/src

# 3 · Does restoreCanvasData know template-load from saved-design-restore?
grep -rn "restoreCanvasData" client/src
```

1. If `AiComposition` is absent, **stop** — the lane was forked too early.
2. It is **not** the only route. `loadComposedDesignToCanvas` exists and BL-23 records that it is
   missing the same undo push. Confirm it stays out of scope rather than discovering it mid-task.
   The two live callers of `loadAiVariationToCanvas` are `CenterCanvas.tsx:111` and
   `RightSidebar.tsx:566` — **not** `ResultsVariations.tsx`, which only raises `onUseVariation`.
3. Five call sites share one function. **If template-load and saved-design-restore are
   indistinguishable at that boundary, stop and escalate** — do not adapt the rule to work around it.

---

## Task Breakdown

### T0 — D1 and D2 recorded before any code
- **Type:** decision, no code — record in STORY.md §Decisions
- **D1:** whole composition, or only template-owned slot-tagged layers?
- **D2:** one undo across both stores, or no store write at all?
- **This task blocks every task below it.** An agent must not infer these.

### T1 — Set the flag on the element
- **File:** `client/src/lib/canvasState.ts` (the `imageElement` literal, ~line 415)
- **Type:** `feat` · **AC(s):** AC4
- The field is already declared by Foundation. Assign it; leave undefined when the variation has none.

### T2 — Thread the flag from both call sites
- **File:** `client/src/components/editor/CenterCanvas.tsx` (line 111), `client/src/components/editor/RightSidebar.tsx` (line 566)
- **Type:** `feat` · **AC(s):** AC4
- Pass the variation's `composition` into the loader. Touch nothing else in either file.

### T3 — Branch the split
- **File:** `client/src/lib/canvasState.ts` (`splitElementsForAiBackground`, line 340)
- **Type:** `fix` · **AC(s):** AC1, AC2, AC3, AC7
- Keep the function **pure and directly unit-testable** — this repo's canvas testing decision
  (`client/vitest.config.ts`). Take composition as a parameter; do not read a store inside it.
- `'background'` and absent both take today's path, unchanged.

### T4 — One undoable step
- **File:** `client/src/lib/canvasState.ts` (~line 441), `client/src/hooks/usePropertyStore.ts` *(only if D2 selects the store-write variant)*
- **Type:** `fix` · **AC(s):** AC5
- `pushToHistory` records **canvas elements only**. If D2 writes to the property store, the history
  entry must carry both or the Undo is a lie. If D2 takes the default, this task is canvas-only.

### T5 — Extend the existing spec
- **File:** `client/src/lib/__tests__/canvasState.aiBackground.spec.ts`
- **Type:** `test` · **AC(s):** AC1, AC2, AC3, AC5, AC7
- **Extend, do not replace.** The existing cases are the AC2 regression guarantee.

---

## Files — exclusive ownership

**Owns:** `client/src/lib/canvasState.ts` · `client/src/lib/__tests__/canvasState.aiBackground.spec.ts` · `client/src/hooks/usePropertyStore.ts` *(D2 only)* · `client/src/components/editor/CenterCanvas.tsx` · `client/src/components/editor/RightSidebar.tsx`

**May read:** `client/src/lib/api.ts` · `client/src/lib/canvasTypes.ts` · `client/src/lib/templateSlots.ts`

**Forbidden:** `api/**` · `client/src/lib/canvasTypes.ts` *(declared by Foundation — read only)* · `client/src/components/ai-chat/**`

---

## Anti-Patterns to Avoid

- Do **not** treat an absent `composition` as `'poster'`. Absent is legacy and means `'background'`.
- Do **not** declare `aiComposition` — Foundation already did. If it is missing, the fork was premature.
- Do **not** make `splitElementsForAiBackground` impure by reading a store inside it.
- Do **not** write to `usePropertyStore` without extending the history entry (AC5).
- Do **not** clear all slot-tagged layers indiscriminately — D1 bounds what "replace" means.
- Do **not** fix `loadComposedDesignToCanvas` or BL-23 here, however tempting while in the file.
- Do **not** adapt the rule around an indistinguishable `restoreCanvasData` — escalate instead.
- Do **not** open `AIChatBox.tsx`. It does not call the loader and belongs to US-EDIT-013.
- Do **not** rewrite the existing spec file.

---

## Gates

- [ ] Gate 1 — `npm run check`, `npm run test:unit:client`
- [ ] Gate 2 — manual, milestone doc §Gate 2. **Step 5 (open the exported file) is non-negotiable** — BL-09 says preview and export disagree at full resolution.

---

*Tasks created: 2026-10-24 · re-cut to Lane 1 2026-10-24*
