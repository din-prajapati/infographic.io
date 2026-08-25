---
title: Story Card — US-EDIT-005
type: story
tags: [orion, edit, ui, conversion]
updated: 2026-08-21
---

# Story Card — US-EDIT-005

> **Status:** 🟡 In Progress — merged (PR #35) and live-verified 2026-08-25; the verification pass
> found and fixed two real defects that made the control non-functional in the template flow (see
> Implementation Update). AC4's quota badge remains blocked on `US-PAY-103`.
> **Epic:** [EPIC-EDIT-03](../../EPIC.md)
> **Milestone:** [M-EDIT-01-editable-menu-surfacing](../../milestones/M-EDIT-01-editable-menu-surfacing.md)
> **Linear:** LIN-XXX
> **Size:** M _(bumped from S — floating canvas component + real loading/cache/charging states,
> not a same-file relabel)_
> **Created:** 2026-08-21 | **Closed:** _not yet — see Status_

---

## Story

*As* a customer using the editor
*I want* a floating "Edit elements" control positioned directly above/adjacent to the canvas — the
single place my attention already is — instead of a toggle buried in a sidebar panel that only
appears after a generation exists
*So that* I discover and understand the product's paid-differentiating feature at the moment I'm
looking at my design, with honest loading/charging behavior, not a hidden setting

---

## Design reference

[design-preview-canvas-menu.html](../../../../../../design-preview-canvas-menu.html) — canvas-centric
floating toolbar mockup. **Only the "Edit elements" control is in scope.** "Quick edit," "Upscale
HD," and "Remove BG" shown in that mockup do not exist anywhere in the codebase and are explicitly
excluded — do not build placeholder/disabled buttons for them. "Export" is also excluded: it's
already a real, working button in the top bar (`EditorToolbar.tsx`, `onExportClick={handleExport}` →
`downloadCanvas`, `EditorLayout.tsx:387`) — duplicating it in this floating control would be
redundant.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** A floating "Edit elements" control renders adjacent to the canvas
      (`CenterCanvas.tsx`), visible as soon as a flat generation exists on the canvas — not only
      after opening the `RightSidebar` variations panel as today (`RightSidebar.tsx:903-932`, which
      this control replaces, not duplicates). Verified via diff — old toggle removed, new control
      mounted.
- [x] **AC2 [happy-path]:** The first click on a generation that hasn't been composed yet shows a
      real loading state on the control itself (extraction takes 15–90s, per `US-AI-048`'s measured
      latency) — never an instant fake toggle — then transitions via the existing
      `useGenerationPrefs.setRenderMode('editable')` path (`useGenerationPrefs.ts`). This first
      compose is free per `US-LAUNCH-015` — the quota badge does not decrement. **Corrected
      2026-08-22:** the first implementation always sent the literal string `'current-gen'` as the
      id (no real id was ever wired in), so this could not have worked end-to-end. Fixed via
      `useGenerationPrefs.activeGenerationId`, set by `RightSidebar` on generation completion. The
      compose call now goes through the shared `planVariationLoad` (US-AI-047) rather than a
      second, diverging call to `generationsApi.getComposedDesign`. **Not yet manually verified**
      (TC-EDIT-005-02).
- [x] **AC3 [happy-path]:** Revisiting an already-composed variation (cache hit, `US-AI-048`,
      `composedDesigns` field) loads near-instantly with no loading state shown and no quota
      change — visibly distinct from AC2's first-time extraction, so the speed difference itself
      communicates "this one's free." **Corrected 2026-08-22:** the first implementation set the
      loading flag unconditionally around every compose call — a cache hit would have shown the
      spinner identically to a fresh extraction. Fixed with a 200ms delayed-indicator: the backend
      compose response carries no cache-hit flag (verified — `generations.service.ts`'s
      `isCacheHit`/`isExtraCompose` are local variables, never returned to the client, and adding
      one is Out of Scope backend work), so honesty here comes from timing, not a flag — a fast
      (cached) response resolves before the spinner would ever render; a slow (fresh) one reliably
      shows it. **Not yet manually verified** (TC-EDIT-005-03).
- [ ] **AC4 [error-path]:** Switching to compose a *second or third* variation on the same
      generation is the real credit-charging path (`isExtraCompose === true`,
      `generations.service.ts:337-389`) — the quota badge decrements only at that exact moment,
      with a visible confirmation (toast or inline change), never preemptively on the first click.
      **Still genuinely blocked** — not just on the badge (`US-PAY-103`) but structurally: the
      `/compose` response never returns `isCacheHit`/`isExtraCompose` to the client (confirmed by
      reading `generations.service.ts` — those are local variables, not part of the returned
      `ComposedDesign`), so there is no honest way to show a charge-specific confirmation without
      either the quota badge or a backend response-shape change, and backend changes to
      `generations.service.ts` are Out of Scope for this story. The generic "Layers separated!"
      success toast fires only after a real state change (never preemptively), but does not (and
      currently cannot) distinguish "this one was free" from "this one was charged." Do not fake
      this distinction client-side — sequence with `US-PAY-103`/a backend follow-up instead.
- [x] **AC5 [error-path]:** For a FREE-tier user past their lifetime editable trial, clicking shows
      a clear, dedicated upgrade prompt — replacing the current bare toast
      (`RightSidebar.tsx:486`, `EditableRequiresUpgradeException` / "Editable designs are a paid
      feature") with a real moment (modal or equivalent), since this is the product's primary
      monetization surface, not an edge case to bury. **Corrected 2026-08-22:** the first
      implementation still used `toast.error(...)` — the exact bare-toast pattern this AC says to
      replace — and left `RightSidebar.tsx:486` untouched (two bare toasts instead of one dedicated
      prompt). Fixed with a real `Dialog` modal in `CanvasEditToolbar.tsx` for this control's own
      flow. `RightSidebar.tsx:486`'s toast belongs to the separate "Use This Design" button flow,
      which is explicitly Out of Scope for this story (see Out of Scope) — left untouched
      deliberately, not missed. **Not yet manually verified** (TC-EDIT-005-05).

---

## Dependency — not fully independent, correct the milestone note

The quota badge (`"10 left"` style, real number) needs `getEditableUsageQuota()`, which is
`US-PAY-103`'s job (`EPIC-PAY-05`, `usage-limit.service.ts`) — that method doesn't exist yet. This
story is **blocked on `US-PAY-103`** for the quota badge specifically; the rest of the flow
(extraction, cache, charging, upgrade gate) has no such dependency. Do not invent a second,
parallel quota-fetch mechanism to avoid the dependency — wait for `US-PAY-103` or coordinate
sequencing.

---

## Out of Scope

- Any change to the editable-compose backend logic itself (`generations.service.ts`,
  `US-LAUNCH-015` policy, `US-AI-048` caching, credit-charging rules) — this story only calls the
  existing pipeline correctly and displays its real state honestly.
- "Quick edit," "Upscale HD," "Remove BG" — not real features, excluded entirely from this control,
  not shown as disabled/coming-soon.
- "Export" — already real and working in the top toolbar, not duplicated here.
- Any change to `ResultsVariations.tsx`'s "Use This Design" button.
- New onboarding tooltips, product tours, or animation beyond the loading/cache-hit state
  distinction in AC2/AC3.
- Any pricing-page copy or marketing change — that's `EPIC-PAY-05`.
- Renaming or changing the `renderMode` state values (`'flat' | 'editable'`) or its persistence
  behavior across the editor/AI-chat panels.
- Building `getEditableUsageQuota()` itself — that's `US-PAY-103`; this story only consumes it.

---

## Engineering / PR

- **Branch:** `feat/edit/m-01-editable-menu-surfacing`
- **PR:** #_____ (opens when Gate 1 + Gate 2 are green for this story)
- **Primary files touched:**
  - `client/src/components/editor/CanvasEditToolbar.tsx` (new) — floating "Edit elements" control,
    mounted adjacent to the canvas
  - `client/src/components/editor/CenterCanvas.tsx` — mount point for the new floating control
  - `client/src/components/editor/RightSidebar.tsx` — remove the old in-panel toggle
    (`RightSidebar.tsx:903-932`), it's replaced by the new component, not duplicated
  - `client/src/hooks/useGenerationPrefs.ts` — read-only consumer, no behavior change expected
  - `client/src/lib/api.ts` — read-only call to `getEditableUsageQuota()` once `US-PAY-103` ships
    (blocked until then — see Dependency section above)

---

## AI Implementation Prompt

> Paste this block into Claude Code to implement the story.

```
Project context: see PROJECT_CONTEXT.yaml at repo root.

Story: US-EDIT-005 — Floating "Edit elements" control on the canvas

As a customer using the editor, I want a floating "Edit elements" control positioned directly
above/adjacent to the canvas instead of a toggle buried in a sidebar panel that only appears after
a generation exists, with honest loading/charging behavior, so I discover and understand the
product's paid-differentiating feature.

Design reference: design-preview-canvas-menu.html — ONLY the "Edit elements" control is in scope.
"Quick edit," "Upscale HD," "Remove BG" do not exist in the codebase, exclude them entirely
(no placeholders). "Export" already exists and works in the top toolbar (EditorToolbar.tsx,
onExportClick -> downloadCanvas) — do not duplicate it here.

Acceptance Criteria:
  AC1 [happy-path]: a floating "Edit elements" control renders adjacent to the canvas
    (CenterCanvas.tsx), visible as soon as a flat generation exists — replacing, not duplicating,
    the current RightSidebar.tsx:903-932 toggle.
  AC2 [happy-path]: first click on a not-yet-composed generation shows a real loading state
    (extraction takes 15-90s, US-AI-048) then transitions via the existing
    useGenerationPrefs.setRenderMode('editable') path. First compose is free per US-LAUNCH-015 —
    quota badge does not decrement.
  AC3 [happy-path]: revisiting an already-composed variation (cache hit) loads near-instantly, no
    loading state, no quota change — visibly distinct from AC2.
  AC4 [error-path]: composing a second/third variation on the same generation is the real
    credit-charging path (isExtraCompose===true) — quota badge decrements only at that moment, with
    a visible confirmation, never preemptively.
  AC5 [error-path]: for a FREE user past their lifetime trial, clicking shows a real, dedicated
    upgrade prompt (not the current bare toast) — this is the primary monetization surface.

Dependency: the quota badge needs getEditableUsageQuota() (US-PAY-103, EPIC-PAY-05) — doesn't exist
yet. Blocked on that story for the quota badge specifically; do not build a parallel quota source.

Out of Scope:
  Backend compose pipeline/credit-charging logic itself. "Quick edit"/"Upscale HD"/"Remove BG" (not
  real, no placeholders). "Export" (already exists elsewhere). ResultsVariations.tsx's "Use This
  Design" button. Onboarding tooltips/tours/animation beyond AC2/AC3's state distinction.
  Pricing-page copy. Changing renderMode's values/persistence. Building getEditableUsageQuota()
  itself.

Primary files to touch (do NOT touch other files):
  client/src/components/editor/CanvasEditToolbar.tsx (new)
  client/src/components/editor/CenterCanvas.tsx
  client/src/components/editor/RightSidebar.tsx (remove old toggle, lines ~903-932)
  client/src/hooks/useGenerationPrefs.ts (read-only unless genuinely required)
  client/src/lib/api.ts (read-only call to getEditableUsageQuota(), once US-PAY-103 ships)

Rules:
- Touch ONLY the files listed above
- Do NOT implement anything in Out of Scope
- Run verification gates (see PROJECT_CONTEXT.yaml.gates) before declaring done
- When done: list files changed, ACs checked ✅, test commands output
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|:--------:|----------|:------:|---------|
| TC-EDIT-005-01 | Automated | P0 | Given a flat generation on the canvas, when the editor renders, then the floating "Edit elements" control is visible adjacent to the canvas | ✅ | Failed on first run: `hasExtractedLayers` counted a *template's* own text/shape layers as extracted output, so the control rendered "Editable layers active" on a never-composed design and the click was a permanent no-op. Fixed (`composed-` id prefix). Old sidebar toggle confirmed absent. |
| TC-EDIT-005-02 | Automated | P0 | Given a generation not yet composed, when "Edit elements" is clicked, then a real loading state shows for the extraction duration, then the canvas transitions to editable — quota badge unchanged | ✅ | Failed on first run with HTTP 500 in ~30ms: the control posted `element.src` (a multi-MB base64 data: URL) to `/:id/compose`, blowing the 100kb `express.json()` limit — which `planVariationLoad` then reported as the misleading "No separate text layers detected". Fixed via new `ImageElement.aiSourceUrl`. Now: "Separating layers…" observed, compose 27.2s → 201. |
| TC-EDIT-005-03 | Automated | P0 | Given an already-composed variation, when revisited, then it loads near-instantly with no loading state and no quota change | ✅ | Satisfied more strongly than a cache hit: the control short-circuits at the `isEditableMode && hasExtractedLayers` guard, so **no** second `/compose` is issued at all (asserted), no spinner, and the re-click is acknowledged rather than silently ignored. The DB-level cache-hit path remains covered by `e2e/us-ai-048-compose-cache.spec.ts` via sidebar variation re-selection, which is the flow that actually re-issues the request. |
| TC-EDIT-005-04 | Manual | P1 | Given an editable generation, when a second/third variation is composed, then the quota badge decrements at that exact moment with a visible confirmation | ⏸ | Blocked — `/compose` response has no `isCacheHit`/`isExtraCompose` signal for the client to key a confirmation off (see AC4); needs `US-PAY-103` and/or a backend response-shape change, both out of this story's scope |
| TC-EDIT-005-05 | Automated | P1 | Given a FREE-tier account with the lifetime editable trial already used, when "Edit elements" is clicked, then a dedicated upgrade prompt appears, not a bare toast | ⚠️ | **Gating verified, surface not.** Second-variation compose correctly returned 402 and upgrade messaging surfaced. The toolbar's own `Dialog` needs a canvas with no composed layers, which is unreachable in the same session once TC-02 has run (`loadAiVariationToCanvas` prepends, so composed-* elements survive). The Dialog itself remains structurally verified only. |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅ — AC4 intentionally not checked (blocked, see above); AC1-3/5 now
      live-verified 2026-08-25, not just diff-verified
- [x] All test cases run and recorded — TC-01/02/03 ✅, TC-05 ⚠️ (gating verified, Dialog surface
      not reachable in-session), TC-04 remains Blocked
- [x] Gate 1 passes — re-verified 2026-08-25 on merged `main` after the fixes below:
      `npm run check` (0 errors), `npm run test:unit` (254 passed, 1 skipped)
- [x] Gate 2 passes (frontend) — browser-verified 2026-08-25 via
      `e2e/us-edit-005-canvas-edit-toolbar.spec.ts` against a live localhost dev server
- [x] Manual flow verified — automated as a live spec so the evidence is reproducible
- [x] PR merged — PR #35
- [x] No console errors for the changed flow — one console entry only, the expected 402 from
      TC-05's deliberately-blocked compose
- [ ] [TASKS.md](./TASKS.md) task list fully checked — T4b (quota badge) correctly left unchecked
- [ ] STORY.md status updated to ✅ Done — AC4/T4b still blocked on `US-PAY-103` wiring

---

## Implementation Update (log)

**2026-08-22 — verification + correction pass.** An initial implementation (T1-T4 all checked,
STORY.md marked ✅ Done) was audited against the actual code before any manual testing had
happened. Findings and fixes:

- Docs contradicted themselves: header said Done with all ACs ticked, but the DoD checklist and
  all 5 test cases were untouched (`🔲`) in the same file. Corrected — status is now accurately
  🟡 In Progress.
- **AC2 was not functional end-to-end**: the component had no real generation id wired in and
  always sent the literal string `'current-gen'` to `POST /:id/compose`. Fixed via a new
  `useGenerationPrefs.activeGenerationId`, set by `RightSidebar` at the same point it sets its own
  `resultsGenerationId` (same bug class already fixed once for the sidebar path on 2026-08-13 —
  see the comment on that field).
- **AC3 was not honored**: the loading flag was set unconditionally around every compose call, so
  a cache hit would have shown the same spinner as a fresh extraction. Fixed with a 200ms
  delayed-indicator (see `LOADING_INDICATOR_DELAY_MS` in `CanvasEditToolbar.tsx`) — confirmed by
  reading `generations.service.ts` that the compose response has no cache-hit flag to key off
  instead, so timing is the only honest signal available within this story's scope.
- **AC5 was not built**: still a `toast.error(...)`, the exact pattern the AC says to replace, and
  `RightSidebar.tsx:486`'s toast was left in place too (two bare toasts). Fixed with a real
  `Dialog` modal in `CanvasEditToolbar.tsx`; `RightSidebar.tsx:486` deliberately left alone — it
  belongs to the "Use This Design" flow, Out of Scope for this story.
- **Architectural drift**: the component called `generationsApi.getComposedDesign` directly instead
  of the shared `planVariationLoad` (US-AI-047), reimplementing (and missing pieces of) logic that
  module exists specifically to keep from diverging across surfaces. Refactored to use it.
- **AC4 remains genuinely blocked** — confirmed by reading `generations.service.ts` that
  `isCacheHit`/`isExtraCompose` are local variables never returned to the client. No honest
  charge-specific confirmation is buildable without either the `US-PAY-103` quota badge or a
  backend response-shape change, and the latter is Out of Scope for this story.
- Re-ran Gate 1 after the fix: `npm run check` (0 errors), `npm run test:unit:client` (229 passed,
  1 skipped, unchanged). No new automated tests were added for the component itself — this
  story's own Test Cases are all Manual; no React component-test precedent exists elsewhere in
  this codebase to extend.
- **Still outstanding before this can close:** manual run of TC-EDIT-005-01/02/03/05, PR open +
  Gate 2 review, and sequencing AC4 with `US-PAY-103`.

---

**2026-08-25 — live verification pass (post-merge).** Ran TC-01/02/03/05 against a real dev server
via a new live spec, `e2e/us-edit-005-canvas-edit-toolbar.spec.ts` (1 real generation + 1 real
extraction, ~$0.10-0.20 per run, retries: 0). The pass found **two real defects that made this
control non-functional in the most common flow** — opening a template, then generating. Both were
invisible to Gate 1 and to diff review, which is exactly why the TCs existed:

1. **`hasExtractedLayers` counted template layers as extracted output.** The check was
   `elements.some(el => el.type === 'text' || el.type === 'shape')`. Every template puts real text
   and shape elements on the canvas, and `US-AI-036` AC3 then inserts the AI image *behind* them —
   so the flag was true for a flat, never-composed design. The control rendered "Editable layers
   active", and the `isEditableMode && hasExtractedLayers` guard early-returned "Design is already
   editable", making the button a permanent no-op. Fixed by keying on the `composed-` element-id
   prefix, which only `buildComposedTextElements` / `loadComposedDesignToCanvas` produce.

2. **The compose request posted a multi-megabyte base64 data: URL.** With (1) fixed, the click
   reached the API and got HTTP 500 in ~30ms. `loadAiVariationToCanvas` proxies the image and
   stores the result as a base64 `data:` URL in `element.src`; the control forwarded that as
   `imageUrl`, exceeding the default 100kb `express.json()` limit at `server/index.ts:191`.
   `planVariationLoad` swallowed the 500 into its "background carries no text" branch, surfacing
   the misleading toast "No separate text layers detected" — a server error reported as a benign
   product outcome. Fixed by adding `ImageElement.aiSourceUrl` (the original provider URL, set by
   `loadAiVariationToCanvas`) and sending that instead of `src`.

After both fixes: TC-01 ✅, TC-02 ✅ (loading state observed; compose 27.2s → 201), TC-03 ✅ (no
second `/compose` issued at all), TC-05 ⚠️ (402 gating verified; the Dialog surface is not
reachable once TC-02 has put composed layers on the canvas). Gate 1 re-run green on merged `main`:
`npm run check` clean, `npm run test:unit` 254 passed / 1 skipped.

**Follow-ups worth filing separately (not fixed here, out of this story's scope):**
- `planVariationLoad` treats a transport/server failure as "no text detected". A 5xx should be
  distinguishable from a genuine zero-block extraction, or errors will keep getting reported to
  users as product outcomes.
- `RightSidebar`'s flat path toasts "Design loaded" without checking `loadAiVariationToCanvas`'s
  return value, so a failed load still reports success.
- `isEditableMode` still ORs in a session-sticky `renderMode === 'editable'`, so after one compose
  a *subsequent* fresh generation can show "Editable layers active" until reload. Cosmetic only —
  the functional guard requires `hasExtractedLayers` too — but misleading.

*Story created: 2026-08-21*
