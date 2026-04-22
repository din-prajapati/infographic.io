# M-DESIGN-04 — Domain Color System

> **Epic:** [EPIC-DESIGN-02](../EPIC.md)  
> **Status:** 🔲 Not Started  
> **Target:** 2026-05-20  
> **Prerequisite:** M-DESIGN-03 closed (new globals.css baseline in place)

---

## Goal

Replace the **249 hardcoded color occurrences** scattered across `.ts` data files and component files with CSS token variables from `design-tokens.css`. This milestone unifies the real estate domain colour system so all category chips, template categories, and badge tiers reference a single source of truth.

---

## Stories

| Story | Title | Status |
|-------|-------|--------|
| [US-DESIGN-007](../stories/US-DESIGN-007/STORY.md) | Real estate category color token migration | 🔲 |
| [US-DESIGN-008](../stories/US-DESIGN-008/STORY.md) | Template badge tier token migration | 🔲 |

---

## Hardcoded values being replaced

### categoryChipsData.ts — 6 hex strings (US-007)

| Old value | Category | New token |
|-----------|----------|-----------|
| `'#FF8C00'` | property-listings | `--chip-property-listings` (`#3B82F6`) |
| `'#4CAF50'` | open-house | `--chip-open-house` (`#F97316`) |
| `'#2196F3'` | just-sold | `--chip-just-sold` (`#10B981`) |
| `'#9C27B0'` | agent-branding | `--chip-agent-branding` (`#F59E0B`) |
| `'#FF5722'` | market-stats | `--chip-market-stats` (`#6366F1`) |
| `'#00BCD4'` | neighborhood | `--chip-neighborhood` (`#14B8A6`) |

### templateData.ts — 4 hex strings (US-007)

| Old value | Category | New token |
|-----------|----------|-----------|
| `'#3B82F6'` | listing-announcements | `--category-listing-announcements` |
| `'#8B5CF6'` | property-features | `--category-property-features` |
| `'#10B981'` | status-updates | `--category-status-updates` |
| `'#F59E0B'` | agent-branding | `--category-agent-branding` |

### TemplatesPage.tsx — 5 badgeColor strings (US-008)

| Old value | Badge | New token |
|-----------|-------|-----------|
| `"bg-foreground/90 text-background"` | Luxury | `--badge-luxury-bg` / `--badge-luxury-text` |
| `"bg-muted-foreground/80 text-background"` | Standard | `--badge-standard-bg` / `--badge-standard-text` |
| `"bg-primary/80 text-primary-foreground"` | Budget | `--badge-budget-bg` / `--badge-budget-text` |
| `"bg-purple-600 text-white"` | Custom | `--badge-custom-bg` / `--badge-custom-text` |
| `"bg-blue-600 text-white"` | API | `--badge-api-bg` / `--badge-api-text` |

### TemplateCategoryView.tsx — gray-* Tailwind classes (US-007)

All `text-gray-*`, `bg-gray-*`, `border-gray-*`, `bg-yellow-100 text-yellow-700` → semantic tokens. See US-DESIGN-007 TASKS.md for full mapping.

---

## Milestone done when

- [ ] US-DESIGN-007 PR merged — `categoryChipsData.ts` + `templateData.ts` + `TemplateCategoryView.tsx` use tokens
- [ ] US-DESIGN-008 PR merged — `TemplatesPage.tsx` badge colors use CSS token classes
- [ ] Grep check: `grep -r "FF8C00\|4CAF50\|9C27B0\|FF5722\|00BCD4" client/src` → 0 results
- [ ] Grep check: `grep -r "bg-purple-600\|bg-blue-600\|bg-purple-500" client/src/components/pages/TemplatesPage.tsx` → 0 results
- [ ] All category chips and template category cards render correct colors in both Light and Dark modes

---

*Milestone created: 2026-04-17*
