---
title: EPIC-EDIT-03 — Editable Design Discoverability
type: epic
tags: [orion, edit, ui, conversion]
updated: 2026-08-21
---

# EPIC-EDIT-03 — Editable Design Discoverability

> **Phase:** Phase 1 — Revenue Strategy
> **Status:** 🟡 In Progress — US-EDIT-005 code corrected 2026-08-22, manual verification pending
> **Linear Project:** LIN-EPIC-XXX
> **Target date:** ships alongside EPIC-INFRA-02 / EPIC-PAY-05, before the revenue-on flip
> **Owner:** Dinesh
>
> **Naming note:** `EPIC-EDIT-02` is a pre-existing `PHASE_TRACKER.md` placeholder ("Batch upload UI,
> progressive generation UX," Phase 3, unscaffolded) — unrelated. This epic took the next free
> number (`EPIC-EDIT-03`) per `PROJECT_CONTEXT.yaml`'s counter.
>
> Single-milestone, single-story epic — feature level intentionally skipped per template guidance
> ("skip for simple epics with 1–2 milestones").

---

## Goal

**Outcome:** A customer can see and understand that editable/layered designs exist as a capability
before they generate anything, not only after — via the same load-mode toggle that already works
today, made persistent and clearly labeled instead of buried in the post-generation results panel.

**Why now:** Editable design is the product's stated "paid moat" (`US-LAUNCH-015` decision log,
2026-08-13: *"editable is the paid moat"*) and the feature the current pricing relaunch's margin math
depends on customers actually using. Right now its only trigger is a small "Load as: Flat / Editable"
toggle inside `RightSidebar.tsx`'s variations panel — invisible until a generation already exists,
and the button label doesn't say anything about what "Editable" means or why it matters. This is a
pure UI-discoverability fix, no backend work, explicitly in scope for a fast, no-major-redesign
launch push.

**Success metric:** The editable-mode entry point is visible from the moment the editor loads, not
gated behind having already generated something.

---

## Root Cause / Pre-Story Analysis

- **Observed problem:** `RightSidebar.tsx:903-932` — the only editable-mode trigger is a two-button
  "Load as: Flat / Editable" toggle, rendered only inside the variations results panel (i.e., only
  after a generation completes). A second trigger, "Use This Design" / "Use This"
  (`ResultsVariations.tsx:93,181`), is similarly buried post-generation.
- **Underlying cause:** The feature was built and wired (`US-AI-047`, `US-AI-051`) purely as a
  load-mode choice for an already-generated result — never as something a prospective or new
  customer discovers on its own merits before generating.
- **Constraints we must respect:** No backend change — `renderMode` state, `useGenerationPrefs`
  (shared between AI chat and editor), and the existing editable-compose pipeline
  (`generations.service.ts`, `US-LAUNCH-015`) are all working and untouched. This is placement and
  labeling only.
- **What success looks like:** A new user opens the editor and can tell, without generating
  anything first, that "Editable Design" is a real, prominent capability — not just an incidental
  toggle they'd only find by accident.

---

## Milestones

| Milestone | Scope | Target | Status |
|-----------|-------|--------|:------:|
| [M-EDIT-01-editable-menu-surfacing](milestones/M-EDIT-01-editable-menu-surfacing.md) | Promote the existing renderMode toggle to a persistent, labeled entry point | TBD | 🔲 |

---

## Stories in this Epic

| Order | Story ID | Title | Milestone | Size | Blocked By | Status | PR |
|:-----:|----------|-------|-----------|:----:|------------|:------:|:--:|
| 1 | [US-EDIT-005](stories/US-EDIT-005/STORY.md) | Floating "Edit elements" control on the canvas | M-EDIT-01 | M | US-PAY-103 (quota badge only — see story) | 🟡 In Progress | — |

> **Revised 2026-08-21** — original scope was an in-place relabel of the existing `RightSidebar`
> toggle (S-size). Revised after reviewing `design-preview-canvas-menu.html`: a floating
> canvas-adjacent control, matching that mockup's "Edit elements" button only (Quick
> edit/Upscale/Remove BG excluded, not real; Export excluded, already exists in `EditorToolbar.tsx`).
> Bumped to M — new component, real loading/cache/charging states, one new cross-epic dependency
> on `US-PAY-103` for the quota badge.

---

## Files touched (inventory)

| File / Module | Owner Story | Layer | Status |
|---------------|-------------|-------|:------:|
| `client/src/components/editor/CanvasEditToolbar.tsx` (new) | US-EDIT-005 | frontend | ✅ |
| `client/src/components/editor/CenterCanvas.tsx` | US-EDIT-005 | frontend | ✅ |
| `client/src/components/editor/RightSidebar.tsx` (removal only) | US-EDIT-005 | frontend | ✅ |
| `client/src/hooks/useGenerationPrefs.ts` | US-EDIT-005 | frontend | ✅ (extended with `activeGenerationId`, not just removal-adjacent as originally scoped — see story log) |
| `client/src/lib/api.ts` | US-EDIT-005 | frontend | 🔲 still blocked on `US-PAY-103`, not touched |

---

## Architecture Notes (inline)

- **Entry points:** new `CanvasEditToolbar.tsx`, mounted in `CenterCanvas.tsx`; replaces
  `RightSidebar.tsx:903-932`'s in-panel toggle (removed, not duplicated). `useGenerationPrefs.ts`
  (shared `renderMode` state between editor and AI chat panels) stays the single source of truth.
- **Key abstractions:** `renderMode: 'flat' | 'editable'` — do not change its values or the
  compose pipeline that reads it; only change where/how it's triggered and displayed.
- **Design reference:** `design-preview-canvas-menu.html` (repo root) — canvas-adjacent floating
  toolbar. Only its "Edit elements" button is in scope for this epic.
- **Real latency to design for, not hide:** first-time extraction is 15–90s (`US-AI-048`, measured)
  — the UI must show this honestly, not fake an instant toggle.
- **Cross-epic dependency:** quota badge needs `getEditableUsageQuota()` from `US-PAY-103`
  (`EPIC-PAY-05`) — not yet built. Everything else in this epic is independent of `EPIC-PAY-05`.

---

## Out of Scope (Epic Level)

- Any change to the editable-compose backend pipeline, credit metering, or `US-LAUNCH-015` policy.
- "Quick edit," "Upscale HD," "Remove BG" — shown in the design reference mockup but not real
  features anywhere in the codebase. Not built, not shown as disabled/coming-soon placeholders.
- "Export" — already real and working in `EditorToolbar.tsx`'s top bar, not duplicated in this
  epic's floating control.
- Any change to `ResultsVariations.tsx`'s "Use This Design" button behavior.
- Onboarding tooltips, product tours, or any animation/motion beyond the loading vs. cache-hit
  state distinction the story itself calls for.
- Any pricing-page or marketing-copy change (that's `EPIC-PAY-05`).
- Building `getEditableUsageQuota()` — that's `US-PAY-103` (`EPIC-PAY-05`); this epic only consumes
  it once it exists.

---

## Definition of Done (Epic)

- [ ] Milestone closed
- [ ] Story has PR merged and STORY.md status = ✅ Done
- [ ] Verified on staging: editable entry point visible before any generation exists
- [ ] Gate 1 + Gate 2 (frontend) pass
- [ ] AGILE_INDEX.md epic row updated to ✅ Done

---

## Implementation Update (log)

### 2026-08-22 — Verification + correction pass (US-EDIT-005)
- Implementation was checked against the actual code (not just its own TASKS.md claims) before any
  manual testing had occurred; STORY.md had marked itself ✅ Done while its own DoD checklist and
  test cases were still blank — corrected to 🟡 In Progress.
- Two real functional bugs found and fixed: the compose call had no real generation id wired in
  (always sent the placeholder string `'current-gen'` — AC2 could not have worked), and the loading
  spinner had no cache-hit distinction at all (AC3 violated outright). Also fixed: AC5's upgrade
  prompt was still a bare toast, not the dedicated moment the AC calls for; and the component
  bypassed the shared `planVariationLoad` (US-AI-047), risking exactly the flat/editable-decision
  drift that module exists to prevent.
- AC4 (charge-specific confirmation) confirmed genuinely blocked, not just on `US-PAY-103`'s badge:
  the `/compose` response has no cache-hit/charge signal for the client to key off at all, and
  adding one is backend work Out of Scope for this story.
- See `stories/US-EDIT-005/STORY.md` Implementation Update for full detail. Still open: manual test
  cases, PR, Gate 2 review.

### 2026-08-21 — Scope revised after design mockup review
- User shared `design-preview-canvas-menu.html` (canvas-centric floating toolbar) as the intended
  visual/interaction direction. `US-EDIT-005` rewritten from an in-place `RightSidebar` relabel (S)
  to a floating canvas-adjacent control (M) — real loading/cache/charging states added, "Quick
  edit"/"Upscale"/"Remove BG" explicitly excluded (not real features), "Export" excluded (already
  exists in `EditorToolbar.tsx`). New dependency surfaced: quota badge needs `US-PAY-103`
  (`EPIC-PAY-05`), not built yet.
- Re-hardened after the STORY.md rewrite (SHA changed) — see lock file.

### 2026-08-21 — Epic scaffolded
- Written as a standalone, single-story epic per explicit scope request — part of the "R2 + Pricing
  relaunch + editable discoverability, no major redesign" fast-launch plan.

---

*Epic created: 2026-08-21 | Last updated: 2026-08-21*
