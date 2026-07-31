# Story Card — US-AI-039

> **Status:** 🔲 Not Started
> **Feature:** F-AI-02-07 — Format Picker (New Design / New Template entry flow)
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-06-photo-and-format](../../milestones/M-AI-06-photo-and-format.md)
> **Size:** M (~3.5h)
> **Depends on:** [US-AI-038](../US-AI-038/STORY.md) must be merged first — this story rewrites the component US-AI-038 created. Does not touch or re-open any US-AI-038 decision; purely reorganizes the presentation layer.
> **Linear:** LIN-US-AI-039
> **Created:** 2026-07-31 | **Closed:** —

---

## Story

*As a* real estate agent starting a new design or template
*I want* the format picker to feel like one continuous screen instead of two popups
*So that* picking a format and a starting point takes one flow, not a click-through-and-back sequence

---

## Background

Prompted by a live UI/UX audit of Canva's own "Create a design" modal (hover-triggered from the `+ Create` button): a persistent left category rail (Printables / Presentations / Social media / … / Custom size as its own destination) with format tiles and their contextual preview content appearing inline in the same view the moment a category is picked — no "Continue" button, no second screen.

Buildographic's `FormatPickerDialog.tsx` (built in [US-AI-038](../US-AI-038/STORY.md)) currently implements the *same information* — platform-grouped formats, then a library step — as three **sequential** `Dialog` screens (`step: "format" | "library" | "custom"`), joined by a "Continue" button and a back-chevron. Functionally this is correct and all US-AI-038 acceptance criteria are already met; what's being changed here is purely the container/interaction shape, not the underlying decisions in [docs/research/2026-07-29-TEMPLATE-AND-DESIGN-WORKFLOW.md](../../../../../../research/2026-07-29-TEMPLATE-AND-DESIGN-WORKFLOW.md) — that doc's decisions log (§4) stays intact:

- Both "New Design" and "New Template" still stay separate, visible entry buttons opening the same dialog.
- Format tiles still show a shape preview, never a pixel count.
- "Start Blank" is still always present; the user's own library still shows first.
- "Custom size" is still a permanent option.
- Last-used format is still remembered.

What changes is *only* how those pieces are arranged on screen: one persistent modal with a left rail (platform groups + a dedicated "Custom size" rail item) instead of a 3-step wizard.

**Test-coverage note (found during audit, not previously flagged):** neither this component nor any of the 15 existing Playwright specs in `e2e/` currently exercise this flow at all — `qa-canvas-editor.spec.ts` and the others reach the editor via direct `page.goto("/editor")`, bypassing the picker entirely. US-AI-038's own `TASKS.md` lists only manual test steps. Per this project's "Test Is Truth" rule, that gap is closed explicitly in this story (AC9) rather than carried forward silently a second time.

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** Opening the Format Picker (via "New Design" or "New Template") renders a single persistent modal with a left category rail listing every `FORMAT_TAXONOMY` platform group (Instagram / Facebook / Print / Email / Other) plus a "Custom size" rail item — no "Continue" button and no full-screen transition between format selection and library browsing.
- [ ] **AC2 [happy-path]:** Selecting a platform group in the rail shows that platform's named format tiles (shape-preview only, no pixel numbers — unchanged from US-AI-038 AC1) inline in the main content area, swapping in place without closing or reopening the modal.
- [ ] **AC3 [happy-path]:** Selecting a specific format tile reveals, in the same view (no click-through, no back-chevron), the "Start Blank" tile plus the user's own saved templates tagged to that format — same content and fetch behavior as the current Library step, just no longer a separate screen.
- [ ] **AC4 [happy-path]:** Selecting "Custom size" in the rail swaps the main content area to the existing width/height validation form (100–10,000px); submitting a valid size opens the editor at that exact size, unchanged from current behavior.
- [ ] **AC5 [edge-case]:** The last-used format is restored on reopen by pre-selecting *both* its platform group in the rail *and* its specific tile in the tile strip, with the corresponding Start-Blank/library grid already visible — not just the platform highlighted with an extra click still required (strengthens US-AI-038 AC6).
- [ ] **AC6 [edge-case]:** A format with zero saved templates shows only "Start Blank" inline (plus the rail and tile strip) with no error styling — the successful-empty-fetch case stays visually distinct from a failed fetch (AC11).
- [ ] **AC7 [compliance]:** No pixel dimensions, aspect ratios, or AI-model/technical details appear anywhere in the reorganized modal — same rule as US-AI-038 AC8.
- [ ] **AC8 [regression]:** Both "New Design" and "New Template" entry points continue to open the same dialog; `npm run check` and `npm run test:unit` pass; the separate `/templates` content-category gallery browse (search + category/style dropdowns) is untouched.
- [ ] **AC9 [test-coverage]:** A new Playwright spec exercises: opening the picker from "New Design" → switching rail categories → selecting a tile (inline library appears, no navigation) → Custom size submission opens the editor at the entered dimensions. This is the first automated coverage of this component; none of the existing 15 `e2e/` specs need to change, since none reference it today (confirmed by grep — they reach `/editor` via direct navigation).
- [ ] **AC10 [a11y]:** Keyboard focus order and `aria-pressed` state on rail items and format tiles are preserved from the current implementation — every rail item and tile remains reachable and operable via keyboard with the same focus-visible ring behavior.
- [ ] **AC11 [error-path]:** When the inline library fetch (`canvasTemplatesApi.getByFormatTag` inside `FormatPickerDialog.tsx`) rejects, the modal shows the existing distinct error `Alert` in place of the template grid — visually separate from the zero-templates empty state (AC6) — and the user can still proceed via "Start Blank" or "Custom size" without getting stuck. Unchanged behavior from US-AI-038 AC10, just re-verified in the new inline layout.

---

## Out of Scope

- Redesigning the separate `/templates` content-category gallery (its search bar + category/style `<Select>` filters) — different screen, tracked separately; not touched here
- Admin-curated or marketplace templates appearing in the inline library grid — own templates only, unchanged from US-AI-038
- Any change to `FORMAT_TAXONOMY`'s data shape, dimensions, or orientation buckets — read as-is, no data model changes
- New backend endpoints or changes to `canvasTemplatesApi.getByFormatTag` — this is a frontend layout/interaction refactor only
- A secondary pill-row sub-filter (Canva's "Popular / WhatsApp / Instagram / Facebook" pattern within one category) — Buildographic's taxonomy has no second axis that needs it; do not add one speculatively

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-039-format-picker-reorg`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/pages/FormatPickerDialog.tsx` (rewrite — replace the `step` state machine with a persistent `activeCategory` rail + inline content area; `FormatTile`, `ShapePreview`, `SkeletonCard`, and all library/error/empty-state rendering are relocated, not rebuilt)
  - `client/src/lib/formatTaxonomy.ts` (read-only — no changes; confirms `getFormatById` is sufficient to derive a format's parent platform group for rail pre-selection on reopen)
  - `e2e/us-ai-039-format-picker-reorg.spec.ts` (new — closes AC9)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: Buildographic (React + NestJS). See CLAUDE.md.

Story: US-AI-039 — Format Picker: Canva-style single-modal reorg

FormatPickerDialog.tsx currently uses a `step: "format" | "library" | "custom"`
state machine rendered as three sequential full-Dialog screens joined by a
"Continue" button and a back-chevron. Replace this with a persistent two-pane
layout in the same Dialog, modeled on Canva's own "Create a design" modal:

1. Left rail: one entry per FORMAT_TAXONOMY platform group (Instagram, Facebook,
   Print, Email, Other) plus a "Custom size" entry — always visible, no Continue
   button gates it.

2. Main content area reacts live to the rail selection:
   - Picking a platform group shows that group's format tiles (reuse FormatTile /
     ShapePreview exactly as they render today — no shape-preview or copy changes).
   - Picking a specific tile reveals, inline in the same view, the existing
     Library content: "Start Blank" first, then the user's own templates fetched
     via canvasTemplatesApi.getByFormatTag(selectedFormatId) — reuse the existing
     loading skeleton, error Alert, and zero-templates empty-state exactly as they
     render today, just relocated out of the separate "library" step.
   - Picking "Custom size" swaps the content area to the existing width/height
     form (100-10000px validation) — reuse as-is.

3. Replace the `step` state with `activeCategory` (platform id | 'custom') and
   keep `selectedFormatId` for which tile is active within that category. On
   dialog open, use client/src/lib/storage.ts's getLastFormat() + formatTaxonomy's
   getFormatById() to derive BOTH the parent platform group (for the rail) and the
   tile (for the strip) so reopening pre-selects both levels, not just one.

4. Keep both "New Design" and "New Template" wired to this same dialog (App.tsx —
   no changes needed there, they already both open FormatPickerDialog).

5. Add e2e/us-ai-039-format-picker-reorg.spec.ts (Playwright) covering: open via
   New Design -> switch rail categories -> pick a tile -> inline library appears
   without navigation -> Custom size submission opens editor at entered dimensions.
   Reuse the auth/localStorage fixture pattern already in e2e/qa-canvas-editor.spec.ts.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope" — no changes to the /templates
  gallery, no new pill-row sub-filter, no FORMAT_TAXONOMY data changes
- No aspect ratio numbers or pixel dimensions visible anywhere in the UI text
- Preserve every existing state: loading skeletons, fetch-error alert,
  zero-templates empty state, keyboard focus/aria-pressed behavior
- When done: list files changed, ACs checked, test commands run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-039-01 | Automated (Playwright) | P0 | Open picker via "New Design" → rail shows all platform groups + Custom size, no Continue button present | 🔲 | |
| TC-AI-039-02 | Automated (Playwright) | P0 | Click "Instagram" in rail → format tiles for Instagram appear inline in the same modal | 🔲 | |
| TC-AI-039-03 | Automated (Playwright) | P0 | Click an Instagram format tile → "Start Blank" + library grid appear inline, no page/step transition | 🔲 | |
| TC-AI-039-04 | Automated (Playwright) | P0 | Click "Custom size" in rail → width/height form appears; submit 900×1200 → editor opens at that exact size | 🔲 | |
| TC-AI-039-05 | Manual | P1 | Pick Instagram Post, close picker, reopen it → Instagram rail item AND Instagram Post tile both pre-selected, library already visible | 🔲 | |
| TC-AI-039-06 | Manual | P1 | Pick a format with zero saved templates → only "Start Blank" shown, no error styling | 🔲 | |
| TC-AI-039-07 | Manual | P1 | Simulate the library fetch failing → distinct error alert shown, "Start Blank"/"Custom size" still usable | 🔲 | |
| TC-AI-039-08 | Manual | P2 | Tab through rail items and tiles with keyboard only → focus-visible ring on every stop, `aria-pressed` reflects selection | 🔲 | |
| TC-AI-039-09 | Manual | P1 | Browse `/templates` gallery directly (not via New Design/Template) → unaffected, unchanged | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] `npm run test:e2e` passes (new spec included)
- [ ] Manual flow verified on `localhost:5000`
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-31*
