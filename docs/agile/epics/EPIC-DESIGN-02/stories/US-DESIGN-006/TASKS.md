# PR Task List — US-DESIGN-006

> **Story:** [STORY.md](./STORY.md)  
> **Branch:** `feat/epic-design-02-ui-redesign`  
> **PR:** #2  
> **Linear:** LIN-XXX  
> **Type:** feat

---

## Three Pillars Pre-flight

- [x] **Brain** — STORY.md ACs written, out-of-scope listed, AI prompt ready ✅
- [x] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands ✅
- [x] **Map** — `client/src/design-tokens.css` §Typography is the reference
- [x] **Env** — Three files to touch: `index.html`, `tailwind.config.ts`, `globals.css`

---

## PR Scope Summary

**One-liner:**
```
feat(design): add Outfit display font via Google Fonts — US-DESIGN-006
```

---

## Task Breakdown

### T1 — Add Google Fonts link to index.html
**File:** `index.html`  
**AC(s) covered:** AC1  
**Changes:** Add preconnect + stylesheet link for Outfit 400/500/600/700 inside `<head>`.

```bash
git add index.html
git commit -m "feat(design): T1 add Outfit Google Fonts link to index.html — US-DESIGN-006"
```

---

### T2 — Register display font in Tailwind config
**File:** `tailwind.config.ts`  
**AC(s) covered:** AC2  
**Changes:** Add `display: ['Outfit', 'Inter', 'sans-serif']` under `theme.extend.fontFamily`.

```bash
git add tailwind.config.ts
git commit -m "feat(design): T2 register Outfit as display font in tailwind.config — US-DESIGN-006"
```

---

### T3 — Add --font-display CSS variable to globals.css
**File:** `client/src/styles/globals.css`  
**AC(s) covered:** AC3  
**Changes:** Add `--font-display: 'Outfit', 'Inter', sans-serif;` in `:root` block.

```bash
git add client/src/styles/globals.css
git commit -m "feat(design): T3 add --font-display CSS variable to globals.css — US-DESIGN-006"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `index.html` | T1 | AC1 | Add preconnect + stylesheet link |
| `tailwind.config.ts` | T2 | AC2 | Add fontFamily.display key |
| `client/src/styles/globals.css` | T3 | AC3 | Add --font-display var in :root |

---

## Exact Test Commands

```bash
# 1. TypeScript check — must pass before PR
npm run check

# 2. Unit tests — must pass before PR
npm run test:unit

# 3. Manual verification
# Open localhost:5000 → DevTools → Network → Filter by "Outfit"
# → Outfit font file should load (200 OK from fonts.gstatic.com)
# → DevTools → Elements → any h1/h2 with font-display class → Computed → font-family shows Outfit
# → Body text should still be Inter
```

---

## Task Checklist

- [x] T1 — Outfit Google Fonts link added to `client/index.html`
- [x] T2 — `tailwind.config.ts` `fontFamily.display` added
- [x] T3 — `--font-display` CSS variable added to `globals.css`
- [x] `npm run check` passes (no new errors vs pre-existing baseline)
- [x] `npm run test:unit` passes — 34/34 ✅
- [x] Manual smoke: Outfit loaded in browser DevTools Fonts panel
- [x] PR opened with story card as description — PR #2
- [x] STORY.md ACs updated ✅

---

## Anti-Patterns to Avoid

- Do NOT apply `font-family: var(--font-display)` to any elements (M-DESIGN-05 scope)
- Do NOT change `--font-sans` or any existing font variable values
- Do NOT self-host the font file in this story
- Do NOT use `font-display: optional` or other loading strategies (keep it simple)

---

## PR Open Command

```bash
gh pr create \
  --title "[US-DESIGN-006] Add Outfit display font via Google Fonts" \
  --label "epic:design,type:feat,priority:P1" \
  --body "$(cat docs/agile/epics/EPIC-DESIGN-02/stories/US-DESIGN-006/STORY.md)"
```

---

*Tasks created: 2026-04-17*
