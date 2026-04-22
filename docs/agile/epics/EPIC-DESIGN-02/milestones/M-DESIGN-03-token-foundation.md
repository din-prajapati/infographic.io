# M-DESIGN-03 — Token Foundation

> **Epic:** [EPIC-DESIGN-02](../EPIC.md)  
> **Status:** ✅ Done  
> **Target:** 2026-05-10  
> **Prerequisite:** EPIC-DESIGN-01 M-DESIGN-02 closed (dark-mode token baseline in `globals.css`)

---

## Goal

Replace the color scheme in `globals.css` with the new warm-cream / electric-blue / amber palette from `design-tokens.css`, and add the Outfit display font. No component files touched in this milestone — only the token and config layer.

After this milestone the app will visually shift to the new palette on every page without any component changes.

---

## Stories

| Story | Title | Status |
|-------|-------|--------|
| [US-DESIGN-005](../stories/US-DESIGN-005/STORY.md) | New color scheme in `globals.css` | ✅ |
| [US-DESIGN-006](../stories/US-DESIGN-006/STORY.md) | Outfit display font integration | ✅ |

---

## Files touched in this milestone

| File | Story | Change |
|------|-------|--------|
| `client/src/styles/globals.css` | US-005 | Replace `:root` + `.dark` HSL blocks |
| `client/src/styles/globals.css` | US-005 | Update `--page-bg` gradients |
| `client/src/styles/globals.css` | US-005 | Update glassmorphism tint tokens |
| `index.html` | US-006 | Add Google Fonts `<link>` for Outfit |
| `tailwind.config.ts` | US-006 | Add `fontFamily.display: ['Outfit', 'Inter', 'sans-serif']` |
| `client/src/styles/globals.css` | US-006 | Add `--font-display` variable |

---

## Milestone done when

- [x] US-DESIGN-005 implemented — `npm run check` + `npm run test:unit` green
- [x] US-DESIGN-006 implemented — Outfit added to Google Fonts link, tailwind display font, CSS var
- [x] Light mode: background is warm cream (`#f9f8f6`), not cool blue-grey
- [x] Dark mode: background is warm near-black (`#100f09`), not cool navy
- [x] Primary interactive elements (buttons, links, focus rings) are blue `#0ca0eb`, not teal
- [x] Secondary accent elements are amber `#f9b959`, not purple-blue
- [x] Manual smoke: theme toggle on Templates + Editor + Account — all three pages
- [ ] PR #2 merged

---

## Token replacement map (US-DESIGN-005)

```css
/* LIGHT :root — replace these HSL values */
--background:    220 20% 97%  →  45 13% 97%
--foreground:    222 47% 11%  →  45 30%  6%
--primary:       174 72% 40%  →  207 90% 49%
--secondary:     239 84% 67%  →  38  93% 66%
--secondary-foreground: 0 0% 100% → 45 30% 6%
--accent:        174 72% 95%  →  207 90% 95%
--accent-foreground: 174 72% 25% → 207 90% 35%
--muted:         220 15% 92%  →  45 10% 92%
--muted-foreground: 220 10% 42% → 45 5% 48%
--border:        220 15% 88%  →  45 10% 88%
--input:         220 15% 85%  →  45 10% 85%
--input-background: 220 15% 96% → 45 10% 96%
--ring:          174 72% 40%  →  207 90% 49%
--sidebar:       220 20% 95%  →  45 10% 95%
--sidebar-primary: 174 72% 40% → 207 90% 49%
--sidebar-accent:  174 72% 95% → 207 90% 95%
--sidebar-accent-foreground: 174 72% 25% → 207 90% 35%
--sidebar-ring:  174 72% 40%  →  207 90% 49%
--chart-1:       174 72% 40%  →  207 90% 49%
--chart-2:       239 84% 67%  →  38  93% 60%
--chart-3:       38  92% 50%  →  142 71% 40%

/* DARK .dark — replace these HSL values */
--background:    228 20%  6%  →  45  30%  4%
--foreground:    0   0%  95%  →  45  20% 96%
--card:          228 15% 10%  →  45  25%  7%
--sidebar:       228 18%  8%  →  45  28%  5%
--muted:         228 12% 14%  →  45  15% 12%
--accent:        174 50% 12%  →  207 50% 14%
--accent-foreground: 174 72% 65% → 207 90% 65%
--primary:       174 72% 45%  →  207 90% 55%
--secondary:     239 60% 55%  →  38  80% 50%
--ring:          174 72% 45%  →  207 90% 55%
--chart-1:       174 72% 40%  →  207 90% 60%

/* PAGE GRADIENTS */
--page-bg (light): replace hsl(174 ...) stops with hsl(210 18% 97%)
--page-bg (dark):  replace hsl(174 ...) / hsl(200 ...) stops with hsl(45 ...) warm darks
--glass-tint:  rgba(20,184,166,0.03) → rgba(12,160,235,0.02)
```

---

*Milestone created: 2026-04-17*
