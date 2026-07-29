# PR Task List — US-AI-038

> **Story:** [STORY.md](./STORY.md)
> **Branch:** `feat/ai-us-ai-038-format-picker`
> **PR:** #_____ (fill when opened)
> **Type:** feat

---

## Three Pillars Pre-flight (check before starting AI session)

- [ ] **Brain** — STORY.md filled: ACs written, out-of-scope listed
- [ ] **Muscle** — file list + ordered tasks + exact test commands (below)
- [ ] **Map** — [ARCHITECTURE.mmd](../../ARCHITECTURE.mmd) exists for this epic
- [ ] **Env** — N/A (no new env vars)
- [ ] **Dependency** — US-AI-037 (Save as Template) merged, so the Library step has real data to browse

---

## PR Scope Summary

**One-liner:** Unified Format Picker for New Design / New Template, grouped by platform, with library browsing, custom size, and last-format memory.
```
feat(ai): format picker for New Design / New Template — US-AI-038
```

> **Note on size:** naturally two sessions — T1-T2 (taxonomy + picker shell/step 1) can land and be manually reviewed before T3-T5 (library integration + custom size + memory) build on top. Consider splitting into two PRs if a session runs long.

---

## Task Breakdown

### T1 — Format taxonomy data
**File:** `client/src/lib/formatTaxonomy.ts` (new)
- Platform-grouped table from STORY.md, each entry: name, width, height, orientation bucket

### T2 — Format Picker shell (step 1: choose format)
**File:** `client/src/components/pages/FormatPickerDialog.tsx` (new)
- Tiles grouped by platform section, shape preview per tile (no dimensions/numbers shown)
- "Custom size" entry point

### T3 — Library step (step 2: choose blank or existing)
**File:** same component, extended
- Fetch user's own templates tagged with the chosen format via `canvasTemplatesApi`
- "Start Blank" card always present first; existing templates shown alongside
- Zero-templates case shows only Start Blank + Custom size, no error state

### T4 — Wire entry points + last-format memory
**Files:** `client/src/App.tsx`, `client/src/lib/storage.ts`
- "New Design" and "New Template" both open the same dialog
- Persist + read back "last format used" to pre-highlight on reopen

### T5 — Tag existing premium templates
**Files:** `client/src/lib/premiumTemplates.ts`, `client/src/lib/starterCanvasTemplates.ts`
- Add `platformTag` to the 5 existing premium templates (Instagram Story, Instagram Square, Print, Email header, MLS sheet) so they're browsable by format from day one

---

## Exact Test Commands

```bash
npm run check
npm run test:unit
# Manual: New Design -> pick Instagram Story -> confirm library + Start Blank shown
# Manual: New Template -> same dialog, same behavior
# Manual: pick a format with 0 saved templates -> only Start Blank + Custom size
# Manual: Custom size entry -> canvas opens at exact entered dimensions
# Manual: reopen picker after a prior pick -> last format pre-highlighted
```

---

## Task Checklist

- [ ] T1 — Format taxonomy data
- [ ] T2 — Picker shell (step 1)
- [ ] T3 — Library step (step 2)
- [ ] T4 — Wire entry points + last-format memory
- [ ] T5 — Tag existing premium templates
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual test recorded ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Test Is Truth

> Do not weaken, skip, or modify a failing test to make it pass. Fix the code.

---

## Anti-Patterns to Avoid in This Story

- Do NOT show admin-curated or marketplace templates in the Library step — own templates only, for now
- Do NOT show pixel dimensions, aspect ratios, or any technical spec in the picker UI
- Do NOT redesign the existing content-category gallery browse — this adds a parallel axis, not a replacement
- Do NOT build template creation here — this story only consumes what US-AI-037 makes possible

---

*Tasks created: 2026-07-29*
