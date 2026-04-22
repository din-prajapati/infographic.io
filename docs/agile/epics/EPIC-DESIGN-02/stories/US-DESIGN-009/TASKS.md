# PR Task List — US-DESIGN-009

> **Story:** [STORY.md](./STORY.md)  
> **Branch:** `feat/design-us-design-009-templates-page-visual`  
> **PR:** #_____  
> **Linear:** LIN-XXX  
> **Type:** feat

---

## Three Pillars Pre-flight

- [ ] **Brain** — STORY.md ACs written, out-of-scope listed, AI prompt ready ✅
- [ ] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands ✅
- [ ] **Map** — `design-preview-templates.html` (visual target) + `design-tokens.css` (token source)
- [ ] **Env** — Single file: `client/src/components/pages/TemplatesPage.tsx`

---

## PR Scope Summary

**One-liner:**
```
feat(design): TemplatesPage visual polish — filter pills, card headers, CTA, search — US-DESIGN-009
```

---

## Task Breakdown

### T1 — Update filter pill active/inactive styles
**File:** `client/src/components/pages/TemplatesPage.tsx`  
**AC(s) covered:** AC1  
**Changes:** Active pill → `--filter-pill-active-bg` + `--filter-pill-active-text`; inactive → transparent + border.

```bash
git add client/src/components/pages/TemplatesPage.tsx
git commit -m "feat(design): T1 update filter pill active/inactive styles to token vars — US-DESIGN-009"
```

---

### T2 — Add colored header block to template cards
**File:** `client/src/components/pages/TemplatesPage.tsx`  
**AC(s) covered:** AC2  
**Changes:** Insert a top-of-card colored div using the category `--category-*` color token.

```bash
git add client/src/components/pages/TemplatesPage.tsx
git commit -m "feat(design): T2 add category-colored header block to template cards — US-DESIGN-009"
```

---

### T3 — Update CTA button and search bar styles
**File:** `client/src/components/pages/TemplatesPage.tsx`  
**AC(s) covered:** AC3, AC4  
**Changes:** CTA button → `--btn-cta-bg` / `--btn-cta-text`; search → pill shape + shadow.

```bash
git add client/src/components/pages/TemplatesPage.tsx
git commit -m "feat(design): T3 update CTA button and search bar to token styles — US-DESIGN-009"
```

---

### T4 — Update category overview card styles
**File:** `client/src/components/pages/TemplatesPage.tsx`  
**AC(s) covered:** AC5  
**Changes:** Icon container → `--category-surface-*`; left border accent → `--category-*` color.

```bash
git add client/src/components/pages/TemplatesPage.tsx
git commit -m "feat(design): T4 update category overview cards with surface tokens — US-DESIGN-009"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `client/src/components/pages/TemplatesPage.tsx` | T1, T2, T3, T4 | AC1–AC5 | Visual-only changes, no logic |

---

## Exact Test Commands

```bash
# 1. TypeScript check — must pass before PR
npm run check

# 2. Unit tests — must pass before PR
npm run test:unit

# 3. Manual verification
# Open localhost:5000 → /templates
# Compare to design-preview-templates.html in browser side-by-side
# → Filter pills: active = solid dark navy pill
# → Template cards: colored header block at top
# → "Use Template" CTA: dark navy button
# → Search bar: pill shape with shadow
# → Category cards: icon bg + left accent border
# → Toggle Dark mode: all elements remain coherent
# → Click a filter pill: filtering still works correctly
```

---

## Task Checklist

- [ ] T1 — Filter pill active/inactive styles updated
- [ ] T2 — Template card colored header block added
- [ ] T3 — CTA button and search bar styled with tokens
- [ ] T4 — Category overview card styles updated
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Manual smoke: Templates page Light + Dark ✅
- [ ] Visual match to `design-preview-templates.html` confirmed ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Anti-Patterns to Avoid

- Do NOT change template filtering, sort, pagination, or routing logic
- Do NOT add new data fields to template objects
- Do NOT change the existing grid layout (columns, gaps) — only visual decoration
- Do NOT introduce motion/animation (not in scope for this story)

---

## PR Open Command

```bash
gh pr create \
  --title "[US-DESIGN-009] TemplatesPage visual redesign — filter pills, card headers, CTA" \
  --label "epic:design,type:feat,priority:P2" \
  --body "$(cat docs/agile/epics/EPIC-DESIGN-02/stories/US-DESIGN-009/STORY.md)"
```

---

*Tasks created: 2026-04-17*
