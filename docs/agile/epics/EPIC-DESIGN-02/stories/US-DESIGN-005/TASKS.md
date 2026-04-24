# PR Task List — US-DESIGN-005

> **Story:** [STORY.md](./STORY.md)  
> **Branch:** `feat/epic-design-02-ui-redesign`  
> **PR:** #2  
> **Linear:** LIN-XXX  
> **Type:** feat

---

## Three Pillars Pre-flight

- [x] **Brain** — STORY.md ACs written, out-of-scope listed, AI prompt ready ✅
- [x] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands ✅
- [x] **Map** — `client/src/design-tokens.css` is the reference (new values)
- [x] **Env** — `client/src/styles/globals.css` is the only file to edit

---

## PR Scope Summary

**One-liner:**
```
feat(design): replace teal/cool-grey color scheme with blue/amber/warm-cream — US-DESIGN-005
```

---

## Task Breakdown

### T1 — Update light-mode `:root` color tokens
**File:** `client/src/styles/globals.css`  
**AC(s) covered:** AC1, AC2, AC3, AC7, AC8, AC9  
**Changes:** Replace all HSL values in `:root` block as per STORY.md token map (light section).

```bash
git add client/src/styles/globals.css
git commit -m "feat(design): T1 update light-mode color tokens to blue/amber/warm palette — US-DESIGN-005"
```

---

### T2 — Update dark-mode `.dark` color tokens
**File:** `client/src/styles/globals.css`  
**AC(s) covered:** AC4, AC8  
**Changes:** Replace all HSL values in `.dark` block as per STORY.md token map (dark section).

```bash
git add client/src/styles/globals.css
git commit -m "feat(design): T2 update dark-mode color tokens to warm-black palette — US-DESIGN-005"
```

---

### T3 — Update page background gradients + glass tint
**File:** `client/src/styles/globals.css`  
**AC(s) covered:** AC5, AC6, AC7  
**Changes:**
- `--page-bg` (light): replace `hsl(174 30% 96%)` stop with `hsl(210 18% 97%)`; outer stops to `hsl(45 15% 97%)`
- `--page-bg` (dark): replace `hsl(200 30% 7%)` / `hsl(174 20% 6%)` stops with `hsl(45 ...)` warm darks
- `--glass-tint` (light): `rgba(20,184,166,0.03)` → `rgba(12,160,235,0.02)`
- `--glass-tint` (dark): `rgba(20,184,166,0.08)` → `rgba(12,160,235,0.06)`

```bash
git add client/src/styles/globals.css
git commit -m "feat(design): T3 update page-bg gradients and glass-tint to blue — US-DESIGN-005"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `client/src/styles/globals.css` | T1, T2, T3 | AC1–AC9 | Single file, three logical commit groups |

---

## Exact Test Commands

```bash
# 1. TypeScript check — must pass before PR
npm run check

# 2. Unit tests — must pass before PR
npm run test:unit

# 3. Manual verification
# Open localhost:5000
# → Templates page: background warm cream, primary button blue
# → Toggle Dark: background warm dark, not navy
# → Account page: same theme consistency
# → Editor: floating toolbar tokens update with theme
```

---

## Task Checklist

- [x] T1 — Light-mode `:root` tokens updated
- [x] T2 — Dark-mode `.dark` tokens updated
- [x] T3 — Page-bg gradients + glass-tint updated
- [x] `npm run check` passes (no new errors vs pre-existing baseline)
- [x] `npm run test:unit` passes — 34/34 ✅
- [x] Manual smoke: Templates + Editor + Account in Light + Dark
- [x] PR opened with story card as description — PR #2
- [x] STORY.md ACs updated ✅

---

## Anti-Patterns to Avoid

- Do NOT touch any component `.tsx` files
- Do NOT add new CSS variables — only update values of existing ones
- Do NOT change `--radius`, `--shadow-*`, or font tokens (not in scope)
- Do NOT rename any token names — only update the HSL values

---

## PR Open Command

```bash
gh pr create \
  --title "[US-DESIGN-005] New color scheme: blue/amber/warm-cream palette" \
  --label "epic:design,type:feat,priority:P1" \
  --body "$(cat docs/agile/epics/EPIC-DESIGN-02/stories/US-DESIGN-005/STORY.md)"
```

---

*Tasks created: 2026-04-17*
