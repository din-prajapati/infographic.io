---
title: EPIC-EDIT-03 — Editable Design Discoverability
type: epic
tags: [orion, edit, ui, conversion]
updated: 2026-08-26
---

# EPIC-EDIT-03 — Editable Design Discoverability

> **Phase:** Phase 1 — Revenue Strategy
> **Status:** 🟡 In Progress — **M-EDIT-01 closed 2026-08-26.** US-EDIT-005 shipped and was
> live-verified; its AC4 was descoped to US-EDIT-008, which now owns the quota badge and the
> backend response-shape change it depends on. M-EDIT-02 (brand layers) scaffolded, not started.
> Open: US-EDIT-006, US-EDIT-007, US-EDIT-008, US-EDIT-009.
> **Linear Project:** LIN-EPIC-XXX
> **Target date:** ships alongside EPIC-INFRA-02 / EPIC-PAY-05, before the revenue-on flip
> **Owner:** Dinesh
>
> **Naming note:** `EPIC-EDIT-02` is a pre-existing `PHASE_TRACKER.md` placeholder ("Batch upload UI,
> progressive generation UX," Phase 3, unscaffolded) — unrelated. This epic took the next free
> number (`EPIC-EDIT-03`) per `PROJECT_CONTEXT.yaml`'s counter.
>
> Feature level intentionally skipped per template guidance. Started as a single-milestone,
> single-story epic; M-EDIT-02 (brand layers) was added 2026-08-26.
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
| [M-EDIT-01-editable-menu-surfacing](milestones/M-EDIT-01-editable-menu-surfacing.md) | Promote the existing renderMode toggle to a persistent, labeled entry point | 2026-08-26 | ✅ |
| [M-EDIT-02-brand-layers](milestones/M-EDIT-02-brand-layers.md) | Agent brand furniture (logo, licence, headshot, QR) as real canvas layers | TBD | 🔲 |
| [M-EDIT-03-single-editable-path](milestones/M-EDIT-03-single-editable-path.md) | Remove the pre-placement Flat/Editable toggle — one way to get editable text, on the canvas | TBD | 🟡 PR #49 |

---

## Stories in this Epic

| Order | Story ID | Title | Milestone | Size | Blocked By | Status | PR |
|:-----:|----------|-------|-----------|:----:|------------|:------:|:--:|
| 1 | [US-EDIT-005](stories/US-EDIT-005/STORY.md) | Floating "Edit elements" control on the canvas | M-EDIT-01 | M | — | ✅ Done | [#35](https://github.com/din-prajapati/infographic.io/pull/35), [#38](https://github.com/din-prajapati/infographic.io/pull/38) |
| 2 | [US-EDIT-006](stories/US-EDIT-006/STORY.md) | Brand layers from existing data — logo + licence | M-EDIT-02 | M | — | 🔲 | — |
| 3 | [US-EDIT-007](stories/US-EDIT-007/STORY.md) | Agent headshot + QR code | M-EDIT-02 | M | US-EDIT-006 | 🔲 | — |
| 4 | [US-EDIT-008](stories/US-EDIT-008/STORY.md) | Editable quota badge + charge confirmation | M-EDIT-01 | M | — (deferred from US-EDIT-005 AC4) | 🔲 | — |
| 5 | [US-EDIT-009](stories/US-EDIT-009/STORY.md) | Remove the pre-placement Flat/Editable toggle | M-EDIT-03 | M | — | 🟡 | [#49](https://github.com/din-prajapati/infographic.io/pull/49) |

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
  `RightSidebar.tsx:903-932`'s in-panel toggle (removed, not duplicated).
- **Key abstraction — superseded 2026-09-01 by US-EDIT-009 (M-EDIT-03).** This section used to
  read: *"`useGenerationPrefs.ts` (shared `renderMode` state) stays the single source of truth"*
  and *"`renderMode: 'flat' | 'editable'` — do not change its values."* **`renderMode` no longer
  exists.** Generation is always flat and extraction is always a post-placement canvas action, so
  there is no mode to hold: a session-global preference was the wrong shape for a per-design
  question, and holding one is what let a single compose make every other canvas in the session
  claim to be editable. What `useGenerationPrefs` keeps is `activeGenerationId` — an identity, not
  a preference. The compose pipeline itself is unchanged.
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

## Blockers

| Blocker | Owner | Status |
|---|---|---|
| `getEditableUsageQuota()` — needed for US-EDIT-005 AC4's quota number | US-PAY-103 | ✅ **cleared 2026-08-26** — shipped to `main` with the EPIC-PAY-05 merge (`generations.controller.ts:29`, `GET /infographics/generations/usage/quota/editable`) |
| `POST /:id/compose` does not return `isCacheHit` / `isExtraCompose` to the client | [US-EDIT-008](stories/US-EDIT-008/STORY.md) | ✅ **owned as of 2026-08-26** — was unowned; US-EDIT-005 AC4 descoped into a story that carries it |

Resolved 2026-08-26 by descoping: AC4 moved out of US-EDIT-005 into
[US-EDIT-008](stories/US-EDIT-008/STORY.md), which owns both the badge and the response-shape
change it needs. US-EDIT-005 closed on the value it had delivered rather than sitting open
against a dependency nobody owned.

---

## Implementation Update (log)

### 2026-09-01 — US-EDIT-009 implemented (M-EDIT-03): one editable path

The pre-generation "Edit as: Flat / Editable" toggle is gone from both of the places it rendered
in AI Chat, and from Quick Generate. Generation is always flat; text becomes editable only via
`CanvasEditToolbar`, after the design is on the canvas. Gate 1 green (types clean, 497 backend +
262 client tests). Gate 2 (staging) outstanding.

Three findings worth carrying forward, because two of them were defects in the story card itself:

- **AC9, a regression the original ACs would have shipped.** `setActiveGenerationId` was called in
  exactly one place — RightSidebar's *panel-triggered* WebSocket handler. Removing AI Chat's own
  editable branch would therefore have stranded every AI Chat design at *"Design isn't linked to a
  generation"* on Edit elements — the toast that already claimed the feature works "right after a
  Quick Generate or AI Chat result". Worse was the stale case: a leftover id from an earlier Quick
  Generate would have composed the text of a design the user was no longer looking at. AI Chat now
  publishes its id like the sidebar does. Found by tracing the surviving path, not by review.
- **AC4 and AC7 could not both hold literally.** `main.ts` sets `forbidNonWhitelisted: true`, so
  deleting `renderMode` from the DTO would 400 every generate from a stale browser tab. The field
  stays as an ignored, unvalidated, Swagger-hidden compatibility shim; everything else stops
  reading it. Delete the shim once no deployed client sends it.
- **AC6 was wrong and was not followed.** `loadVariation.ts`'s `renderMode` is a *function
  parameter*, not the session preference — `CanvasEditToolbar` passes it hardcoded as `'editable'`,
  and that is the path the story exists to preserve. Changing it to a "flat-only contract" would
  have broken exactly that. The file is unchanged and its 9 assertions pass as-is.

Also: `US-AI-051`'s text-free prompt now triggers on `photoReference` alone (Option A). A
real-photo generation gets an unmarked background whether or not the user would once have chosen
Editable — headline and price are no longer baked into the customer's own listing photograph.
Verified by a mutation-checked test; the two sibling cases are documented as guards, not proofs.

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

**2026-08-26 — status reconciliation.** Epic and M-EDIT-01 headers still described the state as of
2026-08-22 ("code corrected, manual verification pending"). Since then US-EDIT-005 was merged
(PR #35), live-verified against a real dev server, and three defects found by that verification
were fixed and merged (PR #38):

1. `hasExtractedLayers` counted a *template's* own text/shape layers as extraction output, so the
   control reported "Editable layers active" on a flat design and the click was a permanent no-op.
2. The compose request posted `element.src` — a multi-MB base64 data: URL — blowing the 100kb
   `express.json()` limit and returning 500, which `planVariationLoad` surfaced as the misleading
   "No separate text layers detected".
3. `isEditableMode` ORed in the session-global `renderMode`, so one compose made every canvas in
   the session claim to be editable. Removing it also closed an unintended charge path: merely
   clicking "Use This" on a second variation was firing a paid compose.

Also recorded: US-PAY-103 shipped `getEditableUsageQuota()` to `main`, clearing half of AC4's
dependency. The remaining half (compose response shape) is unowned — see Blockers.
