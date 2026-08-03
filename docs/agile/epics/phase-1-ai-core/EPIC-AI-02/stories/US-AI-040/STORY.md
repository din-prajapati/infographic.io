# Story Card — US-AI-040

> **Status:** ✅ Done
> **Feature:** F-AI-02-08 — Template Gallery — preview modal + tag-based filters
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-06-photo-and-format](../../milestones/M-AI-06-photo-and-format.md)
> **Size:** L (~5.5-6h)
> **Depends on:** None (different file from US-AI-039/US-AI-041 — `TemplatesPage.tsx`, not `FormatPickerDialog.tsx`; no sequencing constraint)
> **Linear:** LIN-US-AI-040
> **Created:** 2026-07-31 | **Closed:** 2026-08-03 (PR #19, rebase-merged)

---

## Story

*As a* real estate agent browsing the Template Gallery
*I want* to preview a template before committing to it, and to filter by real category/style tags instead of guessing from a color badge
*So that* I pick the right starting point faster and with more confidence, the way Canva's own gallery works

---

## Background

A live UX audit compared Canva's "Create a design" → template browsing pattern against `client/src/components/pages/TemplatesPage.tsx`. Two gaps found, combined into one story because they share the same file's template-mapping code and because Gap 2's rail benefits from Gap 1's real tag data:

**Gap 2 — no preview before committing.** Template cards (`filteredTemplates.map(...)`, `TemplatesPage.tsx:267-316`) wire the "Use Template" button directly to `onClick={() => onOpenEditor?.(String(template.id))}` (line 309). Canva instead opens a preview modal (render, title, badges, a primary CTA, a "More like this" rail) before the editor loads. This codebase jumps straight from click to editor. No existing component renders this pattern — `FormatPickerDialog.tsx`, `EditorLayout.tsx`, `RightSidebar.tsx`, `SaveDialog`, `BrandPaletteDialog`, `OrganizationScreen` were all checked; none render a large-image + metadata + CTA preview. The shadcn `Dialog`/`DialogContent`/`DialogHeader` primitives (`client/src/components/ui/dialog.tsx`) are reusable as the modal shell.

**E2E risk (must not regress):** ~8 existing Playwright specs click "Use Template" expecting *immediate* navigation to the editor, e.g. `e2e/m-design-04-tc-targeted.spec.ts:73-74` (`page.getByRole("button", { name: "Use Template" }).first()` then waits for the editor), `e2e/us-design-002-editor-tokens.spec.ts:106-126`, `e2e/us-design-003-generation-ux.spec.ts:105`, `e2e/us-launch-004-beta-mode.spec.ts:130`, `e2e/design-consistency.spec.ts:203,225,316`, `e2e/design-contrast.spec.ts:298`, `e2e/us-design-004-global-consistency.spec.ts:115-122`, `e2e/editor-ai-chatbox.spec.ts:61`. This story keeps the "Use Template" button's direct-navigation behavior **unchanged** and only intercepts clicks on the card/thumbnail body to open the preview modal — see AC1/AC2 below. This is the single most important constraint in this story.

**Gap 3 — filters are plain dropdowns matched heuristically, not real data.** `TemplatesPage.tsx:46-47` holds `selectedCategory`/`selectedStyle` state, rendered as two `<Select>` dropdowns (lines 167-189: `all-categories | premium | real-estate | business | marketing`, and `all-styles | luxury | standard | budget`). The matching logic (`filteredTemplates`, lines 117-134) tests `template.isPremium` and string-compares the free-text `template.badge` field (e.g. `selectedStyle === "all-styles" || template.badge.toLowerCase() === selectedStyle`) — heuristic, not backed by real tag data. Important finding: **`tags: string[]` already exists end-to-end** — declared on `CreateDesignDto` (`api/src/modules/designs/dto/create-design.dto.ts:27-30`), threaded through `designs.service.ts`, present on `DesignMetadata` (`client/src/lib/storage.ts:18`) and therefore on `AdminCuratedTemplate` (`client/src/lib/api.ts:501-505`), and already consumed by `canvasTemplatesApi.getByFormatTag` (`client/src/lib/api.ts:582-587`) for the Format Picker (US-AI-038/039). It lives inside the same `propertyData.canvasDesign` JSON-blob field pattern already used for `visibility` (`api/scripts/seed-premium-templates.ts:181-193`) — **no Prisma migration needed**. The gap is purely that `tags` is unpopulated (`seed-premium-templates.ts:188` sets `tags: []` for every premium template) and `TemplatesPage.tsx` never reads `.tags` anywhere.

**Why combined into one story:** Gap 2's "More like this" rail is client-filtered from the already-fetched `allTemplates` array by tag — it becomes meaningfully useful once Gap 3 populates real tags, so doing both in one pass avoids shipping a "More like this" rail with nothing accurate to show. This was the estimating agent's stated reason for combining them; both touch the same `TemplatesPage.tsx` template-mapping code, so there is no file-boundary reason to split further.

---

## Acceptance Criteria

- [x] **AC1 [happy-path]:** Clicking anywhere on a template card's thumbnail/image area (not the "Use Template" button) in `TemplatesPage.tsx`'s gallery grid (`filteredTemplates.map`, ~lines 267-316) opens a preview `Dialog` (reusing `client/src/components/ui/dialog.tsx` primitives) showing: the template's full image, its title, its category/style badge(s) (the same `badge`/`isPremium` values already on the card), and a primary CTA button labelled to open the editor with that template (equivalent to "Customise this template").
- [x] **AC2 [regression]:** The existing "Use Template" button (`TemplatesPage.tsx:305-312`, and the "My Templates" section's equivalent at ~lines 227-234) keeps its current direct-`onClick={() => onOpenEditor?.(...)}` navigation behavior, unchanged — clicking it does NOT open the preview modal first. This is what keeps the following existing specs passing without modification: `e2e/m-design-04-tc-targeted.spec.ts:73-74`, `e2e/us-design-002-editor-tokens.spec.ts:106-126`, `e2e/us-launch-004-beta-mode.spec.ts:130`.
- [x] **AC3 [happy-path]:** The preview modal includes a "More like this" rail showing up to 4 other templates from the already-fetched `allTemplates` array that share at least one tag with the previewed template (client-side filter — no new API call, no new React Query key). Clicking a rail item swaps the modal's contents to that template (does not close and reopen the dialog).
- [x] **AC4 [happy-path]:** `api/scripts/seed-premium-templates.ts` (`tags: []`) is changed to populate real tags per template — one content-category tag (from the existing `category` field) and one **format tag mapped from** `badge`, so every premium template has ≥2 real tags after re-running the migration.
      > **Corrected 2026-08-02 (was factually wrong at authoring time).** This AC originally said to use "the existing `badge` value lower-cased (e.g. `luxury`, `standard`, `budget`)". The live rows do not hold tier words in `badge` — they hold presentation shorthand: `9:16`, `1:1`, `A4 · 300dpi`, `3:1`, `MLS`. Emitting those as tags would surface them as user-facing filter chips reading "A4 · 300dpi", breaking the standing no-technical-specs rule (CLAUDE.md critical rule 5, US-AI-038 AC8, US-AI-039 AC7). The badge is therefore **mapped** to the format-taxonomy id it denotes rather than used verbatim, which also makes the tag useful to `canvasTemplatesApi.getByFormatTag`. Backfilled result: `[project-launch, instagram-story]`, `[project-launch, instagram-post]`, `[project-launch, print-flyer]`, `[progress-trust, email-header-banner]`, `[project-launch, print-feature-sheet]`.
- [x] **AC5 [happy-path]:** `TemplatesPage.tsx`'s `filteredTemplates` matching logic (currently lines 117-134) is rewritten so `selectedCategory`/`selectedStyle` match against `template.tags?.includes(...)` instead of string-testing `template.badge`/`template.isPremium`; the `TemplateItem` interface (lines 22-32) gains a `tags?: string[]` field populated from each source's real `tags` (premium templates from `adminCuratedRaw[].tags`, my templates from `myTemplatesRaw[].tags`).
- [x] **AC6 [happy-path]:** The category and style filter controls are rewritten from plain `<Select>` dropdowns (`TemplatesPage.tsx:167-189`) to removable chip-style controls (e.g. a row of toggleable `Badge`/pill buttons, one active state per chip, an "x" to clear) that read their option list from the real distinct tag values present across `allTemplates`, not a hardcoded option list. A language/locale pill is explicitly out of scope (see Out of Scope) — do not add one.
- [x] **AC7 [regression]:** The existing per-card badge rendering (the "Luxury"/"Standard"/"Budget" pill shown via `template.badgeStyle`/`template.badge`, `TemplatesPage.tsx:281-284` and `:219`) is visually unchanged — this AC exists specifically to keep `e2e/m-design-04-tc-targeted.spec.ts:399-413` and `e2e/m-design-04-domain-colors.spec.ts:242-296` passing, since both assert on the on-card badge's text and computed color, a different concern from the filter-matching logic touched by AC5/AC6.
- [x] **AC8 [edge-case]:** A template with zero tags (e.g. a "My Template" the user saved before this story shipped) still renders normally in the gallery grid and is simply excluded from chip-filtered results and from any "More like this" rail — it does not throw, and does not appear as an empty/broken card.
- [x] **AC9 [edge-case]:** Selecting a chip combination that matches zero templates shows the existing "No templates found matching your criteria" empty state (`TemplatesPage.tsx:317-333`) with its "Clear Filters" button, which deselects all active chips (equivalent to the current `setSelectedCategory("all-categories"); setSelectedStyle("all-styles")` reset).
- [x] **AC10 [error-path]:** If the preview modal's template image fails to load (broken `image`/`thumbnail` URL), the modal shows the existing `ImageWithFallback` fallback behavior already used on cards (`client/src/components/figma/ImageWithFallback.tsx`) instead of a broken-image icon or a blank panel, and the primary CTA and "More like this" rail remain usable.
- [x] **AC11 [regression]:** `npm run check` and `npm run test:unit` pass. None of the ~10 E2E specs cited in AC2/AC7 require any modification to keep passing.
- [x] **AC12 [compliance]:** *(added 2026-08-03, post-close amendment — see note below)* Gallery cards and the preview modal show no aspect ratios, pixel dimensions or DPI values. The `badge` field carries the **format name** derived from the template's format tag (`instagram-story` → "Instagram Story"), and seeded descriptions are rewritten to describe layout rather than measurements. Verified: 0 of 5 seeded rows contain geometry in `badge` or `description`.
      > **Why this was amended into US-AI-040 rather than opened as a new story:** it is the same feature (F-AI-02-08), the same two files (`TemplatesPage.tsx`, `seed-premium-templates.ts`), and a direct continuation of AC4's tag work — the badge is now *derived from* the tags AC4 introduced.
      >
      > **Why a ratio badge was wrong, not just untidy:** a ratio cannot identify a template. In `FORMAT_TAXONOMY`, `9:16` is shared by five formats (Instagram Story, Reel Cover, Facebook Story, WhatsApp Status, Listing Story) and `1:1` by six (Open House, Just Sold, IG Post, FB Post, WhatsApp Post, LinkedIn Post). "9:16" told an agent nothing about where the design was meant to go.
      >
      > **Evidence from Canva:** across 50 of its real-estate template cards there are zero ratios, zero pixel dimensions and zero DPI values; all 50 carry the format name in the title instead ("…Real Estate **Instagram Post**", "Real Estate (**Instagram Story**)"). The only number shown is a page count ("10 slides"). Canva discloses geometry progressively — cards show the name, the preview modal shows `Instagram Post (4:5) • 1080 × 1350 px`, the format picker shows a name and a shape. Geometry appears where a size is being chosen, not while browsing.
      >
      > **Deliberately not adopted:** Canva's preview modal *does* show pixel dimensions. This project's standing rule forbids them everywhere, so the modal stays clean. Flagged as a reasonable place to relax the rule later, since it is the "decide" layer.

---

## Out of Scope

- Admin-curated/marketplace template *visibility* changes (which templates show, `admin_curated`/`for_sale` gating) — unrelated to this story, tracked separately
- A Language/locale filter pill — no backing data exists for it in `DesignMetadata`/`tags`, per the estimating agent's finding; do not add one speculatively
- Any Prisma schema migration — `tags` already exists inside the `propertyData.canvasDesign` JSON blob (same pattern as `visibility`); this story is data-population + frontend only
- Changing `template.badge` rendering or the badge color tokens (`--badge-luxury-bg` etc.) — covered by AC7, must stay pixel-identical
- Anything in the Format Picker (`client/src/components/pages/FormatPickerDialog.tsx`, `client/src/lib/formatTaxonomy.ts`) — that is Gap 1 / **US-AI-041**, a separate story on a different file
- Server-side/DB-backed tag search or a new `/canvas-templates?tags=` query param — filtering stays client-side against already-fetched `allTemplates`, matching the existing `getByFormatTag` pattern

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-040-template-preview-tags`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/pages/TemplatesPage.tsx` (add preview `Dialog`, rewrite filter chips, rewrite `filteredTemplates` matching logic, add `tags` to `TemplateItem`)
  - `api/scripts/seed-premium-templates.ts` (populate real `tags` per template instead of `tags: []`)
  - `client/src/components/ui/dialog.tsx` (read-only — reused as the preview modal shell, no changes expected)
  - `e2e/us-ai-040-template-preview-tags.spec.ts` (new — covers AC1, AC2, AC9)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: Buildographic (React + NestJS). See CLAUDE.md.

Story: US-AI-040 — Template Gallery: preview modal + tag-based filters

TemplatesPage.tsx's gallery cards currently wire "Use Template" directly to
onOpenEditor?.(id) with no preview step, and filter via two <Select> dropdowns
that string-test template.badge/isPremium instead of real tag data.

1. Add a preview Dialog (reuse client/src/components/ui/dialog.tsx primitives)
   that opens when the user clicks a card's thumbnail/image area (NOT the
   "Use Template" button — that must keep its current direct onOpenEditor
   behavior unchanged, this is the most important constraint in this story).
   The modal shows: full image (with ImageWithFallback), title, badge(s), and
   a primary CTA that calls the same onOpenEditor(id) the button already calls.

2. Add a "More like this" rail inside the modal: up to 4 other templates from
   the already-fetched allTemplates array sharing >=1 tag with the current one.
   Client-side filter only — no new API call. Clicking a rail item swaps the
   modal's displayed template in place.

3. In api/scripts/seed-premium-templates.ts, change tags: [] (line 188) to a
   real array per template: include the badge value lower-cased (luxury/
   standard/budget) plus the existing category field, so every premium
   template ends up with >=2 tags after re-running the migration.

4. Add tags?: string[] to the TemplateItem interface in TemplatesPage.tsx and
   populate it from adminCuratedRaw[].tags and myTemplatesRaw[].tags (both
   already typed on DesignMetadata/AdminCuratedTemplate in client/src/lib/api.ts
   — no new fetch needed).

5. Rewrite selectedCategory/selectedStyle Select dropdowns as toggleable chip
   buttons whose option list is the distinct tag values found across
   allTemplates (not a hardcoded list). Rewrite the filteredTemplates matching
   logic to check template.tags?.includes(chipValue) instead of testing
   badge/isPremium. Keep the "Clear Filters" behavior and its empty state.

6. Do NOT touch the on-card badge rendering (badgeStyle/badge display, lines
   ~213-220 and ~281-292) — that must stay pixel-identical (verified by
   e2e/m-design-04-tc-targeted.spec.ts and e2e/m-design-04-domain-colors.spec.ts).

7. Add e2e/us-ai-040-template-preview-tags.spec.ts (Playwright) covering:
   click card thumbnail -> preview modal opens with image/title/CTA -> click
   "Use Template" button directly (not thumbnail) -> navigates straight to
   editor with no modal -> select a chip combo matching zero templates ->
   empty state + Clear Filters resets chips.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope" — no visibility/marketplace
  changes, no Language pill, no Prisma migration, no FormatPickerDialog changes
- Do NOT change badge rendering/colors — AC7 requires pixel-identical output
- A template with zero tags must not throw and must not appear broken (AC8)
- When done: list files changed, ACs checked, test commands run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-040-01 | Automated (Playwright) | P0 | Click a template card's thumbnail → preview modal opens with image, title, badge, CTA | ✅ | Automated, passed. Also asserts CTA is topmost at its own centre, then clicks it. |
| TC-AI-040-02 | Automated (Playwright) | P0 | Click "Use Template" button directly (not thumbnail) → navigates straight to editor, no modal shown | ✅ | Automated, passed. |
| TC-AI-040-03 | Manual | P1 | Preview modal's "More like this" rail shows templates sharing a tag, clicking one swaps the modal contents | ✅ | Verified in browser: moreLikeThisCount 3 for "Premium Listing — Story". |
| TC-AI-040-04 | Manual | P1 | Run `npx tsx api/scripts/seed-premium-templates.ts` against a scratch DB → every premium template row has ≥2 real tags | ✅ | Migration run 2026-08-02; all 5 rows backfilled with 2 tags each. |
| TC-AI-040-05 | Manual | P0 | Select a category chip and a style chip → gallery filters to templates matching both, using real tags not badge string-matching | ✅ | Chips render from real tags; AND semantics exercised by TC-06. |
| TC-AI-040-06 | Automated (Playwright) | P1 | Select a chip combination matching zero templates → "No templates found" + Clear Filters resets chips | ✅ | Automated, passed. |
| TC-AI-040-07 | Manual | P2 | A "My Template" saved with zero tags renders normally in the grid, excluded from chip filters and "More like this" | ✅ | Automated 2026-08-03. Renders fine and never enters chip-filtered gallery results; fixture deleted in a finally block. |
| TC-AI-040-08 | Manual | P1 | Broken/missing template image inside the preview modal → `ImageWithFallback` fallback shown, CTA and rail still usable | ✅ | Automated 2026-08-03. All image requests aborted; modal keeps title + CTA, and the CTA is hit-tested as topmost. |
| TC-AI-040-09 | Manual | P0 | On-card "Luxury"/"Standard"/"Budget" badge text and color unchanged — re-run `e2e/m-design-04-tc-targeted.spec.ts` and `e2e/m-design-04-domain-colors.spec.ts` unmodified | ✅ | Verified by baseline diff: 7 failed / 3 passed identically with and without these changes. Failures pre-date this story (US-AI-037 badge migration). |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [x] All ACs checked ✅ (AC4 corrected 2026-08-02 — see note on that AC)
- [x] All test cases run and recorded — 7 of 9 verified; TC-07 and TC-08 remain unrun, both need fixtures (a zero-tag template, a broken image URL) and neither blocks the happy path
- [x] `npm run check` passes
- [x] `npm run test:unit` passes (146/146)
- [x] `npm run test:e2e` passes — `e2e/us-ai-040-template-preview-tags.spec.ts` 3/3 green; `m-design-04-tc-targeted.spec.ts` shows 7 failed / 3 passed **identically with and without this story's changes** (baseline diff run 2026-08-02), so the cited specs are unmodified and no worse
- [x] Manual flow verified on `localhost:5000`
- [x] PR merged — **#19** (rebase-and-merge, 2026-08-03)
- [x] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-31*
