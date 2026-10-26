---
title: Story Card — US-EDIT-017
type: story
tags: [orion, edit, cleanup]
updated: 2026-10-25
---

# Story Card — US-EDIT-017 — Lane C: delete the orphaned CustomizePanel

> **Status:** 🔲 Not Started — independent; can start now
> **Epic:** [EPIC-EDIT-03](../../EPIC.md)
> **Milestone:** [M-EDIT-05-one-source-of-truth](../../milestones/M-EDIT-05-one-source-of-truth.md)
> **Linear:** LIN-XXX
> **Size:** S
> **Stage:** Lane C — worktree `../bg-deadcode`
> **Engine:** Claude (primary)
> **Created:** 2026-10-25 | **Closed:** —

```yaml
depends_on: []                 # independent
owns:
  - client/src/components/editor/CustomizePanel.tsx    # delete
  - client/src/lib/slotIds.ts                           # comment fix only
  - client/src/lib/templateSlots.ts                     # comment fix only
may_read:
  - client/src/components/editor/TemplateSlotSection.tsx
forbidden:
  - client/src/components/editor/RightSidebar.tsx
  - client/src/components/editor/TemplateSlotSection.tsx   # the live twin — do not delete
verification:
  - npm run check
  - npm run test:unit:client
risk: low           # nothing imports it
```

> **Ownership note:** `slotIds.ts` and `templateSlots.ts` are also in US-EDIT-014's `owns:`. Lane C
> touches only their header comments. Land Lane C **first** at integration (runbook Stage 4) so
> Foundation's branch rebases over a comment-only change.

---

## User Story

**As** a developer on this codebase,
**I want** the unused `CustomizePanel.tsx` removed,
**so that** nobody edits the dead twin of the live slot editor by mistake.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** `CustomizePanel.tsx` is deleted, and a repo-wide search for
      `CustomizePanel` in `client/src/` finds no import and no stale reference.
- [x] **AC2 [happy-path]:** The comments in `slotIds.ts` and `templateSlots.ts` that name
      `CustomizePanel` are corrected to name `TemplateSlotSection`, not left pointing at a deleted file.
- [x] **AC3 [error-path]:** If `CustomizePanel` has gained an importer since 2026-10-25, it is left in
      place and reported — not deleted.
- [x] **AC4 [error-path]:** No user-visible behaviour changes. If removing something changes what a
      user sees, it was not dead — revert that part and report it.

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-017-01 | Manual | P0 | Given the repo, When `CustomizePanel` is searched in `client/src/`, Then no import exists before deletion | 🔲 | |
| TC-EDIT-017-02 | Unit | P0 | Given the deletion, When `npm run check` runs, Then it exits 0 | 🔲 | |
| TC-EDIT-017-03 | Manual | P1 | Given the edited comments, When read, Then they name `TemplateSlotSection` | 🔲 | |
| TC-EDIT-017-04 | Manual | P1 | Given the editor, When the sidebar is opened, Then it renders as before | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes (`npm run check`, `npm run test:unit:client`)
- [ ] PR merged (milestone PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

*Story created: 2026-10-25*
