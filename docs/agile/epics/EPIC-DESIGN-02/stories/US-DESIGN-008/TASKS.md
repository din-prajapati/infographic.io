# PR Task List — US-DESIGN-008

> **Story:** [STORY.md](./STORY.md)  
> **Branch:** `feat/design-us-design-008-badge-tier-colors`  
> **PR:** #_____  
> **Linear:** LIN-XXX  
> **Type:** feat

---

## Three Pillars Pre-flight

- [ ] **Brain** — STORY.md ACs written, out-of-scope listed, AI prompt ready ✅
- [ ] **Muscle** — This TASKS.md has file list + ordered tasks + exact test commands ✅
- [ ] **Map** — `client/src/design-tokens.css` §Badge Tiers is the reference
- [ ] **Env** — Single file: `client/src/components/pages/TemplatesPage.tsx` (badge colors only)

---

## PR Scope Summary

**One-liner:**
```
feat(design): replace badge tier hardcoded Tailwind classes with CSS token inline styles — US-DESIGN-008
```

---

## Task Breakdown

### T1 — Replace badge tier color strings with CSS token inline styles
**File:** `client/src/components/pages/TemplatesPage.tsx`  
**AC(s) covered:** AC1–AC6  
**Changes:** Locate the badge tier color map / object in TemplatesPage and replace all 5 Tailwind class strings with inline style objects referencing `--badge-*-bg` and `--badge-*-text` CSS variables.

```bash
git add client/src/components/pages/TemplatesPage.tsx
git commit -m "feat(design): T1 replace badge tier colors with CSS token inline styles — US-DESIGN-008"
```

---

## File-to-Task Mapping

| File | Task(s) | AC(s) | Notes |
|------|---------|-------|-------|
| `client/src/components/pages/TemplatesPage.tsx` | T1 | AC1–AC6 | 5 badge color value swaps |

---

## Exact Test Commands

```bash
# 1. TypeScript check — must pass before PR
npm run check

# 2. Unit tests — must pass before PR
npm run test:unit

# 3. Grep verification — must return 0 results
grep -n "bg-purple-600\|bg-blue-600\|bg-purple-500" client/src/components/pages/TemplatesPage.tsx

# 4. Manual verification
# Open localhost:5000 → /templates
# → Find templates with Luxury badge: dark amber/brown background
# → Find templates with Standard badge: dark blue background
# → Find templates with Budget badge: dark green background
# → Find templates with Custom badge: dark purple background
# → Find templates with API badge: navy background
# → Toggle Dark mode: all 5 badge colors still clearly visible
```

---

## Task Checklist

- [x] T1 — Badge tier color strings replaced with CSS token inline styles; also fixed overlay Custom badge (bg-purple-500 → token)
- [x] `npm run check` passes ✅ — 2026-04-23
- [x] `npm run test:unit` passes ✅ — 2026-04-23
- [x] Grep check: 0 `bg-purple-600/bg-blue-600` matches in TemplatesPage.tsx ✅ — 2026-04-23
- [x] Manual smoke: all 5 badge tiers visible in Light + Dark ✅ — 2026-04-24
- [ ] PR opened with story card as description
- [x] STORY.md ACs updated ✅

---

## Anti-Patterns to Avoid

- Do NOT change badge logic, tier assignment, or filtering code
- Do NOT add new Tailwind utilities or CSS classes for badges
- Do NOT change any template card layout, typography, or image handling
- Do NOT touch category chip or filter pill code (US-DESIGN-007 / US-DESIGN-009)

---

## PR Open Command

```bash
gh pr create \
  --title "[US-DESIGN-008] Template badge tier color token migration" \
  --label "epic:design,type:feat,priority:P1" \
  --body "$(cat docs/agile/epics/EPIC-DESIGN-02/stories/US-DESIGN-008/STORY.md)"
```

---

*Tasks created: 2026-04-17*
