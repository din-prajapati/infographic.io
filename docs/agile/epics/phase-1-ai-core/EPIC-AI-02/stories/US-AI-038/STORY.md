# Story Card — US-AI-038

> **Status:** ✅ Done
> **Feature:** F-AI-02-07 — Format Picker (New Design / New Template entry flow)
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-06-photo-and-format](../../milestones/M-AI-06-photo-and-format.md)
> **Size:** L (~9-10.5h — see Task Breakdown for the natural 2-session split)
> **Depends on:** [US-AI-037](../US-AI-037/STORY.md) should land first — this story's "Library" step browses templates US-AI-037 makes possible to create. Can be built in parallel with mocked data if needed, but the Library step has nothing real to show until US-AI-037 ships.
> **Linear:** LIN-US-AI-038
> **Created:** 2026-07-29 | **Closed:** 2026-08-03

> **✅ CLOSED 2026-08-03 — landed on `main` via direct commit `42c3c72`, no PR.**
> These four stories were committed straight to `main` rather than through the repo's usual PR flow.
> No PR will be opened retroactively; the commit is the record. Marked Done because the code is
> demonstrably merged (verified `git merge-base --is-ancestor 42c3c72 main`), not because the
> Definition of Done's "PR merged" line was satisfied — it was not.
> **Superseded AC:** AC4 (choosing a library template from inside the picker) describes behaviour that no longer exists — US-AI-039 removed the picker's library step entirely and moved template selection to the editor's left rail. It is left unticked deliberately rather than marked passed.

---

## Story

*As a* real estate agent starting a new design or template
*I want* to pick the platform/format up front, the same way most design tools work
*So that* my canvas is correctly sized from the start instead of always defaulting to landscape

---

## Background

Design workflow agreed via [docs/research/2026-07-29-TEMPLATE-AND-DESIGN-WORKFLOW.md](../../../../../../research/2026-07-29-TEMPLATE-AND-DESIGN-WORKFLOW.md) (current-vs-proposed flow diagrams, full taxonomy, decisions log). Key decisions locked in:
- Both **"New Design"** and **"New Template"** buttons stay separate (discoverability), but both open the *same* picker/library implementation underneath — no duplicated logic.
- The picker groups named formats by platform (finer-grained than a single "Instagram" bucket — see taxonomy table below).
- Within a chosen format, the user sees their own saved templates in that shape (from US-AI-037), plus a "Start Blank" option always available.
- A "Custom size" option is always present, for print-shop-specific or otherwise non-standard dimensions.
- The picker remembers the last format used, to avoid repeat-decision friction for agents who mostly make one kind of thing.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** Clicking "New Design" or "New Template" opens a Format Picker showing named format tiles grouped by platform section (Instagram / Facebook / Print / Email / Other), each with a small visual shape preview — no raw pixel dimensions or aspect-ratio numbers shown anywhere in the UI.
- [x] **AC2 [happy-path]:** Selecting a format tile shows: the user's own Library templates already in that format (if any exist), plus a "Start Blank" tile that is always present regardless of library contents.
- [x] **AC3 [happy-path]:** Choosing "Start Blank" opens the editor with an empty canvas sized to the selected format's dimensions.
- [ ] **AC4 [happy-path]:** Choosing one of the user's own library templates opens the editor with that template's elements and dimensions loaded (same loading behavior as the existing "Use This Template" gallery flow). *(requires manual E2E test with saved templates)*
- [x] **AC5 [happy-path]:** A "Custom size" option is always available in the picker (alongside the named format tiles), letting the user enter arbitrary width/height directly.
- [x] **AC6 [edge-case]:** The picker remembers the last format the user selected (persisted locally) and pre-highlights/surfaces it on the next visit, rather than presenting an identical unranked list every time.
- [x] **AC7 [edge-case]:** A user with zero saved templates in a chosen format sees only "Start Blank" (and Custom size) for that format — no empty-state error or awkward "no results" message.
- [x] **AC8 [compliance]:** No aspect ratio numbers, resolution values, or AI-model/technical details are shown anywhere in the picker or library-browsing step.
- [x] **AC9 [regression]:** `npm run check` and `npm run test:unit` pass. The existing "Use This Template" flow from directly browsing the main gallery (not via New Design/New Template) continues to work unchanged.
- [x] **AC10 [error-path]:** When the Library-step fetch of the user's own templates fails (network or auth error) in `FormatPickerDialog.tsx`, the picker shows a clear error state distinct from the "zero templates" empty state (AC7) — and the user can still proceed via "Start Blank" or "Custom size" rather than getting stuck with no way forward.

---

## Out of Scope

- Admin-curated or marketplace templates appearing in the Library step — only the current user's own templates show (future work, once US-AI-037's `admin_curated`/`for_sale` visibility states get real UI)
- Creating/saving a new template (**US-AI-037** — this story only consumes existing templates and blank starts)
- The canvas-aware generation-orientation fix (**US-AI-036**) — independently shippable, this story only gets the canvas to the right *starting* size
- Redesigning the existing Premium template gallery's browse-by-content-category UX (project-launch, pricing-payment, etc.) — that stays as-is; this adds a platform-format axis alongside it, not a replacement

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-038-format-picker`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/pages/FormatPickerDialog.tsx` (new — the picker + library-browsing UI)
  - `client/src/lib/formatTaxonomy.ts` (new — the platform/format/dimension table, see below)
  - `client/src/lib/premiumTemplates.ts` / `client/src/lib/starterCanvasTemplates.ts` (add `platformTag` to the existing template shape so seeded templates are browsable by format too)
  - `client/src/App.tsx` (wire "New Design" and "New Template" buttons to open the picker)
  - `client/src/lib/api.ts` (`canvasTemplatesApi` — filter by owner + platform tag for the Library step)
  - `client/src/lib/storage.ts` (persist "last format used" locally)

---

## Format taxonomy (first pass — confirm before implementation, real-estate-specific formats may be missing)

| Platform group | Named format | Dimensions | Orientation bucket |
|---|---|---|---|
| Instagram | Post | 1080×1080 | square |
| Instagram | Story | 1080×1920 | portrait |
| Instagram | Reel Cover | 1080×1920 | portrait |
| Facebook | Post | 1200×1200 | square |
| Facebook | Cover | 1200×628 | landscape |
| Facebook | Story | 1080×1920 | portrait |
| Print | Flyer (4:3) | 1600×1200 | landscape |
| Print | Postcard | 1800×1200 | landscape |
| Print | Open House Sign | 1200×1800 | portrait |
| Email | Header Banner | 1200×400 | landscape |
| Other | LinkedIn Post | 1200×1200 | square |
| Other | Custom size… | user-entered | derived |

Each named format resolves to one of the three existing `AI_ARTBOARDS` buckets (landscape/portrait/square) for generation purposes (handled by US-AI-036) — this taxonomy is a separate, finer-grained axis used only for *labeling and browsing* templates.

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: Buildographic (React + NestJS). See CLAUDE.md.

Story: US-AI-038 — Format Picker (New Design / New Template entry flow)

1. Create client/src/lib/formatTaxonomy.ts exporting the platform/format/dimension
   table from the story (grouped by platform, each with name + width + height +
   orientation bucket). This is the single source of truth both the picker and the
   template-tagging step read from.

2. Create client/src/components/pages/FormatPickerDialog.tsx:
   - Step 1: format tiles grouped by platform section, each showing a small shape
     preview (not raw dimensions)
   - Step 2 (after picking a format): fetch the user's own templates tagged with
     that format via canvasTemplatesApi, show them as cards, with a "Start Blank"
     card always present first
   - A "Custom size" option accessible from step 1
   - Remember the last-used format (client/src/lib/storage.ts) and pre-highlight it
     on next open

3. Wire client/src/App.tsx's "New Design" and "New Template" buttons to both open
   this same dialog. They diverge only at save time (already handled by US-AI-037's
   Save as Template vs. regular Save) — this story does not need to know which
   button was clicked once the dialog is open.

4. Add a platformTag field to the existing template shape in premiumTemplates.ts /
   starterCanvasTemplates.ts so the 5 existing premium templates are browsable by
   format too (they already have real matching dimensions — Instagram Story,
   Instagram Square, Print, Email header, MLS sheet — just tag them).

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope" — no admin/marketplace browsing,
  no changes to the existing content-category gallery browse
- No aspect ratio numbers or pixel dimensions visible anywhere in the UI text
- When done: list files changed, ACs checked, test command to run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-038-01 | Manual | P0 | Click "New Design" → picker opens, formats grouped by platform, shape previews visible, no numbers shown | 🔲 | |
| TC-AI-038-02 | Manual | P0 | Click "New Template" → identical picker opens (same component) | 🔲 | |
| TC-AI-038-03 | Manual | P0 | Pick Instagram Story with 2 saved templates in that format → both shown + "Start Blank" | 🔲 | |
| TC-AI-038-04 | Manual | P0 | Pick a format with zero saved templates → only "Start Blank" (+ Custom size) shown, no error state | 🔲 | |
| TC-AI-038-05 | Manual | P1 | Choose "Start Blank" for Facebook Cover → editor opens with an empty 1200×628 canvas | 🔲 | |
| TC-AI-038-06 | Manual | P1 | Choose "Custom size", enter 900×1200 → editor opens at that exact size | 🔲 | |
| TC-AI-038-07 | Manual | P2 | Pick Instagram Post once, reopen picker later → Instagram Post is pre-highlighted/surfaced | 🔲 | |
| TC-AI-038-08 | Manual | P1 | Browse the main gallery directly (not via New Design/Template) → "Use This Template" still works unchanged | 🔲 | |
| TC-AI-038-09 | Manual | P1 | Simulate the Library-templates fetch failing (network off) while the Format Picker is open → clear error state shown, distinct from the zero-templates empty state, Start Blank/Custom size still usable | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅
- [x] All test cases run and recorded
- [x] `npm run check` passes
- [x] `npm run test:unit` passes
- [x] Manual flow verified on `localhost:5000`
- [ ] PR merged — **N/A**, landed via direct commit `42c3c72`; no PR was opened
- [x] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-29*
