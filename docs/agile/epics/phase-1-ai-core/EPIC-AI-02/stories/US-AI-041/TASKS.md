# PR Task List — US-AI-041

> **⏭️ SUPERSEDED 2026-08-02 — do not execute these tasks.** The format-tile
> preview problem was solved by the layout-wireframe system in
> `client/src/lib/formatPreviews.tsx` instead of the device-mockup approach
> planned below. See [STORY.md](./STORY.md) for the AC-by-AC outcome. No branch
> was cut and no PR was opened.

> **Story:** [STORY.md](./STORY.md)
> **Branch:** ~~`feat/ai-us-ai-041-format-mockup-preview`~~ (never created)
> **PR:** — (none)
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md filled: ACs written, out-of-scope listed
- [x] **Muscle** — file list + ordered tasks + exact test commands (below)
- [x] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [x] **Env** — N/A (no new env vars)
- [ ] **Dependency** — **BLOCKED until US-AI-039 merges to `main`.** Do not check this box or start implementation before then — see STORY.md "Depends on".

---

## PR Scope Summary

**One-liner:** Give social-platform format tiles (Instagram/Facebook/LinkedIn) a device-mockup-style preview in the Format Picker, while Print/Email formats keep flat icon-style art.
```
feat(ai): US-AI-041 device-mockup preview for social format tiles
```

> **Note on size:** This is a presentation-only change to tile preview art — no data model change, no container/navigation change (that's US-AI-039's completed scope). Estimated M (~3-4h) once US-AI-039 is merged and this story's file target is re-confirmed against the merged layout.

---

## Task Breakdown

### T0 — Confirm US-AI-039 has merged; re-read the merged component
**File:** `client/src/components/pages/FormatPickerDialog.tsx`
- Verify `feat/ai-us-ai-039-format-picker-reorg` has merged to `main`
- Re-read the merged file's structure (rail + inline content, per US-AI-039) before making any change — line numbers/step-state references in this story's Background are pre-merge and must not be relied on

### T1 — Device-mockup preview component
**File:** `client/src/components/pages/FormatPickerDialog.tsx`
- Add a new preview component (phone/screen-frame shape + representative sample fill) as an alternative to the existing `ShapePreview`
- Must handle both narrow-portrait (1080×1920) and near-square (1200×1200) aspect ratios without overflow

### T2 — Route social formats to the mockup, others to flat icon art
**File:** same component
- Instagram (Post, Story, Reel Cover), Facebook (Post, Cover, Story), and LinkedIn Post (under "Other" in `formatTaxonomy.ts`) render the new mockup preview
- Print (Flyer, Postcard, Open House Sign) and Email (Header Banner) keep the existing flat `ShapePreview` (or a lightly restyled icon variant)
- Routing must be a deliberate, traceable code path (e.g. keyed off platform group name) — not applied uniformly

### T3 — Fallback on asset failure
**File:** same component
- If the mockup's internal sample-fill fails to render, fall back to flat `ShapePreview` rather than an empty/broken tile

### T4 — Confirm no regression to US-AI-039 behavior
**File:** same component (verification only, no separate file)
- Rail navigation, inline library merge, custom-size flow, last-used pre-selection, and keyboard focus/`aria-pressed` behavior from US-AI-039 must be unaffected

---

## File-to-Task Mapping

| File | Tasks |
|------|-------|
| `client/src/components/pages/FormatPickerDialog.tsx` | T0, T1, T2, T3, T4 |

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
# Manual: open Format Picker -> Instagram/Facebook/LinkedIn tiles show mockup preview
# Manual: Print/Email tiles keep flat icon-style art
# Manual: Instagram Story (1080x1920) and Facebook Post (1200x1200) tiles render without overflow
# Manual: no pixel/aspect-ratio numbers visible anywhere
# Manual: US-AI-039 rail/library/custom-size/keyboard behavior unaffected
```

---

## Task Checklist

- [ ] T0 — Confirm US-AI-039 has merged; re-read the merged component
- [ ] T1 — Device-mockup preview component
- [ ] T2 — Route social formats to the mockup, others to flat icon art
- [ ] T3 — Fallback on asset failure
- [ ] T4 — Confirm no regression to US-AI-039 behavior
- [ ] `npm run check` passes
- [ ] `npm run test:unit` passes
- [ ] Manual test recorded
- [ ] PR opened with story card as description
- [ ] STORY.md ACs updated

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT start before US-AI-039 merges — same file, same render logic, guaranteed conflict/rework
- Do NOT change `FORMAT_TAXONOMY`'s data shape or dimensions
- Do NOT touch the rail/category navigation, inline-library merge, or custom-size flow US-AI-039 built
- Do NOT touch the Templates Gallery (`TemplatesPage.tsx`) — that is US-AI-040, a different story

---

*Tasks created: 2026-07-31*
