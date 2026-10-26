---
title: Story Card — US-EDIT-016
type: story
tags: [orion, edit, canvas, binding]
updated: 2026-10-25
---

# Story Card — US-EDIT-016 — Lane B: canvas edits reach the field

> **Status:** 🔲 Not Started — **blocked on US-EDIT-014 merging**
> **Epic:** [EPIC-EDIT-03](../../EPIC.md)
> **Milestone:** [M-EDIT-05-one-source-of-truth](../../milestones/M-EDIT-05-one-source-of-truth.md)
> **Linear:** LIN-XXX
> **Size:** M
> **Stage:** Lane B — worktree `../bg-cleanup`
> **Engine:** Claude (primary)
> **Created:** 2026-10-25 | **Closed:** —

```yaml
depends_on: [US-EDIT-014]
owns:
  - client/src/components/canvas/TextElement.tsx
  - client/src/components/canvas/__tests__/**
may_read:
  - client/src/lib/listingBindings.ts
  - client/src/hooks/useCanvasStore.ts
forbidden:
  - client/src/lib/**
  - client/src/components/editor/**          # Lane A
  - client/src/hooks/useCanvasStore.ts       # read only — Foundation owns writes
verification:
  - npm run check
  - npm run test:unit:client
risk: medium
```

---

## User Story

**As** a listing agent,
**I want** a fact I edit directly on the canvas to update the matching sidebar field,
**so that** the sidebar and the design never disagree, whichever one I edited (D3).

---

## Context

The commit point is one line: `TextElement.tsx` around `:46`,
`updateElement(element.id, { content: editValue })`. This story adds the write-back through
`writeCanvasToField` for slot-tagged text. `report.*`, `openHouse.*` and `agent.cta` have no field —
that is the normal case, not an error.

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** Committing an edit on a **slot-tagged** text element also writes the
      matching store field via `writeCanvasToField`.
- [ ] **AC2 [happy-path]:** One canvas edit produces **one** history entry; one Undo reverts both the
      canvas text and the field.
- [ ] **AC3 [error-path]:** Committing an edit on an **untagged** text element writes only the element —
      no store write.
- [ ] **AC4 [error-path]:** An element whose slot has no field (`report.kpis`, `openHouse.date`,
      `agent.cta`) commits normally and writes no field; nothing throws.
- [ ] **AC5 [error-path]:** An edit to a `property.specs` / `property.facts` element stays on the
      canvas and does not change `beds`, `baths` or `sqft` (Q1, answered 2026-10-26).
- [ ] **AC6 [happy-path]:** A `composed-*` element from extraction follows the same rule as any other
      element with or without a slot — no special case.

---

## Out of Scope

- `client/src/lib/**`, `useCanvasStore.ts` writes, and every `components/editor/` file.
- Detaching a layer from its field (a later, explicit action — runbook D3).

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-016-01 | Unit | P0 | Given a `property.headline` text element, When an edit commits, Then the store headline equals the new text | 🔲 | |
| TC-EDIT-016-02 | Unit | P0 | Given that edit, When Undo is pressed once, Then canvas and store both revert | 🔲 | |
| TC-EDIT-016-03 | Unit | P0 | Given an untagged text element, When an edit commits, Then no store field changes | 🔲 | |
| TC-EDIT-016-04 | Unit | P1 | Given a `report.kpis` element, When an edit commits, Then it commits and nothing throws | 🔲 | |
| TC-EDIT-016-05 | Unit | P1 | Given a specs element, When edited, Then `beds`/`baths`/`sqft` are unchanged (Q1) | 🔲 | |
| TC-EDIT-016-06 | Manual | P0 | Given the editor, When the canvas headline is edited, Then the Headline input shows it (runbook MV-05-02) | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes (`npm run check`, `npm run test:unit:client`)
- [ ] Gate 2 passes (runbook MV-05-02)
- [ ] PR merged (milestone PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

*Story created: 2026-10-25*
