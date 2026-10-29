# US-KIT-002 — Kit UI: Kit View, Per-Asset Regenerate, Download All

> **Epic:** [EPIC-KIT-01](../../EPIC.md) · **Milestone:** [M-KIT-01](../../milestones/M-KIT-01-kit-engine.md)
> **Size:** M · **Status:** 🔲 Not Started
> **Depends on:** US-KIT-001

---

## Story

As a **solo agent**, I want **to see my listing's whole kit in one view, regenerate any single asset, and download everything at once**, so that **I can go from listing to posted marketing in one sitting**.

## Acceptance Criteria (draft)

- [ ] **AC1 [happy-path]:** Kit page: asset grid grouped by format with per-asset status (generating/done/failed)
- [ ] **AC2 [happy-path]:** Per-asset actions: regenerate, open in editor, download
- [ ] **AC3 [happy-path]:** "Download all" (zip) with platform-named files (`{address}-ig-post.png` …)
- [ ] **AC4 [happy-path]:** Generation progress streamed per asset (existing Socket.io events)
- [ ] **AC5 [error-path]:** When a per-asset regenerate action fails, that asset's status shows "failed" with a visible retry action, rather than reverting silently or crashing the kit view; "Download all" excludes any asset still in a failed/generating state instead of producing a broken zip entry.

## Out of Scope

- Sharing/scheduling · kit templates gallery

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-KIT-002-01 | Manual | P0 | Open a kit → asset grid shows all formats grouped, each with correct status | 🔲 | |
| TC-KIT-002-02 | Manual | P0 | Regenerate a single asset → only that asset updates, others unaffected | 🔲 | |
| TC-KIT-002-03 | Manual | P1 | Click "Download all" → zip contains platform-named files for every completed asset | 🔲 | |
| TC-KIT-002-04 | Manual | P1 | Trigger kit generation → per-asset progress updates stream live via Socket.io | 🔲 | |
| TC-KIT-002-05 | Manual | P1 | Force a regenerate to fail → asset shows "failed" with retry action; "Download all" excludes it | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

> ⚠️ **Harden note:** This story is a draft stub (no "Primary Files Touched"/Engineering section, no TASKS.md) — deep-fill via `/new-story` recommended before `/implement-story`.

---

*Created: 2026-07-03*
