---
title: Story Card — US-EDIT-013
type: story
tags: [orion, edit, cleanup, ai-chat]
updated: 2026-10-24
---

# Story Card — US-EDIT-013 — Remove the dead AI chat panel code

> **Status:** 🔲 Not Started
> **Epic:** [EPIC-EDIT-03](../../EPIC.md)
> **Milestone:** [M-EDIT-04-ai-composition-over-template](../../milestones/M-EDIT-04-ai-composition-over-template.md)
> **Linear:** LIN-XXX
> **Size:** S
> **Stage:** **Lane 2 — parallel with US-EDIT-012** · worktree `../bg-cleanup`
> **Engine:** Claude (primary)
> **Created:** 2026-10-24 | **Closed:** —

```yaml
depends_on: []                                    # independent of Foundation — deletes only
owns:
  - client/src/components/ai-chat/AIChatBox.tsx
  - client/src/components/ai-chat/EnhancedSuggestionsPanel.tsx
  - client/src/components/ai-chat/AIPropertyChatInput.tsx
  - client/src/components/ai-chat/AIChatInput.tsx
  - client/src/components/ai-chat/TemplateQuickActions.tsx
  - client/src/components/ai-chat/TemplateDropdown.tsx
  - client/src/components/ai-chat/AIFloatingButton.tsx
  - client/src/components/ai-chat/AIChatHeader.tsx
  - client/src/components/ai-chat/index.ts
may_read:
  - client/src/components/ai-chat/**
forbidden:
  - api/**
  - client/src/lib/**
  - client/src/hooks/**
  - client/src/components/editor/**               # CenterCanvas + RightSidebar are Lane 1's
verification:
  - npm run check
  - npm run test:unit:client
risk: low                                         # deletion only; recoverable from git history
```

---

## Story

*As a* developer reading the AI chat panel
*I want* the unreachable components and the panel that can never open to be gone
*So that* what is in the directory is what actually runs, and a grep for a fixed defect does not
find a stale copy of it.

---

## Context

Measured against `main @ ae47339`. Seven files, ~948 lines, none of which can execute:

| File | Lines | Why it is dead |
|------|------:|----------------|
| `EnhancedSuggestionsPanel.tsx` | 355 | Mounted every time the panel opens as `isOpen={showEnhancedSuggestions}`. That state is `useState(false)` at `AIChatBox.tsx:210` and its setter is called **only from the panel's own `onClose`**. It can never open. |
| `AIPropertyChatInput.tsx` | 362 | No importer outside the barrel. Imports the panel above. |
| `AIChatInput.tsx` | 74 | Superseded by `AIChatInputField`. No importer. |
| `TemplateQuickActions.tsx` | 52 | No importer. |
| `TemplateDropdown.tsx` | 48 | No importer. |
| `AIFloatingButton.tsx` | 34 | No importer — the live button is inline in `CenterCanvas`. |
| `AIChatHeader.tsx` | 23 | No importer, **and still carries the `"Real Estate Templates"` string** the live header was renamed away from. |

That last row is the reason this is a story and not a chore: anyone grepping for the old panel name
today finds it, concludes the rename never shipped, and re-files a closed defect.

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** The six orphaned components are deleted and `client/src/components/ai-chat/index.ts` no longer exports them. `npm run check` passes with no dangling import.
- [ ] **AC2 [happy-path]:** The `EnhancedSuggestionsPanel` import, the `showEnhancedSuggestions` state and the mount are removed from `AIChatBox.tsx`, and the component file is deleted. Its only two importers — `AIChatBox.tsx` and the orphaned `AIPropertyChatInput.tsx` — are both owned by this story, so the deletion typechecks inside this worktree with no cross-lane coordination.
- [ ] **AC3 [happy-path]:** The AI chat panel opens, accepts input, uploads a photo, generates, and renders variations exactly as before — no behaviour change is observable in the panel.
- [ ] **AC4 [error-path]:** A repo-wide grep for `"Real Estate Templates"` returns only the legitimate pricing-page feature bullet in `client/src/pages/PricingPage.tsx:102` — no component copy survives.
- [ ] **AC5 [error-path]:** Orphan status is **re-verified at implementation time**, not taken from this card. Any file that has gained an importer since 2026-10-24 is reported and left in place rather than deleted.

---

## Out of Scope

- **Any behaviour change to the AI chat panel.** This story deletes unreachable code and nothing else. If removing something changes what a user sees, it was not dead and does not belong in this story.
- **Re-enabling the suggestions panel.** Whether enhanced suggestions should exist is a product question for layer C/D, not this story. Deleting it is reversible from git history.
- **The duplicate generate path.** Both surfaces still generate and still charge a credit. That is layer C, a separate day.
- **Labelling or copy changes.** The header rename, the floating-button caption and the Edit/Use collapse already shipped.
- **Any file under `api/`, `client/src/lib/`, `client/src/hooks/`, or `client/src/components/editor/`** — owned by US-EDIT-011 and US-EDIT-012.
- **`ResultsVariations.tsx`** and every other surviving `ai-chat/` component — read them if useful, change nothing.

---

## Engineering / PR

- **Branch:** `feat/edit/l2-chat-panel-dead-code`, cut from the milestone branch (worktree: `../bg-cleanup`)
- **PR:** squash into the milestone branch
- **Primary files touched:**
  - `client/src/components/ai-chat/{AIPropertyChatInput,AIChatInput,TemplateQuickActions,TemplateDropdown,AIFloatingButton,AIChatHeader}.tsx` — delete
  - `client/src/components/ai-chat/EnhancedSuggestionsPanel.tsx` — delete
  - `client/src/components/ai-chat/AIChatBox.tsx` — remove the import, the state and the mount
  - `client/src/components/ai-chat/index.ts` — prune exports

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-013-01 | Manual | P0 | Given the orphan scan is re-run, When each of the six files is checked, Then none has an importer outside the barrel | 🔲 | |
| TC-EDIT-013-02 | Unit | P0 | Given the deletions, When `npm run check` runs, Then it exits 0 with no unresolved import | 🔲 | |
| TC-EDIT-013-03 | Manual | P0 | Given the panel is opened, When a prompt is sent and a photo attached, Then generation completes and variations render as before | 🔲 | |
| TC-EDIT-013-04 | Manual | P1 | Given a repo-wide grep for `"Real Estate Templates"`, When run, Then only `PricingPage.tsx:102` matches | 🔲 | |
| TC-EDIT-013-05 | Unit | P1 | Given the full client suite, When run, Then no test referenced a deleted component | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Notes

- **This story is a good headless-agent candidate** and the only one in the milestone that is: it
  writes to no store, makes no product judgement, and `npm run check` proves it correct. AC5 exists
  because an import graph is a fact about today, not a promise.
- Deletion is fully recoverable from git history, so the cost of being wrong is low — unlike
  US-EDIT-012, where being wrong costs a customer their saved design.

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] Gate 1 passes (`npm run check`, `npm run test:unit:client`)
- [ ] Gate 2 passes (frontend story — panel behaviour unchanged)
- [ ] PR merged (milestone PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked
- [ ] STORY.md status updated to ✅ Done

---

*Story created: 2026-10-24*
