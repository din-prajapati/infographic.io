---
title: Story Card — US-EDIT-012
type: story
tags: [orion, edit, canvas, bl-27]
updated: 2026-10-24
---

# Story Card — US-EDIT-012 — Branch the layer rule on composition, with one undo

> **Status:** 🔲 Not Started — **blocked on D1, D2, and US-EDIT-011 merging**
> **Epic:** [EPIC-EDIT-03](../../EPIC.md)
> **Milestone:** [M-EDIT-04-ai-composition-over-template](../../milestones/M-EDIT-04-ai-composition-over-template.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Stage:** **Lane 1 — parallel with US-EDIT-013** · worktree `../bg-canvas`
> **Engine:** Claude (primary), interactive — see Notes
> **Created:** 2026-10-24 | **Closed:** —

```yaml
depends_on: [US-EDIT-011]
owns:
  - client/src/lib/canvasState.ts
  - client/src/lib/__tests__/canvasState.aiBackground.spec.ts
  - client/src/hooks/usePropertyStore.ts          # only if D2 selects the store-write variant
  - client/src/components/editor/CenterCanvas.tsx
  - client/src/components/editor/RightSidebar.tsx
may_read:
  - client/src/lib/api.ts
  - client/src/lib/canvasTypes.ts
  - client/src/lib/templateSlots.ts
forbidden:
  - api/**
  - client/src/lib/canvasTypes.ts                 # declared by Foundation; read only
  - client/src/components/ai-chat/**              # owned by US-EDIT-013
verification:
  - npm run check
  - npm run test:unit:client
risk: high                                        # the only task that can destroy a saved design
```

---

## Story

*As a* real estate agent placing an AI design onto a template
*I want* the canvas to show one price, one headline and one agent footer
*So that* I never export a listing advertising two prices that disagree with each other.

---

## Context

This is the story that closes [BL-27](../../../../../BACKLOG.md). The 2026-09-07 Gate 2 capture
shows a single canvas carrying **₹1.9 Cr** (baked into the AI image), **₹1.18 Cr** (the template's
unfilled placeholder) and neither matching the **₹1.85 Cr** the user typed.

`splitElementsForAiBackground` (`canvasState.ts:340`) is pure and already unit-tested — it keeps
everything that is not an AI background or a `composed-` element, and `loadAiVariationToCanvas`
places the image beneath the survivors at `minZIndex - 1`. The function is correct for a
*background*. It is wrong for a *poster*, and until US-EDIT-011 it had no way to tell them apart.

**This story carries the milestone's only data-loss risk.** Read the Notes before starting.

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** When a variation carrying `composition: 'poster'` is placed,
      `splitElementsForAiBackground` additionally discards template-owned slot-tagged layers, and
      the canvas renders one price, one headline and one agent footer.
- [ ] **AC2 [happy-path]:** When a variation carrying `composition: 'background'` is placed, the
      partition is byte-for-byte what today's code produces — the real-photo path is unchanged.
- [ ] **AC3 [error-path]:** When a variation carries **no** `composition` (a legacy generation, or
      a design saved before this milestone), the function behaves as `'background'`. Absent is never
      treated as `'poster'`.
- [ ] **AC4 [happy-path]:** `loadAiVariationToCanvas` sets `aiComposition` on the `ImageElement` it
      builds, from the variation passed by its two callers — `CenterCanvas.tsx:111` and
      `RightSidebar.tsx:566`. The field itself is declared by US-EDIT-011 AC6; this story reads
      `canvasTypes.ts` and does not write it.
- [ ] **AC5 [rollback]:** One Undo press after a poster placement restores the pre-placement canvas
      in a single step — the existing `pushToHistory(snapshot.elements)` at `canvasState.ts:441`
      covers everything the story discards. If D2 selects the store-write variant, the same single
      press also restores the prior property values.
- [ ] **AC6 [error-path]:** Opening a design saved before this milestone renders identically to how
      it rendered before this milestone. Verified against a real saved design, not a fixture.
- [ ] **AC7 [happy-path]:** Repeated placement does not accumulate duplicate background layers —
      the US-AI-053 AC1 guarantee survives on both composition branches.

---

## Out of Scope

- **Building the binding layer.** AC5's optional store write moves values for *one* placement under
  *one* undo. It is not a data model, and it does not make `usePropertyStore` a canvas source of truth.
- **`loadComposedDesignToCanvas`.** The second canvas route is deferred — see BL-23, which records
  that it is missing the same undo push. Do not fix that here.
- **Any migration of the 181 saved designs.** AC3 and AC6 exist precisely so that none is needed.
- **Changing what the server sends.** `composition` arrives as US-EDIT-011 defines it.
- **Declaring the `aiComposition` field.** US-EDIT-011 AC6 declares it on `ImageElement`; this story only assigns it.
- **Any file under `api/`, `client/src/lib/api.ts`, `client/src/lib/canvasTypes.ts`, or `client/src/components/ai-chat/`** — owned by US-EDIT-011 and US-EDIT-013.
- **`AIChatBox.tsx`.** It does not call `loadAiVariationToCanvas` — the callers are `CenterCanvas` and `RightSidebar` — so it has no part in this story and belongs wholly to US-EDIT-013. There is no handover.

---

## Engineering / PR

- **Branch:** `feat/edit/l1-canvas-layer-rule`, cut from the milestone branch **after Foundation merges** (worktree: `../bg-canvas`)
- **PR:** squash into the milestone branch
- **Primary files touched:**
  - `client/src/lib/canvasState.ts` — the branch, the element, the history push
  - `client/src/components/editor/CenterCanvas.tsx` — pass the variation's flag at the `:111` call site
  - `client/src/components/editor/RightSidebar.tsx` — same at the `:566` call site
  - `client/src/hooks/usePropertyStore.ts` — only if D2 selects the store-write variant
  - `client/src/lib/__tests__/canvasState.aiBackground.spec.ts` — extend, do not replace

---

## Decisions required before implementation

| ID | Question | Default if undecided |
|----|----------|----------------------|
| D1 | Does "replace" mean the whole composition, or only template-owned slot-tagged layers? A user's own text box carries no slot tag. | Warn-only — the defect survives the story |
| D2 | One undo spanning the canvas *and* the property store, or no store write at all? | **No store write** — layer discard only, AC5's second sentence drops |

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-012-01 | Unit | P0 | Given elements + `composition: 'poster'`, When split, Then slot-tagged template layers are in neither `retained` nor the canvas | 🔲 | |
| TC-EDIT-012-02 | Unit | P0 | Given elements + `composition: 'background'`, When split, Then the partition equals today's output | 🔲 | |
| TC-EDIT-012-03 | Unit | P0 | Given elements + no composition, When split, Then the partition equals the `'background'` case | 🔲 | |
| TC-EDIT-012-04 | Unit | P0 | Given a poster placement, When undo is called once, Then elements equal the pre-placement snapshot | 🔲 | |
| TC-EDIT-012-05 | Unit | P1 | Given a user-authored text box with no slot tag, When a poster is placed, Then it survives or is discarded per D1 — asserted either way | 🔲 | |
| TC-EDIT-012-06 | Unit | P1 | Given two successive poster placements, When the second lands, Then exactly one AI image element exists | 🔲 | |
| TC-EDIT-012-07 | Manual | P0 | Given a design saved before this milestone, When reopened, Then it renders identically — real saved design | 🔲 | |
| TC-EDIT-012-08 | Manual | P0 | Given a poster on a template, When exported and the **file** opened, Then one price, no overlap, no placeholder | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Notes / Risks

- **`pushToHistory` records canvas elements only** (`canvasState.ts:441`). A property-store write
  made alongside it sits *outside* the history system. A naive D2 implementation therefore gives the
  user an Undo that restores their layers and silently keeps the overwritten price. Either extend
  the history entry to carry both stores, or take the D2 default and write nothing.
- **`restoreCanvasData` serves both template load and saved-design restore** —
  `EditorLayout.tsx:86`/`:97`/`:120`, `TemplatesPanel.tsx:149`, `CenterCanvas.tsx:135`. Any rule that
  treats unedited slot content as disposable will treat a reopened customer design the same way.
  **This is the most likely source of a data-loss bug in the milestone**, and it is why AC6 requires
  a real saved design rather than a fixture.
- **Slot coverage is uneven.** `property.price` is tagged on 3 of 5 templates, `property.headline` on
  4 of 5. US-EDIT-011 AC7 closes the gap; if that AC is descoped, AC1 must state the partial
  coverage honestly rather than claiming all five.

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes (`npm run check`, `npm run test:unit:client`)
- [ ] Gate 2 passes (frontend story — the manual export inspection, milestone doc §Gate 2)
- [ ] PR merged (milestone PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

*Story created: 2026-10-24*
