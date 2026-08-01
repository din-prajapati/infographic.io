# Story Card — US-AI-041

> **Status:** ⏭️ Superseded by the layout-wireframe preview system in `client/src/lib/formatPreviews.tsx` (2026-08-02)
> **Feature:** F-AI-02-07 — Format Picker (New Design / New Template entry flow)
> **Epic:** [EPIC-AI-02](../../EPIC.md)
> **Milestone:** [M-AI-06-photo-and-format](../../milestones/M-AI-06-photo-and-format.md)
> **Size:** M (~3-4h) — not spent
> **Depends on:** [US-AI-039](../US-AI-039/STORY.md) (satisfied — merged before this story was superseded)
> **Linear:** LIN-US-AI-041
> **Created:** 2026-07-31 | **Closed:** 2026-08-02

---

> **⏭️ SUPERSEDED — no separate work needed.** This story's *problem* (format tiles rendered one flat, identical silhouette that told the user nothing) is solved; its *prescribed solution* (device-mockup frames for social formats, flat icon art for print) was overtaken by a different visual direction chosen during a live review on 2026-08-01.
>
> Shown the Templates gallery's premium-template thumbnails, the product owner asked for the picker's tiles to match **that** language — flat `<rect>` layout wireframes drawn from one shared palette — rather than Canva's photo-mockup device frames. That direction shipped as `client/src/lib/formatPreviews.tsx`: 25 bespoke artworks covering all 23 taxonomy formats plus a fallback, each keeping its format's true aspect ratio.
>
> **AC-by-AC outcome:**
>
> | AC | Outcome |
> |---|---|
> | AC1 — device-mockup frames for social | ❌ Not built. Superseded by per-format layout wireframes. |
> | AC2 — flat icon art for print/email, differentiated per platform group | ⚠️ Differentiated on a *finer* axis than asked: every format has bespoke art (a SOLD banner, a green open-house band, a die-cut door hanger), so there is no social-vs-print split to encode. |
> | AC3 — no pixel dimensions or technical detail | ✅ Held. |
> | AC4 — renders for narrowest portrait and square | ✅ Held via per-format `viewBox`. |
> | AC5 — Gate 1 green, US-AI-039 layout unaffected | ✅ Held. |
> | AC6 — never render an empty tile | ✅ Held via `FALLBACK` art (`formatPreviews.tsx:420`). |
>
> **AC1 and AC2 also reference dead code.** Both are written against `ShapePreview`, which the wireframe rewrite deleted; it now survives only in a comment. Re-scoping this card against the current component would mean rewriting every AC — and building it as written would put two competing preview styles in one picker.
>
> Keeping this card as a record of the original ask. Do not implement it separately. The story-level hardening lock (`.orion/state/locks/US-AI-041.json`) is left in place as the record that it passed AC-coverage certification before being superseded.

---

## Story

*As a* real estate agent picking a format in the Format Picker
*I want* social-platform formats to show a realistic device-style preview instead of a flat abstract shape
*So that* I can tell at a glance what a "Story" or "Post" will actually look like, the way Canva's own format tiles do

---

## Background

A live UX audit compared Canva's "Create a design" format tiles against `client/src/lib/formatTaxonomy.ts` + the render logic inside `client/src/components/pages/FormatPickerDialog.tsx` (`ShapePreview`, lines 65-110, and `FormatTile`, lines 113-140, as of the pre-US-AI-039 layout). Canva's format tiles use a photo-mockup device-frame preview (a phone-shaped frame with a sample image) for social-platform formats — Instagram, Facebook, Stories — but flat, abstract icon-style art for print/document formats (Flyer, Postcard, Letter). This codebase currently renders exactly one style — a flat SVG shape-silhouette rectangle scaled to the format's aspect ratio (`ShapePreview`) — for every format regardless of platform group. There is no reusable device-mockup component anywhere in the codebase; this is genuinely new art/UI, not a relocation of existing code.

**Hard sequencing dependency:** US-AI-039 (already in flight, not yet merged) rewrites `FormatPickerDialog.tsx`'s entire container from a 3-step wizard (`step: "format" | "library" | "custom"`) into a persistent rail + inline-content layout, and explicitly states it relocates `FormatTile`/`ShapePreview` "unchanged — no visual or copy changes to the tiles themselves" (US-AI-039 AC2, T2). This story is exactly the visual change US-AI-039 declined to make. Implementing both at once on the same lines would produce a merge conflict and duplicate/wasted work; this story must wait for US-AI-039 to land, then re-read the merged component before touching it (the file's step/rail structure will differ from what's described in the Format Picker section of this story's Background — treat line numbers here as pre-merge references only).

**Which format groups get the mockup treatment:** the taxonomy's platform groups (`client/src/lib/formatTaxonomy.ts:35-71`) are Instagram, Facebook, Print, Email, Other (LinkedIn Post lives under "Other"). Social-platform groups (Instagram, Facebook, and LinkedIn under "Other") get the device-mockup preview; Print and Email keep flat icon-style art (either the existing `ShapePreview` as-is, if it already reads as icon-style post-US-AI-039, or a lightly restyled flat icon — confirmed once the merged component is read, see AC2).

---

## Acceptance Criteria

- [ ] **AC1 [happy-path]:** Format tiles for Instagram Post/Story/Reel Cover, Facebook Post/Cover/Story, and LinkedIn Post (the "Other" group entry) render a device-mockup-style preview (a phone/screen-shaped frame containing a representative sample fill) in place of the current flat `ShapePreview` rectangle silhouette — verified against whatever container renders these tiles post-US-AI-039 merge (rail+inline layout), not the pre-merge 3-step wizard.
- [ ] **AC2 [happy-path]:** Format tiles for Print (Flyer, Postcard, Open House Sign) and Email (Header Banner) continue to render flat, abstract icon-style art — either the existing `ShapePreview` unchanged (if it reads as icon-style in the merged US-AI-039 layout) or a minimally adjusted flat icon variant. This differentiation must be deliberate and verifiable in code (e.g. a per-format or per-platform-group flag choosing which preview component renders), not applied uniformly to every tile.
- [ ] **AC3 [compliance]:** No pixel dimensions, aspect-ratio numbers, or AI-model/technical details are introduced anywhere in the new mockup preview or its surrounding UI — same standing rule as US-AI-038 AC8 and US-AI-039 AC7.
- [ ] **AC4 [edge-case]:** The device-mockup preview renders correctly (no layout overflow, no broken frame) for both the narrowest portrait ratio in the taxonomy (Instagram Story / Facebook Story, 1080×1920) and the widest square/near-square ratio used for social (Facebook Post, 1200×1200) — the mockup frame must not assume a single fixed aspect ratio.
- [ ] **AC5 [regression]:** `npm run check` and `npm run test:unit` pass. The reorganized single-modal rail + inline-content layout shipped by US-AI-039 is otherwise unaffected — no changes to `activeCategory` state, rail item rendering, inline-library merge, custom-size flow, or keyboard focus/`aria-pressed` behavior (US-AI-039 AC1, AC3, AC4, AC10).
- [ ] **AC6 [error-path]:** If the device-mockup preview's internal sample-fill asset (e.g. an inline SVG pattern or placeholder image) fails to render for any reason, the tile falls back to the existing flat `ShapePreview` rendering rather than showing a broken/empty tile — a format tile must never render visually empty.

---

## Out of Scope

- Any change to `FORMAT_TAXONOMY`'s data shape, dimensions, or orientation buckets (`client/src/lib/formatTaxonomy.ts`) — read as-is, no data model changes, same constraint as US-AI-039's Out of Scope
- Any change to the rail/category navigation structure, `activeCategory` state, inline-library merge, or custom-size flow that US-AI-039 builds — this story only changes the visual content inside a tile, not the container around it
- The Templates Gallery screen's preview modal or tag-based filters — that is **US-AI-040**, a separate story on a different file (`TemplatesPage.tsx`)
- Real property/listing photos inside the mockup preview — the sample fill is generic placeholder art, not user data
- A secondary pill-row sub-filter within a category — unrelated to this story, and already ruled out of scope for US-AI-039

---

## Engineering / PR

- **Branch:** `feat/ai-us-ai-041-format-mockup-preview`
- **PR:** #_____ (fill when opened)
- **Primary files touched:**
  - `client/src/components/pages/FormatPickerDialog.tsx` (extend/add a device-mockup preview variant alongside the existing `ShapePreview`; wire `FormatTile` to choose mockup vs. flat-icon per platform group — exact location depends on the post-US-AI-039 merged structure)
  - `client/src/lib/formatTaxonomy.ts` (read-only — confirm whether an explicit `previewStyle` field is worth adding to `PlatformFormat`, or whether platform-group name alone is sufficient to route mockup vs. icon; prefer no data-shape change per Out of Scope unless genuinely necessary for AC2's per-format flag)

---

## AI Implementation Prompt

> Copy this block into Claude Code to implement the story.

```
Context: Buildographic (React + NestJS). See CLAUDE.md.

Story: US-AI-041 — Format Picker: device-mockup preview for social formats

PRECONDITION: Do not start until US-AI-039 (branch feat/ai-us-ai-039-format-picker-reorg)
is merged to main. Re-read the merged FormatPickerDialog.tsx first — its structure
(rail + inline content) differs from the pre-merge 3-step wizard this story's
Background section describes; the ShapePreview/FormatTile rendering logic will
have been relocated but declared visually unchanged by US-AI-039.

1. Add a device-mockup-style preview (a phone/screen-shaped frame containing a
   representative sample fill) as an alternative to the existing flat
   ShapePreview rectangle-silhouette component.

2. Wire FormatTile (or its post-merge equivalent) so social-platform formats —
   Instagram Post/Story/Reel Cover, Facebook Post/Cover/Story, LinkedIn Post
   (under the "Other" platform group in formatTaxonomy.ts) — render the new
   mockup preview, while Print (Flyer/Postcard/Open House Sign) and Email
   (Header Banner) formats keep the existing flat ShapePreview or an icon-style
   variant. The choice must be deliberate and traceable in code (e.g. route on
   platform group name), not a uniform change to every tile.

3. Ensure the mockup frame handles both narrow-portrait (1080x1920, Instagram/
   Facebook Story) and near-square (1200x1200, Facebook Post) aspect ratios
   without overflow or a broken frame.

4. If the mockup's internal sample-fill asset fails to render, fall back to the
   existing flat ShapePreview rather than leaving a broken/empty tile.

Implementation rules:
- Touch ONLY the files listed in "Primary files touched"
- Do NOT implement anything in "Out of scope" — no FORMAT_TAXONOMY data-shape
  changes, no changes to the rail/inline-library/custom-size flow from US-AI-039,
  no Templates Gallery changes (that's US-AI-040, a different story)
- No aspect ratio numbers or pixel dimensions visible anywhere in the UI text
- Preserve every US-AI-039 behavior: activeCategory rail, inline library merge,
  custom-size form, last-used pre-selection, keyboard focus/aria-pressed
- When done: list files changed, ACs checked, test commands run
```

---

## Test Cases

| TC ID | Type | Priority | Scenario | Status | Finding |
|-------|------|----------|----------|--------|---------|
| TC-AI-041-01 | Manual | P0 | Open Format Picker → Instagram Post/Story/Reel Cover tiles show device-mockup preview, not flat shape | 🔲 | |
| TC-AI-041-02 | Manual | P0 | Facebook Post/Cover/Story and LinkedIn Post (Other group) tiles show device-mockup preview | 🔲 | |
| TC-AI-041-03 | Manual | P0 | Print (Flyer/Postcard/Open House Sign) and Email (Header Banner) tiles keep flat icon-style art, visually distinct from social tiles | 🔲 | |
| TC-AI-041-04 | Manual | P1 | Instagram Story tile (1080×1920, narrow portrait) mockup frame renders with no overflow or clipping | 🔲 | |
| TC-AI-041-05 | Manual | P1 | Facebook Post tile (1200×1200, near-square) mockup frame renders correctly, no distortion | 🔲 | |
| TC-AI-041-06 | Manual | P1 | No pixel dimensions or aspect-ratio numbers visible anywhere in the picker after this change | 🔲 | |
| TC-AI-041-07 | Manual | P1 | US-AI-039's rail navigation, inline library, custom-size form, and keyboard focus/aria-pressed behavior all still work unchanged | 🔲 | |
| TC-AI-041-08 | Manual | P2 | Simulate the mockup's sample-fill asset failing → tile falls back to flat ShapePreview instead of rendering empty | 🔲 | |

**Status key:** 🔲 Not run · ✅ Pass · ⚠️ Pass with finding · ❌ Fail · ⏸ Blocked

---

## Definition of Done

- [ ] All ACs checked ✅
- [ ] All test cases run and recorded
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual flow verified on `localhost:5000`
- [ ] US-AI-039 confirmed merged to `main` before this story's implementation began
- [ ] PR merged (PR #_____)
- [ ] [TASKS.md](./TASKS.md) task list fully checked

---

*Story created: 2026-07-31*
