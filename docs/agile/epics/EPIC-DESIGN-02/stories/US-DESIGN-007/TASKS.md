# PR Task List — US-DESIGN-007

> **Story:** [STORY.md](./STORY.md)  
> **Branch:** `feat/design-us-design-007-category-color-migration`  
> **PR:** #_____  
> **Linear:** LIN-XXX  
> **Type:** feat

---

## Three Pillars Pre-flight

- [ ] **Brain** — STORY.md ACs written, out-of-scope listed, AI prompt ready ✅
- [ ] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands ✅
- [ ] **Map** — `client/src/design-tokens.css` §Domain Color System is the reference
- [ ] **Env** — Three files: `categoryChipsData.ts`, `templateData.ts`, `TemplateCategoryView.tsx`

---

## PR Scope Summary

**One-liner:**
```
feat(design): migrate category/chip hardcoded hex colors to CSS token vars — US-DESIGN-007
```

---

## Task Breakdown

### T1 — Migrate categoryChipsData.ts hex colors to CSS vars
**File:** `client/src/components/ai-chat/categoryChipsData.ts`  
**AC(s) covered:** AC1, AC5, AC6  
**Changes:** Replace 6 hardcoded hex strings with `var(--chip-*)` references per STORY.md token map.

```bash
git add client/src/components/ai-chat/categoryChipsData.ts
git commit -m "feat(design): T1 migrate chip colors to CSS var tokens — US-DESIGN-007"
```

---

### T2 — Migrate templateData.ts hex colors to CSS vars
**File:** `client/src/components/ai-chat/templateData.ts`  
**AC(s) covered:** AC2, AC5, AC7  
**Changes:** Replace 4 hardcoded hex strings with `var(--category-*)` references per STORY.md token map.

```bash
git add client/src/components/ai-chat/templateData.ts
git commit -m "feat(design): T2 migrate template category colors to CSS var tokens — US-DESIGN-007"
```

---

### T3 — Replace gray-* Tailwind classes in TemplateCategoryView.tsx
**File:** `client/src/components/ai-chat/TemplateCategoryView.tsx`  
**AC(s) covered:** AC3, AC4, AC7  
**Changes:** Replace all `text-gray-*`, `bg-gray-*`, `border-gray-*`, and `bg-yellow-100 text-yellow-700` with semantic token classes per STORY.md mapping table.

```bash
git add client/src/components/ai-chat/TemplateCategoryView.tsx
git commit -m "feat(design): T3 replace gray-* classes with semantic tokens in TemplateCategoryView — US-DESIGN-007"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `client/src/components/ai-chat/categoryChipsData.ts` | T1 | AC1, AC5, AC6 | 6 hex → var() replacements |
| `client/src/components/ai-chat/templateData.ts` | T2 | AC2, AC5, AC7 | 4 hex → var() replacements |
| `client/src/components/ai-chat/TemplateCategoryView.tsx` | T3 | AC3, AC4, AC7 | ~12 class swaps |

---

## Exact Test Commands

```bash
# 1. TypeScript check — must pass before PR
npm run check

# 2. Unit tests — must pass before PR
npm run test:unit

# 3. Grep verification — must return 0 results
grep -r "FF8C00\|4CAF50\|9C27B0\|FF5722\|00BCD4\|2196F3" client/src

# 4. Manual verification
# Open localhost:5000 → AI Chat tab → Design tab
# → Category chips: blue(listings), orange(open-house), emerald(just-sold), amber(agent), indigo(market), teal(neighborhood)
# → TemplatesPage category cards: no gray raw colors, uses themed tokens
# → Toggle Dark: category colors remain visible and distinctive
```

---

## Task Checklist

- [ ] T1 — `categoryChipsData.ts` hex colors migrated to CSS vars
- [ ] T2 — `templateData.ts` hex colors migrated to CSS vars
- [ ] T3 — `TemplateCategoryView.tsx` gray-* classes replaced with semantic tokens
- [ ] `npm run check` passes ✅
- [ ] `npm run test:unit` passes ✅
- [ ] Grep check: 0 old hex colors in client/src ✅
- [ ] Manual smoke: chips + category view in Light + Dark ✅
- [ ] PR opened with story card as description ✅
- [ ] STORY.md ACs updated ✅

---

## Anti-Patterns to Avoid

- Do NOT change component logic, event handlers, or data shape
- Do NOT add new CSS variables — use only what's in `design-tokens.css`
- Do NOT touch `TemplatesPage.tsx` badge colors (US-DESIGN-008)
- Do NOT change `templateData.ts` image URLs or template names — only the `color` field

---

## PR Open Command

```bash
gh pr create \
  --title "[US-DESIGN-007] Real estate category color token migration" \
  --label "epic:design,type:feat,priority:P1" \
  --body "$(cat docs/agile/epics/EPIC-DESIGN-02/stories/US-DESIGN-007/STORY.md)"
```

---

*Tasks created: 2026-04-17*
