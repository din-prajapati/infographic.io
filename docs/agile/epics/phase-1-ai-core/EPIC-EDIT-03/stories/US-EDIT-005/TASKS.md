---
title: PR Task List — US-EDIT-005
type: template
tags: [orion, template]
updated: 2026-08-21
---

# PR Task List — US-EDIT-005

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/edit/m-01-editable-menu-surfacing`
> **PR:** [#35](https://github.com/din-prajapati/infographic.io/pull/35), [#38](https://github.com/din-prajapati/infographic.io/pull/38)
> **Linear:** LIN-XXX

---

## Four Pillars Pre-flight

- [ ] **Brain** — STORY.md filled: ACs written, design reference linked, dependency on `US-PAY-103` noted
- [ ] **Muscle** — T1-T4 with exact test commands
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists
- [ ] **Env** — [ENV.yaml](../../ENV.yaml) loaded (no new vars)

---

## PR Scope Summary

**One-liner:** Floating "Edit elements" control on the canvas, replacing the buried RightSidebar toggle, with honest loading/cache/charging states.

```
feat(edit): floating Edit-elements control on canvas — US-EDIT-005
```

---

## ⚠️ Sequencing note

**T4 (quota badge) is blocked on `US-PAY-103`** (`EPIC-PAY-05`, `getEditableUsageQuota()`). T1–T3
can proceed independently — build the control, loading/cache states, and charging confirmation
first; wire the real quota number once `US-PAY-103` ships. Do not stub a fake number in the
meantime beyond an explicit "—" or loading placeholder.

---

## Task Breakdown

### T1 — New floating control component
- **File:** `client/src/components/editor/CanvasEditToolbar.tsx` (new)
- **Type:** `feat`
- **AC(s) covered:** AC1
- **Changes:**
  - New component rendering the single "Edit elements" pill/button, positioned adjacent to the
    canvas (not inside `RightSidebar`)
  - Reads `renderMode` from `useGenerationPrefs` for its active/inactive visual state
  - Visible whenever a flat generation exists on the canvas — not gated behind opening any other
    panel

**Commit:**
```bash
git add client/src/components/editor/CanvasEditToolbar.tsx
git commit -m "feat(edit): add floating CanvasEditToolbar with Edit-elements control — US-EDIT-005"
```

---

### T2 — Mount in CenterCanvas, remove the old RightSidebar toggle
- **File:** `client/src/components/editor/CenterCanvas.tsx`, `client/src/components/editor/RightSidebar.tsx`
- **Type:** `feat`
- **AC(s) covered:** AC1
- **Changes:**
  - Mount `CanvasEditToolbar` in `CenterCanvas.tsx`
  - Remove the old "Load as: Flat / Editable" toggle block from `RightSidebar.tsx:903-932` — this
    is a replacement, not an addition; do not leave both live at once

**Commit:**
```bash
git add client/src/components/editor/CenterCanvas.tsx client/src/components/editor/RightSidebar.tsx
git commit -m "feat(edit): mount CanvasEditToolbar, remove old sidebar toggle — US-EDIT-005"
```

---

### T3 — Loading, cache-hit, and credit-charge states
- **File:** `client/src/components/editor/CanvasEditToolbar.tsx`
- **Type:** `feat`
- **AC(s) covered:** AC2, AC3, AC4
- **Changes:**
  - First-time extraction: real loading state on the control (not instant), driven by the existing
    compose call's actual duration
  - Cache hit: no loading state, visibly instant
  - Composing a 2nd/3rd variation on the same generation: visible confirmation the moment the credit
    charge actually happens (toast or inline), never before

**Commit:**
```bash
git add client/src/components/editor/CanvasEditToolbar.tsx
git commit -m "feat(edit): real loading/cache/charge states on Edit-elements control — US-EDIT-005"
```

---

### T4 — Quota badge (BLOCKED on US-PAY-103) + FREE-tier upgrade prompt
- **File:** `client/src/components/editor/CanvasEditToolbar.tsx`, `client/src/lib/api.ts`
- **Type:** `feat`
- **AC(s) covered:** AC4 (badge display), AC5
- **Changes:**
  - Wire the quota badge to `getEditableUsageQuota()` once `US-PAY-103` ships — do not build a
    parallel/fake source in the meantime
  - Replace the current bare toast (`RightSidebar.tsx:486`) with a dedicated upgrade prompt for
    FREE-tier users past their trial

**Commit:**
```bash
git add client/src/components/editor/CanvasEditToolbar.tsx client/src/lib/api.ts
git commit -m "feat(edit): quota badge + dedicated upgrade prompt — US-EDIT-005"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `CanvasEditToolbar.tsx` | T1, T3, T4 | AC1-5 | new file |
| `CenterCanvas.tsx` | T2 | AC1 | mount point |
| `RightSidebar.tsx` | T2 | AC1 | old toggle removed |
| `api.ts` | T4 | AC4 | blocked on US-PAY-103 |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit:client
# Manual: TC-EDIT-005-01 through 05, per STORY.md Test Cases
```

---

## Task Checklist

- [x] T1 — new floating control (file: `CanvasEditToolbar.tsx`, type: `feat`)
- [x] T2 — mount + remove old toggle (files: `CenterCanvas.tsx`, `RightSidebar.tsx`, type: `feat`)
- [x] T3 — loading/cache/charge states (file: `CanvasEditToolbar.tsx`, type: `feat`) — corrected
      2026-08-22: first pass set `isExtracting` unconditionally around every compose call
      (no cache-hit distinction at all, violating AC3), and called
      `generationsApi.getComposedDesign` directly with a hardcoded `'current-gen'`
      placeholder id (the real id was never wired in from anywhere — AC2 could not
      have worked end-to-end). Fixed: real id now sourced from
      `useGenerationPrefs.activeGenerationId` (set by `RightSidebar` on generation
      completion, same lifecycle as its own `resultsGenerationId`); loading spinner
      delayed `LOADING_INDICATOR_DELAY_MS` (200ms) so a cache hit resolves before it
      ever renders; compose call now goes through the shared `planVariationLoad`
      (US-AI-047) instead of a second, diverging implementation.
- [x] T4a — upgrade prompt (file: `CanvasEditToolbar.tsx`, type: `feat`) — corrected
      2026-08-22: first pass still used `toast.error(...)`, the exact bare-toast
      pattern AC5 says to replace, and left `RightSidebar.tsx:486`'s toast
      untouched — two bare toasts, no dedicated moment. Fixed: real `Dialog`
      modal (`client/src/components/ui/dialog.tsx`) shown on
      `EDITABLE_REQUIRES_UPGRADE_REASON`.
- [~] ~~T4b — quota badge (type: `feat`)~~ _(deferred 2026-08-26 → [US-EDIT-008](../US-EDIT-008/TASKS.md) — `/compose` does not expose the charge signal; see STORY.md DoD exception)_
      No badge exists in the component; `getEditableUsageQuota()` does not exist
      anywhere in the codebase (verified). Do not check this off until that story
      ships and the badge is wired to it.
- [x] Gate 1 passes ✅ (tsc 0 errors, 229 unit tests pass — verified by re-running
      both commands 2026-08-22; no new automated tests were added for
      `CanvasEditToolbar.tsx` itself, consistent with this story's Test Cases all
      being Manual — see STORY.md)
- [x] Gate 2 — browser-verified 2026-08-25 via `e2e/us-edit-005-canvas-edit-toolbar.spec.ts`
      against a live localhost dev server (TC-01/02/03 pass).
      this off until it has
- [x] STORY.md ACs corrected to match actual code state (see STORY.md)
- [x] EPIC.md "Implementation Update" log appended ✅ (2026-08-22 entry)

---

## Test Is Truth

> **Rule (non-negotiable):** Do not weaken, skip, or modify a failing test to make it pass. Fix the
> code. Do not open a PR until all commands in "Exact Test Commands" pass or are explicitly marked
> N/A with a written reason.

---

## Anti-Patterns to Avoid in This Story

- Do NOT build "Quick edit," "Upscale HD," or "Remove BG" buttons, even disabled/greyed — they
  don't exist as features; showing them promises something the product doesn't have.
- Do NOT add a second Export button — it already exists in the top toolbar.
- Do NOT leave the old `RightSidebar.tsx` toggle in place alongside the new control — remove it,
  this is a replacement.
- Do NOT stub a fake quota number to avoid the `US-PAY-103` dependency — show a loading/placeholder
  state or sequence the work instead.
- Do NOT touch the backend compose pipeline or credit-charging logic — display and timing only.

---

*Tasks created: 2026-08-21*
